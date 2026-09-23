import type { Context, Config } from "@netlify/functions";
import { getStore, getDeployStore } from "@netlify/blobs";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { sampleTrip, blankTrip } from "./templates.mts";
import { checkUrl, fetchPage, extract, draftHotel, polishWithClaude, type Snapshot } from "./importer.mts";

// ---------- storage ----------
function store(name: string) {
  // Production data lives in the global store; previews and local dev use a deploy-scoped store.
  if (Netlify.context?.deploy?.context === "production") {
    return getStore({ name, consistency: "strong" });
  }
  return getDeployStore({ name, consistency: "strong" });
}
const trips = () => store("trips");
const files = () => store("files");

// ---------- helpers ----------
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
const fail = (status: number, message: string) => json({ error: message }, status);
const newId = (bytes = 6) => randomBytes(bytes).toString("base64url");

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

function secret() {
  return Netlify.env.get("AUTH_SECRET") || Netlify.env.get("AGENT_PASSWORD") || "";
}
function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
function issueAgentToken() {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
  const payload = `agent.${exp}`;
  return `${payload}.${sign(payload)}`;
}
function isAgent(req: Request) {
  const raw = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const parts = raw.split(".");
  if (parts.length !== 3 || !secret()) return false;
  const exp = Number(parts[1]);
  if (!exp || exp < Date.now()) return false;
  return safeEqual(sign(`${parts[0]}.${parts[1]}`), parts[2]);
}

// ---------- trip data ----------
type Trip = Record<string, any>;

async function getTrip(id: string): Promise<Trip | null> {
  if (!/^[\w-]{4,40}$/.test(id)) return null;
  return (await trips().get(`trip/${id}`, { type: "json" })) ?? null;
}
async function saveTrip(trip: Trip) {
  trip.updatedAt = new Date().toISOString();
  await trips().setJSON(`trip/${trip.id}`, trip);
}
// ---------- client access: per-trip code -> signed device session ----------
const normCode = (c: unknown) => (typeof c === "string" ? c.replace(/\D/g, "") : "");
const validCode = (c: string) => /^\d{6,8}$/.test(c);

async function uniqueCode() {
  for (let i = 0; i < 30; i++) {
    const c = String(randomInt(0, 1_000_000)).padStart(6, "0");
    if (!(await trips().get(`code/${c}`))) return c;
  }
  throw new Error("could not generate a unique code");
}

function issueClientSession(trip: Trip, days: number) {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = `c.${trip.id}.${trip.accessVersion || 1}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

// Session comes from the Authorization header, or ?s= for files and calendar links opened outside the app.
async function tripFromSession(req: Request, url: URL): Promise<Trip | null> {
  const raw = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") || url.searchParams.get("s") || "";
  const parts = raw.split(".");
  if (parts.length !== 5 || parts[0] !== "c" || !secret()) return null;
  const [, tripId, version, exp, sig] = parts;
  if (!Number(exp) || Number(exp) < Date.now()) return null;
  if (!safeEqual(sign(parts.slice(0, 4).join(".")), sig)) return null;
  const trip = await getTrip(tripId);
  if (!trip || String(trip.accessVersion || 1) !== version) return null;
  return trip;
}

// Wrong-code attempts are limited per IP address.
const ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
async function attempts(ip: string) {
  const key = `rl/${(ip || "unknown").replace(/[^\w.:-]/g, "").slice(0, 80)}`;
  const now = Date.now();
  const rec = ((await trips().get(key, { type: "json" })) as { n: number; reset: number } | null) ?? { n: 0, reset: now + WINDOW_MS };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + WINDOW_MS; }
  return { key, rec };
}
async function getSettings() {
  return (await trips().get("settings", { type: "json" })) ?? { agencyName: "", agentName: "" };
}

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const time = (v: unknown) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const httpsUrl = (v: unknown) => (typeof v === "string" && /^https:\/\/\S+$/.test(v) ? v.slice(0, 1000) : "");
const urls = (v: unknown, max: number) => arr(v).map(httpsUrl).filter(Boolean).slice(0, max);
const id = (v: unknown) => (typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : newId(4));

// Accepts an agent-edited trip and keeps only known fields, in the right shape.
function cleanTrip(input: Trip): Trip {
  return {
    title: str(input.title, 200),
    clientName: str(input.clientName, 200),
    travelers: str(input.travelers, 200),
    startDate: date(input.startDate),
    endDate: date(input.endDate),
    intro: str(input.intro, 4000),
    agentNotes: str(input.agentNotes, 8000),
    stops: arr(input.stops).slice(0, 20).map((s: any) => ({
      id: id(s.id),
      city: str(s.city, 120),
      checkIn: date(s.checkIn),
      checkOut: date(s.checkOut),
      note: str(s.note, 1000),
      pickId: typeof s.pickId === "string" ? s.pickId : "",
      hotels: arr(s.hotels).slice(0, 6).map((h: any) => ({
        id: id(h.id),
        name: str(h.name, 200),
        stars: Math.max(0, Math.min(5, Number(h.stars) || 0)),
        description: str(h.description, 2000),
        tags: arr(h.tags).map((t: unknown) => str(t, 60)).filter(Boolean).slice(0, 8),
        priceNote: str(h.priceNote, 200),
        link: str(h.link, 500),
        imageUrl: str(h.imageUrl, 1000),
        color: str(h.color, 20),
        address: str(h.address, 300),
        images: urls(h.images, 5),
        photoPool: urls(h.photoPool, 60),
        rooms: arr(h.rooms).slice(0, 15).map((r: any) => ({
          id: id(r.id),
          sourceId: str(r.sourceId, 40),
          name: str(r.name, 120),
          description: str(r.description, 300),
          images: urls(r.images, 2),
          show: !!r.show,
        })),
      })),
    })),
    flightGroups: arr(input.flightGroups).slice(0, 6).map((g: any) => ({
      id: id(g.id),
      title: str(g.title, 80),
      note: str(g.note, 500),
      pickId: typeof g.pickId === "string" ? g.pickId : "",
      options: arr(g.options).slice(0, 6).map((o: any) => ({
        id: id(o.id),
        title: str(o.title, 80),
        cabin: str(o.cabin, 40),
        baggage: str(o.baggage, 300),
        fareNote: str(o.fareNote, 300),
        priceNote: str(o.priceNote, 200),
        note: str(o.note, 500),
        segments: arr(o.segments).slice(0, 8).map((x: any) => ({
          id: id(x.id),
          leg: ["out", "back"].includes(x.leg) ? x.leg : "",
          airline: str(x.airline, 80),
          flightNumber: str(x.flightNumber, 20),
          from: str(x.from, 4).toUpperCase(),
          fromCity: str(x.fromCity, 60),
          fromTerminal: str(x.fromTerminal, 20),
          departDate: date(x.departDate),
          departTime: time(x.departTime),
          to: str(x.to, 4).toUpperCase(),
          toCity: str(x.toCity, 60),
          toTerminal: str(x.toTerminal, 20),
          arriveDate: date(x.arriveDate),
          arriveTime: time(x.arriveTime),
        })),
      })),
    })),
    checklist: arr(input.checklist).slice(0, 60).map((c: any) => ({
      id: id(c.id),
      title: str(c.title, 200),
      note: str(c.note, 500),
      due: date(c.due),
    })),
    goodToKnow: arr(input.goodToKnow).slice(0, 20).map((g: any) => ({
      id: id(g.id),
      title: str(g.title, 80),
      value: str(g.value, 80),
      note: str(g.note, 300),
    })),
    items: arr(input.items).slice(0, 400).map((i: any) => ({
      id: id(i.id),
      date: date(i.date),
      time: time(i.time),
      endTime: time(i.endTime),
      kind: ["flight", "ferry", "transfer", "activity", "meal", "tip", "other"].includes(i.kind) ? i.kind : "other",
      title: str(i.title, 200),
      place: str(i.place, 300),
      note: str(i.note, 1000),
      mapUrl: str(i.mapUrl, 1000),
    })),
    vouchers: arr(input.vouchers).slice(0, 100).map((v: any) => ({
      id: id(v.id),
      kind: ["flight", "hotel", "ferry", "activity", "transfer", "insurance", "other"].includes(v.kind) ? v.kind : "other",
      title: str(v.title, 200),
      when: str(v.when, 200),
      ref: str(v.ref, 120),
      who: str(v.who, 200),
      fileId: typeof v.fileId === "string" ? v.fileId : "",
      fileName: str(v.fileName, 200),
      fileType: str(v.fileType, 100),
    })),
  };
}

// What the client (traveler) is allowed to see.
async function clientView(trip: Trip) {
  const settings = await getSettings();
  const { agentNotes, accessCode, accessVersion, token, ...rest } = trip;
  // Clients see only the room types she ticked, and never her photo pool.
  const stops = arr(rest.stops).map((s: any) => ({
    ...s,
    hotels: arr(s.hotels).map(({ photoPool, ...h }: any) => ({
      ...h,
      rooms: arr(h.rooms).filter((r: any) => r.show).map(({ sourceId, show, ...r }: any) => r),
    })),
  }));
  return { ...rest, stops, agency: settings };
}

function summary(t: Trip) {
  const stops = arr(t.stops);
  return {
    id: t.id,
    accessCode: t.accessCode,
    title: t.title,
    clientName: t.clientName,
    startDate: t.startDate,
    endDate: t.endDate,
    stopsCount: stops.length,
    chosenCount: stops.filter((s: any) => s.chosenId).length,
    hotelsConfirmedAt: t.hotelsConfirmedAt || null,
    flightGroupsCount: arr(t.flightGroups).length,
    flightsChosenCount: arr(t.flightGroups).filter((g: any) => g.chosenId).length,
    flightsConfirmedAt: t.flightsConfirmedAt || null,
    updatedAt: t.updatedAt,
  };
}

async function createTrip(kind: string) {
  const base = kind === "sample" ? sampleTrip() : blankTrip();
  const trip: Trip = {
    ...cleanTrip(base),
    id: newId(6),
    accessCode: await uniqueCode(),
    accessVersion: 1,
    createdAt: new Date().toISOString(),
    hotelsConfirmedAt: null,
    flightsConfirmedAt: null,
    done: {},
  };
  await saveTrip(trip);
  await trips().set(`code/${trip.accessCode}`, trip.id);
  return trip;
}

// ---------- calendar (.ics) ----------
function icsText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
const icsDate = (d: string) => d.replace(/-/g, "");
const icsDateTime = (d: string, t: string) => `${icsDate(d)}T${t.replace(":", "")}00`;
function addHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function buildIcs(trip: Trip) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//travel-agent-app//HE", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${icsText(trip.title || "הטיול")}`];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  for (const s of arr(trip.stops)) {
    if (!s.checkIn || !s.checkOut) continue;
    const hotel = arr(s.hotels).find((h: any) => h.id === (s.chosenId || s.pickId));
    lines.push("BEGIN:VEVENT", `UID:stay-${s.id}@${trip.id}`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(s.checkIn)}`, `DTEND;VALUE=DATE:${icsDate(s.checkOut)}`,
      `SUMMARY:${icsText(`לינה: ${hotel?.name || s.city}`)}`, `LOCATION:${icsText(s.city)}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  for (const g of arr(trip.flightGroups)) {
    const opts = arr(g.options);
    const o = opts.find((x: any) => x.id === g.chosenId) || (opts.length === 1 ? opts[0] : null);
    for (const x of arr(o?.segments)) {
      if (!x.departDate || !x.departTime) continue;
      lines.push("BEGIN:VEVENT", `UID:flight-${x.id}@${trip.id}`, `DTSTAMP:${stamp}`,
        `DTSTART:${icsDateTime(x.departDate, x.departTime)}`,
        `DTEND:${icsDateTime(x.arriveDate || x.departDate, x.arriveTime || addHour(x.departTime))}`,
        `SUMMARY:${icsText(`טיסה ${[x.airline, x.flightNumber].filter(Boolean).join(" ")}: ${x.fromCity || x.from} - ${x.toCity || x.to}`)}`,
        `LOCATION:${icsText([x.from, x.fromTerminal ? `טרמינל ${x.fromTerminal}` : ""].filter(Boolean).join(" "))}`,
        "END:VEVENT");
    }
  }
  for (const i of arr(trip.items)) {
    if (!i.date) continue;
    lines.push("BEGIN:VEVENT", `UID:item-${i.id}@${trip.id}`, `DTSTAMP:${stamp}`);
    if (i.time) {
      lines.push(`DTSTART:${icsDateTime(i.date, i.time)}`, `DTEND:${icsDateTime(i.date, i.endTime || addHour(i.time))}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(i.date)}`);
    }
    lines.push(`SUMMARY:${icsText(i.title)}`);
    if (i.place) lines.push(`LOCATION:${icsText(i.place)}`);
    if (i.note) lines.push(`DESCRIPTION:${icsText(i.note)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ---------- routes ----------
async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

async function clientRoutes(req: Request, url: URL, rest: string[]) {
  const trip = await tripFromSession(req, url);
  if (!trip) return fail(401, "צריך להכניס את קוד הטיול");
  const m = req.method;
  const [action, arg] = rest;

  if (!action && m === "GET") return json(await clientView(trip));

  if (action === "choose" && m === "POST") {
    if (trip.hotelsConfirmedAt) return fail(409, "הבחירה כבר אושרה. כדי לשנות, פנו לסוכנת.");
    const { stopId, hotelId } = await readJson(req);
    const stop = arr(trip.stops).find((s: any) => s.id === stopId);
    if (!stop || !arr(stop.hotels).some((h: any) => h.id === hotelId)) return fail(400, "המלון שנבחר לא נמצא");
    stop.chosenId = hotelId;
    await saveTrip(trip);
    return json(await clientView(trip));
  }

  if (action === "confirm" && m === "POST") {
    const missing = arr(trip.stops).filter((s: any) => !s.chosenId);
    if (missing.length) return fail(400, `עוד לא נבחר מלון ב${missing.map((s: any) => s.city).join(", ")}`);
    trip.hotelsConfirmedAt = new Date().toISOString();
    await saveTrip(trip);
    return json(await clientView(trip));
  }

  if (action === "choose-flight" && m === "POST") {
    if (trip.flightsConfirmedAt) return fail(409, "הבחירה כבר אושרה. כדי לשנות, פנו לסוכנת.");
    const { groupId, optionId } = await readJson(req);
    const group = arr(trip.flightGroups).find((g: any) => g.id === groupId);
    if (!group || !arr(group.options).some((o: any) => o.id === optionId)) return fail(400, "הטיסה שנבחרה לא נמצאה");
    group.chosenId = optionId;
    await saveTrip(trip);
    return json(await clientView(trip));
  }

  if (action === "confirm-flights" && m === "POST") {
    const missing = arr(trip.flightGroups).filter((g: any) => !g.chosenId);
    if (missing.length) return fail(400, `עוד לא נבחרה טיסה: ${missing.map((g: any) => g.title || "טיסה").join(", ")}`);
    trip.flightsConfirmedAt = new Date().toISOString();
    await saveTrip(trip);
    return json(await clientView(trip));
  }

  if (action === "checklist" && m === "POST") {
    const { itemId, done } = await readJson(req);
    if (!arr(trip.checklist).some((c: any) => c.id === itemId)) return fail(400, "המשימה לא נמצאה");
    trip.done = { ...(trip.done || {}), [itemId]: !!done };
    await saveTrip(trip);
    return json(await clientView(trip));
  }

  if (action === "files" && arg && m === "GET") {
    if (!arr(trip.vouchers).some((v: any) => v.fileId === arg)) return fail(404, "הקובץ לא נמצא");
    const blob = await files().getWithMetadata(`${trip.id}/${arg}`, { type: "arrayBuffer" });
    if (!blob) return fail(404, "הקובץ לא נמצא");
    const meta = blob.metadata as { name?: string; type?: string };
    return new Response(blob.data as ArrayBuffer, {
      headers: {
        "content-type": meta.type || "application/octet-stream",
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(meta.name || "voucher")}`,
        "cache-control": "private, max-age=86400",
      },
    });
  }

  if (action === "calendar.ics" && m === "GET") {
    return new Response(buildIcs(trip), {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="trip.ics"`,
        "cache-control": "no-store",
      },
    });
  }

  return fail(404, "לא נמצא");
}

async function agentRoutes(req: Request, seg: string[]) {
  const m = req.method;

  if (seg[0] === "settings") {
    if (m === "GET") return json(await getSettings());
    if (m === "PUT") {
      const body = await readJson(req);
      const settings = { agencyName: str(body.agencyName, 120), agentName: str(body.agentName, 120) };
      await trips().setJSON("settings", settings);
      return json(settings);
    }
  }

  if (seg[0] === "import" && m === "POST") {
    const body = await readJson(req);
    const ai = !!Netlify.env.get("ANTHROPIC_API_KEY");
    try {
      if (seg[1] === "url") {
        const u = checkUrl(str(body.url, 2000));
        const snapshot = extract(await fetchPage(u), u.toString());
        if (!snapshot.name && !snapshot.photos.length) return fail(422, "לא מצאתי פרטי מלון בדף הזה. בדקי שזה הקישור לדף של המלון עצמו.");
        return json({ snapshot, hotel: draftHotel(snapshot), ai });
      }
      if (seg[1] === "html") {
        const html = typeof body.html === "string" ? body.html : "";
        if (html.length < 500) return fail(400, "ההדבקה ריקה. לחצי שוב על הסימנייה בדף המלון ואז הדביקי כאן.");
        const snapshot = extract(html, httpsUrl(body.url));
        if (!snapshot.name && !snapshot.photos.length) return fail(422, "לא מצאתי פרטי מלון במה שהודבק.");
        return json({ snapshot, hotel: draftHotel(snapshot), ai });
      }
      if (seg[1] === "polish") {
        const snapshot = body.snapshot as Snapshot;
        if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.photos)) return fail(400, "חסרים נתונים");
        return json(await polishWithClaude(snapshot, draftHotel(snapshot)));
      }
    } catch (e: any) {
      if (e?.blocked) return json({ error: "Booking חסם את הקריאה האוטומטית מהשרת. השתמשי ב״ייבוא מהדפדפן״ שמתחת.", blocked: true }, 502);
      return fail(400, e?.message || "הייבוא נכשל");
    }
    return fail(404, "לא נמצא");
  }

  if (seg[0] !== "trips") return fail(404, "לא נמצא");
  const [, tripId, sub, subId] = seg;

  if (!tripId) {
    if (m === "GET") {
      const { blobs } = await trips().list({ prefix: "trip/" });
      const all = await Promise.all(blobs.map((b) => trips().get(b.key, { type: "json" })));
      const list = all.filter(Boolean).map(summary)
        .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
      return json(list);
    }
    if (m === "POST") {
      const { template } = await readJson(req);
      return json(await createTrip(template === "sample" ? "sample" : "blank"), 201);
    }
    return fail(405, "פעולה לא נתמכת");
  }

  const trip = await getTrip(tripId);
  if (!trip) return fail(404, "הטיול לא נמצא");

  if (!sub) {
    if (m === "GET") return json(trip);
    if (m === "PUT") {
      const body = await readJson(req);
      const clean = cleanTrip(body);
      // Keep what the client owns: hotel choices (when the hotel still exists) and checklist ticks.
      for (const s of clean.stops) {
        const old = arr(trip.stops).find((o: any) => o.id === s.id);
        if (old?.chosenId && s.hotels.some((h: any) => h.id === old.chosenId)) s.chosenId = old.chosenId;
      }
      for (const g of clean.flightGroups) {
        const old = arr(trip.flightGroups).find((o: any) => o.id === g.id);
        if (old?.chosenId && g.options.some((o: any) => o.id === old.chosenId)) (g as any).chosenId = old.chosenId;
      }
      const updated = { ...trip, ...clean };
      await saveTrip(updated);
      return json(updated);
    }
    if (m === "DELETE") {
      const { blobs } = await files().list({ prefix: `${trip.id}/` });
      await Promise.all(blobs.map((b) => files().delete(b.key)));
      if (trip.accessCode) await trips().delete(`code/${trip.accessCode}`);
      await trips().delete(`trip/${trip.id}`);
      return json({ ok: true });
    }
  }

  if (sub === "unlock-flights" && m === "POST") {
    trip.flightsConfirmedAt = null;
    await saveTrip(trip);
    return json(trip);
  }

  if (sub === "unlock" && m === "POST") {
    trip.hotelsConfirmedAt = null;
    await saveTrip(trip);
    return json(trip);
  }

  if (sub === "code" && m === "POST") {
    const body = await readJson(req);
    let code = normCode(body.code);
    if (code) {
      if (!validCode(code)) return fail(400, "הקוד צריך להיות בין 6 ל־8 ספרות");
      const owner = await trips().get(`code/${code}`);
      if (owner && owner !== trip.id) return fail(409, "הקוד הזה כבר בשימוש בטיול אחר");
    } else {
      code = await uniqueCode();
    }
    if (trip.accessCode && trip.accessCode !== code) await trips().delete(`code/${trip.accessCode}`);
    trip.accessCode = code;
    trip.accessVersion = (trip.accessVersion || 1) + 1; // signs out devices that used the old code
    await trips().set(`code/${code}`, trip.id);
    await saveTrip(trip);
    return json(trip);
  }

  if (sub === "signout" && m === "POST") {
    trip.accessVersion = (trip.accessVersion || 1) + 1;
    await saveTrip(trip);
    return json(trip);
  }

  if (sub === "preview" && m === "POST") {
    return json({ session: issueClientSession(trip, 1) });
  }

  if (sub === "files") {
    if (m === "POST" && !subId) {
      const buf = await req.arrayBuffer();
      if (!buf.byteLength) return fail(400, "הקובץ ריק");
      if (buf.byteLength > MAX_FILE_BYTES) return fail(413, "הקובץ גדול מ־10MB");
      const fileId = newId(8);
      const name = decodeURIComponent(req.headers.get("x-file-name") || "file");
      const type = req.headers.get("content-type") || "application/octet-stream";
      await files().set(`${trip.id}/${fileId}`, buf, { metadata: { name, type, size: buf.byteLength } });
      return json({ fileId, fileName: name, fileType: type }, 201);
    }
    if (m === "DELETE" && subId) {
      await files().delete(`${trip.id}/${subId}`);
      return json({ ok: true });
    }
    if (m === "GET" && subId) {
      const blob = await files().getWithMetadata(`${trip.id}/${subId}`, { type: "arrayBuffer" });
      if (!blob) return fail(404, "הקובץ לא נמצא");
      const meta = blob.metadata as { type?: string };
      return new Response(blob.data as ArrayBuffer, { headers: { "content-type": meta.type || "application/octet-stream", "cache-control": "no-store" } });
    }
  }

  return fail(404, "לא נמצא");
}

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const seg = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);

    if (seg[0] === "login" && req.method === "POST") {
      const expected = Netlify.env.get("AGENT_PASSWORD");
      if (!expected) return fail(500, "לא הוגדרה סיסמה. הוסיפו משתנה סביבה AGENT_PASSWORD ב־Netlify.");
      const { password } = await readJson(req);
      if (typeof password !== "string" || !safeEqual(password, expected)) return fail(401, "הסיסמה שגויה");
      return json({ token: issueAgentToken() });
    }

    if (seg[0] === "public" && req.method === "GET") return json(await getSettings());

    if (seg[0] === "enter" && req.method === "POST") {
      const { key, rec } = await attempts(context.ip);
      if (rec.n >= ATTEMPTS) {
        const mins = Math.max(1, Math.ceil((rec.reset - Date.now()) / 60000));
        return fail(429, `יותר מדי ניסיונות. נסו שוב בעוד ${mins} דקות.`);
      }
      const { code } = await readJson(req);
      const clean = normCode(code);
      const tripId = validCode(clean) ? await trips().get(`code/${clean}`) : null;
      const trip = tripId ? await getTrip(tripId) : null;
      if (!trip) {
        rec.n += 1;
        await trips().setJSON(key, rec);
        return fail(401, "הקוד לא נכון. בדקו את הקוד שקיבלתם מהסוכנת.");
      }
      await trips().delete(key);
      return json({ session: issueClientSession(trip, 365) });
    }

    if (seg[0] === "me") return await clientRoutes(req, url, seg.slice(1));

    if (!isAgent(req)) return fail(401, "צריך להתחבר מחדש");
    return await agentRoutes(req, seg);
  } catch (e) {
    console.error(e);
    return fail(500, "שגיאת שרת. נסו שוב בעוד רגע.");
  }
};

export const config: Config = {
  path: "/api/*",
};
