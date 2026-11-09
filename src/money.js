export const CURRENCIES = [
  ["ILS", "₪ שקל"],
  ["EUR", "€ יורו"],
  ["USD", "$ דולר"],
  ["GBP", "£ ליש״ט"],
];

// "₪5,200" / "€1,460" — whole numbers only.
export function formatPrice(p) {
  if (!p || typeof p.amount !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "ILS", maximumFractionDigits: 0 }).format(p.amount);
  } catch {
    return String(p.amount);
  }
}

// Lines and per-currency totals for the selected plan: each stop's hotel and each flight choice
// (client's choice, else her recommendation).
export function tripTotal(trip) {
  const lines = [];
  for (const s of trip.stops || []) {
    const h = (s.hotels || []).find((x) => x.id === (s.chosenId || s.pickId));
    if (h) lines.push({ key: `h-${s.id}`, kind: "hotel", label: `${s.city || "מלון"} · ${h.name}`, price: h.price || null });
  }
  for (const g of trip.flightGroups || []) {
    const o = (g.options || []).find((x) => x.id === (g.chosenId || g.pickId));
    if (o) lines.push({ key: `f-${g.id}`, kind: "flight", label: `טיסות · ${g.title || o.title || "טיסה"}`, price: o.price || null });
  }
  const sums = {};
  for (const l of lines) if (l.price) sums[l.price.currency] = (sums[l.price.currency] || 0) + l.price.amount;
  const totals = Object.entries(sums).map(([currency, amount]) => ({ currency, amount }));
  const hasHotels = (trip.stops || []).length > 0;
  const hasFlights = (trip.flightGroups || []).length > 0;
  const final = (!hasHotels || !!trip.hotelsFinalAt) && (!hasFlights || !!trip.flightsFinalAt) && (hasHotels || hasFlights);
  return { lines, totals, missing: lines.filter((l) => !l.price).length, final };
}

export const formatTotals = (totals) => totals.map(formatPrice).join(" + ");

// Number and symbol separately, so the symbol can use a different font.
export function priceParts(p) {
  if (!p || typeof p.amount !== "number") return null;
  try {
    const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "ILS", maximumFractionDigits: 0 }).formatToParts(p.amount);
    return { symbol: parts.filter((x) => x.type === "currency").map((x) => x.value).join(""), number: parts.filter((x) => x.type !== "currency" && x.type !== "literal").map((x) => x.value).join("") };
  } catch {
    return { symbol: "", number: String(p.amount) };
  }
}
