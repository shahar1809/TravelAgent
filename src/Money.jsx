import { priceParts } from "./money.js";

// "$4,185": the symbol in the body font (Horev draws ₪/$/€ oversized), always left-to-right.
export function Money({ price, className = "" }) {
  const p = priceParts(price);
  if (!p) return null;
  return (
    <span className={`money ${className}`} dir="ltr">
      <span className="cur">{p.symbol}</span>{p.number}
    </span>
  );
}

// Several prices joined with " + ".
export function MoneyList({ prices }) {
  return (
    <span className="money" dir="ltr">
      {prices.map((p, i) => <span key={p.currency}>{i > 0 && " + "}<Money price={p} /></span>)}
    </span>
  );
}
