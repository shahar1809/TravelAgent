import { useState } from "react";
import { formatPrice, formatTotals, tripTotal } from "./money.js";
import { Icon } from "./ui.jsx";

// Total price of the selected plan, with an expandable breakdown.
export default function TotalCard({ trip, forAgent = false }) {
  const [open, setOpen] = useState(forAgent);
  const t = tripTotal(trip);
  if (!t.lines.length || !t.totals.length) return null;
  return (
    <section className="total-card">
      <div className="total-head">
        <span className="muted small">{t.final ? "מחיר סופי לכל הטיול" : forAgent ? "סה״כ לפי הבחירה הנוכחית" : "המחיר לפי הבחירה הנוכחית"}</span>
        <span className="display total-sum" dir="ltr">{formatTotals(t.totals)}</span>
        {t.missing > 0 && <span className="muted small">{forAgent ? t.missing === 1 ? "פריט אחד בלי מחיר לא נכלל" : `${t.missing} פריטים בלי מחיר לא נכללים` : "חלק מהפריטים עוד בלי מחיר"}</span>}
      </div>
      <button type="button" className="text-link small" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "הסתרת הפירוט" : "פירוט"} <Icon name={open ? "up" : "down"} size={14} />
      </button>
      {open && (
        <ul className="total-lines">
          {t.lines.map((l) => (
            <li key={l.key}>
              <Icon name={l.kind === "hotel" ? "bed" : "plane"} size={15} />
              <span className="grow" dir="auto">{l.label}</span>
              <span dir="ltr" className={l.price ? "" : "muted"}>{l.price ? formatPrice(l.price) : "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
