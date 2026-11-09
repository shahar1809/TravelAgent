import { useState } from "react";
import { formatPrice, formatTotals, tripTotal } from "./money.js";
import { toUSD, useRates } from "./rates.js";
import { shortDate } from "./dates.js";
import { Icon } from "./ui.jsx";

// Total price of the selected plan in USD (other currencies converted), with a breakdown.
export default function TotalCard({ trip, forAgent = false }) {
  const [open, setOpen] = useState(forAgent);
  const fx = useRates();
  const t = tripTotal(trip);
  if (!t.lines.length || !t.totals.length) return null;

  const converted = t.totals.map((p) => toUSD(p, fx));
  const canConvert = converted.every((v) => v !== null);
  const usd = canConvert ? { currency: "USD", amount: converted.reduce((a, b) => a + b, 0) } : null;
  const mixed = t.totals.some((p) => p.currency !== "USD");

  return (
    <section className="total-card">
      <div className="total-head">
        <span className="muted small">{t.final ? "מחיר סופי לכל הטיול" : forAgent ? "סה״כ לפי הבחירה הנוכחית" : "המחיר לפי הבחירה הנוכחית"}</span>
        <span className="display total-sum" dir="ltr">{usd ? formatPrice(usd) : formatTotals(t.totals)}</span>
        {usd && mixed && (
          <span className="muted small">
            <bdi dir="ltr">{formatTotals(t.totals)}</bdi>, הומר לדולר לפי שער{fx?.date ? ` מ־${shortDate(fx.date)}` : " עדכני"}. הסכום הסופי בתשלום עשוי להשתנות מעט.
          </span>
        )}
        {!usd && <span className="muted small">אין כרגע שער מטבע, אז הסכום מוצג במטבעות המקוריים.</span>}
        {t.missing > 0 && <span className="muted small">{forAgent ? (t.missing === 1 ? "פריט אחד בלי מחיר לא נכלל" : `${t.missing} פריטים בלי מחיר לא נכללים`) : "חלק מהפריטים עוד בלי מחיר"}</span>}
      </div>
      <button type="button" className="text-link small" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "הסתרת הפירוט" : "פירוט"} <Icon name={open ? "up" : "down"} size={14} />
      </button>
      {open && (
        <ul className="total-lines">
          {t.lines.map((l) => {
            const u = toUSD(l.price, fx);
            return (
              <li key={l.key}>
                <Icon name={l.kind === "hotel" ? "bed" : "plane"} size={15} />
                <span className="grow" dir="auto">{l.label}</span>
                <span className="total-amt">
                  <span dir="ltr" className={l.price ? "" : "muted"}>{l.price ? formatPrice(l.price) : "—"}</span>
                  {l.price && l.price.currency !== "USD" && u !== null && <span className="muted small" dir="ltr">≈ {formatPrice({ currency: "USD", amount: u })}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
