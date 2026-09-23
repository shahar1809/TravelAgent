export function parse(d) {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}
export function iso(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
export const todayIso = () => iso(new Date());
export function addDays(d, n) {
  const x = parse(d);
  x.setDate(x.getDate() + n);
  return iso(x);
}
export const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export function eachDay(a, b) {
  const out = [];
  if (!a || !b || a > b) return out;
  for (let d = a; d <= b && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
const f = (opts) => new Intl.DateTimeFormat("he-IL", opts);
export const dayMonth = (d) => (d ? f({ day: "numeric", month: "long" }).format(parse(d)) : "");
export const weekday = (d) => (d ? f({ weekday: "long" }).format(parse(d)) : "");
export const monthYear = (d) => f({ month: "long", year: "numeric" }).format(parse(d));
export const shortDate = (d) => (d ? f({ day: "numeric", month: "numeric" }).format(parse(d)) : "");
export function range(a, b) {
  if (!a) return "";
  if (!b || a === b) return dayMonth(a);
  const A = parse(a);
  const B = parse(b);
  if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) {
    return `${A.getDate()}–${B.getDate()} ב${f({ month: "long" }).format(B)} ${B.getFullYear()}`;
  }
  return `${dayMonth(a)} – ${dayMonth(b)} ${B.getFullYear()}`;
}
export const nights = (a, b) => (a && b ? Math.max(0, diffDays(a, b)) : 0);
