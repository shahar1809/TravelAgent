import { useId } from "react";
import { CURRENCIES } from "../money.js";

// Currency + whole-number amount. Empty amount = no price shown.
export default function PriceField({ value, onChange, hint = "מוצג ללקוח" }) {
  const id = useId();
  const currency = value?.currency || "ILS";
  const amount = typeof value?.amount === "number" ? String(value.amount) : "";
  const setAmount = (raw) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 8);
    onChange(digits ? { currency, amount: Number(digits) } : null);
  };
  return (
    <div className="field">
      <label htmlFor={id}>מחיר</label>
      <div className="price-field">
        <input id={id} type="text" inputMode="numeric" pattern="[0-9]*" dir="ltr" placeholder="0" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if ([".", ",", "-", "e", "E", "+"].includes(e.key)) e.preventDefault(); }} />
        <select aria-label="מטבע" value={currency} onChange={(e) => onChange({ currency: e.target.value, amount: value?.amount ?? 0 })}>
          {CURRENCIES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}
        </select>
      </div>
      <span className="hint">{hint}. מספר שלם בלבד.</span>
    </div>
  );
}
