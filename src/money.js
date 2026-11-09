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
