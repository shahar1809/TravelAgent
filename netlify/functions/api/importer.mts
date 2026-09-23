// Turns a hotel page (usually Booking.com) into a hotel option: details, photos and room types. Never prices.
import { parse, type HTMLElement } from "node-html-parser";

export type Snapshot = {
  sourceUrl: string;
  name: string;
  description: string;
  address: string;
  stars: number;
  facilities: string[];
  photos: { url: string; rooms: string[] }[];
  rooms: { id: string; name: string }[];
  text: string;
};

const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
const uniq = <T,>(arr: T[]) => [...new Set(arr)];

// ---------- fetching ----------
export function checkUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("זה לא נראה כמו קישור. הדביקי את הקישור המלא לדף המלון.");
  }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || host === "localhost" || /^[\d.]+$/.test(host) || host.includes(":") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("אפשר לייבא רק מקישור https רגיל של אתר מלונות.");
  }
  if (/(^|\.)booking\.com$/.test(host)) u.searchParams.set("lang", "he"); // Booking's Hebrew page
  return u;
}

export async function fetchPage(u: URL) {
  const template = Netlify.env.get("SCRAPER_URL"); // optional proxy, e.g. https://api.scraperapi.com/?api_key=KEY&url={url}
  const target = template ? template.replace("{url}", encodeURIComponent(u.toString())) : u.toString();
  let res: Response;
  try {
    res = await fetch(target, {
      redirect: "follow",
      signal: AbortSignal.timeout(8500),
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "he-IL,he;q=0.9,en;q=0.8",
      },
    });
  } catch {
    throw Object.assign(new Error("האתר לא ענה בזמן."), { blocked: true });
  }
  const html = await res.text();
  const looksBlocked = !res.ok || html.length < 4000 || /awswaf|px-captcha|challenge-platform|captcha-delivery/i.test(html.slice(0, 20000));
  if (looksBlocked) throw Object.assign(new Error("האתר חסם את הקריאה האוטומטית."), { blocked: true });
  return html;
}

// ---------- extraction ----------
function findLodging(root: HTMLElement) {
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const j = JSON.parse(s.text);
      const list = Array.isArray(j) ? j : j["@graph"] || [j];
      for (const x of list) {
        const type = ([] as string[]).concat(x?.["@type"] || []).join(" ");
        if (/Hotel|Lodging|Resort|BedAndBreakfast|Hostel|Motel|Apartment|Accommodation|Campground|Villa/i.test(type)) return x;
      }
    } catch {
      /* ignore broken JSON-LD */
    }
  }
  return null;
}

function bookingPhotoUrl(raw: string) {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/\/images\/hotel\/[a-z0-9_]+\//i, "/images/hotel/max1024x768/")
    .replace(/[\\'"]+$/, "");
}

function extractPhotos(html: string, ld: any, root: HTMLElement) {
  const assoc = new Map<string, string[]>();
  // Booking: hotelPhotos.push({ id: '123', associated_rooms: '1,2', ... }) or JSON {"id":123,...,"associated_rooms":[...]}
  for (const m of html.matchAll(/hotelPhotos\.push\(\s*\{([\s\S]*?)\}\s*\)/g)) {
    const id = /\bid\s*:\s*'?(\d+)/.exec(m[1])?.[1];
    const rooms = /associated_rooms\s*:\s*(?:'([^']*)'|\[([^\]]*)\])/.exec(m[1]);
    if (id && rooms) assoc.set(id, (rooms[1] ?? rooms[2] ?? "").split(/[,\s'"]+/).filter(Boolean));
  }
  for (const m of html.matchAll(/"id"\s*:\s*"?(\d{5,})"?[^{}]{0,1500}?"associated_rooms"\s*:\s*\[([^\]]*)\]/g)) {
    if (!assoc.has(m[1])) assoc.set(m[1], m[2].split(/[,\s'"]+/).filter(Boolean));
  }

  const photos = new Map<string, { url: string; rooms: string[] }>();
  for (const m of html.matchAll(/https:\/\/cf\.bstatic\.com\/xdata\/images\/hotel\/[a-z0-9_]+\/(\d+)\.(?:jpe?g|webp|png)(?:\?k=[\w-]+(?:(?:&amp;|&)o=[\w-]*)?)?/gi)) {
    const id = m[1];
    if (!photos.has(id)) photos.set(id, { url: bookingPhotoUrl(m[0]), rooms: assoc.get(id) || [] });
  }

  // Other sites: JSON-LD images, og:image, large <img> tags.
  if (photos.size === 0) {
    const list: string[] = [];
    const add = (v: any) => {
      if (!v) return;
      if (typeof v === "string") list.push(v);
      else if (Array.isArray(v)) v.forEach(add);
      else if (typeof v === "object") add(v.url || v.contentUrl);
    };
    add(ld?.image);
    add(ld?.photo);
    add(root.querySelector('meta[property="og:image"]')?.getAttribute("content"));
    for (const img of root.querySelectorAll("img")) {
      const src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (/^https:\/\/.+\.(jpe?g|webp)(\?|$)/i.test(src) && !/logo|icon|sprite|avatar|flag|badge/i.test(src)) list.push(src);
    }
    uniq(list).filter((u) => /^https:\/\//.test(u)).forEach((u, i) => photos.set(`g${i}`, { url: u, rooms: [] }));
  }
  return [...photos.values()].slice(0, 60);
}

// Words that appear in real room-type names (English and Hebrew Booking pages).
const ROOM_WORDS = /\b(room|suite|studio|apartment|villa|bungalow|chalet|cottage|house|loft|penthouse|dormitory|dorm|cabin|double|twin|single|triple|quadruple|family|deluxe|superior|standard|classic|junior|executive|premium|economy|budget|king|queen|bedroom)\b|חדר|סוויטה|דירה|דירת|סטודיו|וילה|בונגלו|צימר|זוגי|יחיד|משפחתי|דלוקס|סופיריור|סטנדרט|מיטה|מיטות/i;
// Page chrome and error text that must never become a room name.
const NOT_ROOM = /something went wrong|try again|please|loading|error|sign in|log in|show more|see more|see availability|availability|select|reserve|book now|price|per night|taxes|charges|cancel|breakfast included|only \d+ left|reviews?|rating|[€$₪£]|\d+[.,]\d{2}|משהו השתבש|נסו שוב|טוען|הצג עוד|מחיר|לילה|מסים|הזמ(ינו|נה) עכשיו|בחר/i;

export function looksLikeRoom(name: string) {
  const n = clean(name);
  return n.length >= 4 && n.length <= 80 && ROOM_WORDS.test(n) && !NOT_ROOM.test(n) && !/^\d+$/.test(n);
}

function extractRooms(html: string, root: HTMLElement, pageText: string) {
  const rooms = new Map<string, string>();
  const add = (id: string | undefined, name: string) => {
    const n = clean(name).split(/\s{2,}|\n/)[0];
    if (id && looksLikeRoom(n) && !rooms.has(id) && ![...rooms.values()].includes(n)) rooms.set(id, n);
  };

  // 1. Booking's rooms table and room links.
  for (const el of root.querySelectorAll(".hprt-roomtype-icon-link, a.hprt-roomtype-link, [data-room-name]")) {
    const id = el.getAttribute("data-room-id") || el.closest("[data-room-id]")?.getAttribute("data-room-id") || undefined;
    add(id, el.getAttribute("data-room-name") || el.text);
  }
  // 2. Any element carrying a room id: use its first heading/link text, never the whole block.
  for (const el of root.querySelectorAll("[data-room-id]")) {
    const id = el.getAttribute("data-room-id") || undefined;
    const title = el.querySelector("h1, h2, h3, h4, a, [data-testid*='title'], [class*='roomtype'], [class*='room-name'], [class*='room_name']");
    add(id, title ? title.text : el.childNodes.length === 1 ? el.text : "");
  }
  // 3. Room data embedded in page scripts.
  for (const m of html.matchAll(/"room_?name"\s*:\s*"([^"]{3,90})"[^{}]{0,400}?"room_?id"\s*:\s*"?(\d+)/gi)) add(m[2], m[1]);
  for (const m of html.matchAll(/"room_?id"\s*:\s*"?(\d+)"?[^{}]{0,400}?"room_?name"\s*:\s*"([^"]{3,90})"/gi)) add(m[1], m[2]);

  // 4. Fallback: short lines in the page text that start like a room type (no photos linked).
  if (rooms.size === 0) {
    const start = /^(deluxe|superior|standard|classic|junior|executive|premium|economy|family|double|twin|single|triple|quadruple|king|queen|suite|studio|apartment|one-bedroom|two-bedroom|villa|bungalow|חדר|סוויטה|דירת|סטודיו|וילה)\b/i;
    pageText.split("\n").map(clean).filter((l) => start.test(l) && looksLikeRoom(l)).slice(0, 10)
      .forEach((l, i) => add(`text${i}`, l));
  }
  return [...rooms.entries()].slice(0, 20).map(([id, name]) => ({ id, name }));
}

function extractStars(html: string, ld: any, root: HTMLElement) {
  const fromLd = Number(ld?.starRating?.ratingValue ?? ld?.starRating);
  if (fromLd >= 1 && fromLd <= 5) return Math.round(fromLd);
  const stars = root.querySelector('[data-testid="rating-stars"], [data-testid="rating-squares"], [data-testid="rating-circles"]');
  if (stars) {
    const n = stars.querySelectorAll("span, svg").filter((x) => x.parentNode === stars).length;
    if (n >= 1 && n <= 5) return n;
  }
  const m = /"(?:hotel_class|star_rating|starRating|stars)"\s*:\s*"?([1-5])(?:\.\d)?"?/i.exec(html) || /([1-5])\s*(?:out of 5|מתוך 5)/i.exec(html);
  return m ? Number(m[1]) : 0;
}

export function extract(html: string, sourceUrl: string): Snapshot {
  const root = parse(html, { blockTextElements: { script: true, noscript: false, style: false, pre: true } });
  const ld = findLodging(root);
  const meta = (p: string) => root.querySelector(`meta[property="${p}"]`)?.getAttribute("content") || root.querySelector(`meta[name="${p}"]`)?.getAttribute("content") || "";
  const text = (sel: string) => clean(root.querySelector(sel)?.text);

  const address = typeof ld?.address === "string"
    ? ld.address
    : [ld?.address?.streetAddress, ld?.address?.addressLocality, ld?.address?.addressCountry?.name || ld?.address?.addressCountry].filter(Boolean).join(", ");

  const facilities = uniq(
    root.querySelectorAll('[data-testid="property-most-popular-facilities-wrapper"] li, .important_facility, [data-testid="property-highlights"] li')
      .map((el) => clean(el.text))
      .filter((t) => t.length > 1 && t.length < 50),
  ).slice(0, 14);

  const photos = extractPhotos(html, ld, root);
  const stars = extractStars(html, ld, root);
  const textRoot = parse(html);
  textRoot.querySelectorAll("script, style, noscript, svg").forEach((n) => n.remove());
  const fullText = (textRoot.querySelector("body") || textRoot).structuredText.replace(/\n{2,}/g, "\n");
  const rooms = extractRooms(html, root, fullText);
  const body = fullText.slice(0, 14000);

  return {
    sourceUrl,
    name: clean(ld?.name) || text('[data-testid="title"]') || text("h2.pp-header__title") || clean(meta("og:title")).replace(/\s*[-|–].*$/, "") || text("title"),
    description: text('[data-testid="property-description"]') || text("#property_description_content") || clean(ld?.description) || clean(meta("og:description")) || clean(meta("description")),
    address: clean(address) || text('[data-testid="PropertyHeaderAddressDesktop-wrapper"]') || text(".hp_address_subtitle"),
    stars,
    facilities,
    photos,
    rooms,
    text: body,
  };
}

// ---------- building the hotel option ----------
const newId = () => Math.random().toString(36).slice(2, 10);

export function draftHotel(s: Snapshot) {
  const forRoom = (id: string) => s.photos.filter((p) => p.rooms.includes(id)).map((p) => p.url).slice(0, 2);
  const general = s.photos.filter((p) => p.rooms.length === 0).map((p) => p.url);
  const images = (general.length >= 5 ? general : uniq([...general, ...s.photos.map((p) => p.url)])).slice(0, 5);
  return {
    name: s.name.slice(0, 200),
    stars: s.stars,
    description: s.description.slice(0, 700),
    tags: s.facilities.slice(0, 6),
    address: s.address.slice(0, 300),
    link: s.sourceUrl,
    images,
    rooms: s.rooms.slice(0, 15).map((r) => ({ id: newId(), sourceId: r.id, name: r.name, description: "", images: forRoom(r.id), show: false })),
    photoPool: s.photos.map((p) => p.url).slice(0, 60),
  };
}

// Optional: Claude rewrites the text in Hebrew and finds room types the page lists only as text.
export async function polishWithClaude(s: Snapshot, draft: ReturnType<typeof draftHotel>) {
  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!key) return { hotel: draft, polished: false };
  const input = {
    name: s.name,
    address: s.address,
    stars: s.stars,
    description: s.description.slice(0, 2500),
    facilities: s.facilities,
    rooms: s.rooms.map((r) => ({ id: r.id, name: r.name, photos: s.photos.filter((p) => p.rooms.includes(r.id)).length })),
    pageText: s.text.slice(0, 9000),
  };
  const prompt = `You prepare hotel options that an Israeli travel agent shows her clients. From the hotel page data below, return ONLY a JSON object, no other text:
{"name": string (the hotel's name as written in the source, do not translate brand names),
 "stars": number 0-5 (official star rating if stated, else 0),
 "description": string (Hebrew, 2-3 warm but factual sentences about location and what stands out; only facts from the data),
 "tags": string[] (Hebrew, up to 6 short amenity tags, 1-3 words each),
 "address": string,
 "rooms": [{"sourceId": string or null (the id from the rooms list if it matches), "name": string (Hebrew name of the room type), "description": string (Hebrew, one short line: beds, size, view, if stated)}]}
Rules: never include prices, taxes or availability. Ignore website error messages or interface text (e.g. "Something went wrong") — they are not room types. Keep every room type from the rooms list (use its id as sourceId). Add room types that appear only in pageText with sourceId null. Maximum 12 rooms.

DATA:
${JSON.stringify(input)}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(8500),
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Claude ${res.status}`);
    const data = await res.json();
    const out = (data.content || []).map((c: any) => c.text || "").join("");
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    const bySource = new Map(draft.rooms.map((r) => [r.sourceId, r]));
    const rooms = (Array.isArray(j.rooms) ? j.rooms : []).slice(0, 12).map((r: any) => {
      const base = r.sourceId ? bySource.get(String(r.sourceId)) : undefined;
      return { id: base?.id || newId(), sourceId: base?.sourceId || "", name: clean(r.name) || base?.name || "", description: clean(r.description), images: base?.images || [], show: false };
    }).filter((r: any) => r.name && !/something went wrong|try again|משהו השתבש/i.test(r.name));
    return {
      polished: true,
      hotel: {
        ...draft,
        name: clean(j.name) || draft.name,
        stars: Number(j.stars) >= 1 && Number(j.stars) <= 5 ? Math.round(Number(j.stars)) : draft.stars,
        description: clean(j.description) || draft.description,
        tags: Array.isArray(j.tags) ? j.tags.map(clean).filter(Boolean).slice(0, 6) : draft.tags,
        address: clean(j.address) || draft.address,
        rooms: rooms.length ? rooms : draft.rooms,
      },
    };
  } catch (e) {
    console.error("polish failed", e);
    return { hotel: draft, polished: false };
  }
}
