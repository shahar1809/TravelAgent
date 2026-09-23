// Airport names in Hebrew for the codes agents use most. Unknown codes just show the code.
export const AIRPORTS = {
  TLV: "תל אביב", ETM: "אילת", HFA: "חיפה",
  CTA: "קטניה", PMO: "פלרמו", FCO: "רומא", CIA: "רומא", MXP: "מילאנו", LIN: "מילאנו", BGY: "ברגמו", VCE: "ונציה", NAP: "נאפולי",
  FLR: "פירנצה", BLQ: "בולוניה", PSA: "פיזה", BRI: "בארי", CAG: "קליארי", OLB: "אולביה", VRN: "ורונה", TRN: "טורינו",
  ATH: "אתונה", HER: "הרקליון", RHO: "רודוס", JTR: "סנטוריני", JMK: "מיקונוס", SKG: "סלוניקי", CFU: "קורפו", CHQ: "חאניה", KGS: "קוס",
  LCA: "לרנקה", PFO: "פאפוס", LHR: "לונדון", LGW: "לונדון", LTN: "לונדון", STN: "לונדון", CDG: "פריז", ORY: "פריז", NCE: "ניס",
  AMS: "אמסטרדם", BER: "ברלין", MUC: "מינכן", FRA: "פרנקפורט", VIE: "וינה", PRG: "פראג", BUD: "בודפשט", WAW: "ורשה", KRK: "קרקוב",
  BCN: "ברצלונה", MAD: "מדריד", PMI: "מיורקה", LIS: "ליסבון", OPO: "פורטו", FAO: "פארו", ZRH: "ציריך", GVA: "ז׳נבה",
  IST: "איסטנבול", SAW: "איסטנבול", AYT: "אנטליה", TBS: "טביליסי", BUS: "בטומי", SOF: "סופיה", OTP: "בוקרשט", BEG: "בלגרד",
  TIV: "טיבט", DBV: "דוברובניק", SPU: "ספליט", LJU: "לובליאנה", KEF: "רייקיאוויק", CPH: "קופנהגן", ARN: "סטוקהולם", OSL: "אוסלו",
  DXB: "דובאי", AUH: "אבו דאבי", BKK: "בנגקוק", HKT: "פוקט", NRT: "טוקיו", HND: "טוקיו", DEL: "דלהי", BOM: "מומבאי",
  JFK: "ניו יורק", EWR: "ניו יורק", LAX: "לוס אנג׳לס", MIA: "מיאמי", SFO: "סן פרנסיסקו", YYZ: "טורונטו",
};

export const LEGS = { out: "הלוך", back: "חזור", "": "טיסה" };

// The option that counts for the schedule: the client's choice, else her recommendation.
export function flightOptionFor(group) {
  const opts = group.options || [];
  return opts.find((o) => o.id === group.chosenId) || opts.find((o) => o.id === group.pickId) || (opts.length === 1 ? opts[0] : null);
}

// Segments grouped by direction, in order: outbound, return, then unlabeled.
export function legsOf(option) {
  const order = ["out", "back", ""];
  return order
    .map((leg) => ({ leg, segments: (option.segments || []).filter((s) => (s.leg || "") === leg) }))
    .filter((l) => l.segments.length);
}

const toMin = (d, t) => (d && t ? Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +t.slice(0, 2), +t.slice(3, 5)) / 60000 : null);

// Waiting time at the connecting airport (both times are local to that airport).
export function layover(prev, next) {
  const a = toMin(prev.arriveDate || prev.departDate, prev.arriveTime);
  const b = toMin(next.departDate, next.departTime);
  if (a == null || b == null || b < a) return "";
  const mins = b - a;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} ש׳` : "", m ? `${m} דק׳` : ""].filter(Boolean).join(" ");
}

export const nextDay = (s) => !!(s.arriveDate && s.departDate && s.arriveDate > s.departDate);

export function stopsLabel(segments) {
  const n = segments.length - 1;
  if (n <= 0) return "ישירה";
  const via = segments.slice(0, -1).map((s) => s.toCity || s.to).filter(Boolean).join(", ");
  return n === 1 ? `עצירה אחת${via ? ` ב${via}` : ""}` : `${n} עצירות${via ? ` (${via})` : ""}`;
}

export function flightsState(trip) {
  const groups = trip.flightGroups || [];
  const chosen = groups.filter((g) => g.chosenId).length;
  return { total: groups.length, chosen, confirmed: !!trip.flightsConfirmedAt, allChosen: groups.length > 0 && chosen === groups.length };
}
