import { useEffect, useState } from "react";

const KEY = "fx_rates";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };

// { date, rates } where rates[X] = X per 1 USD. Falls back to the last rates seen on this device.
export function useRates() {
  const [rates, setRates] = useState(read);
  useEffect(() => {
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.rates) { setRates(j); try { localStorage.setItem(KEY, JSON.stringify(j)); } catch {} } })
      .catch(() => {});
  }, []);
  return rates;
}

// Converts a {currency, amount} to whole US dollars, or null if no rate.
export function toUSD(price, fx) {
  if (!price) return null;
  if (price.currency === "USD") return price.amount;
  const r = fx?.rates?.[price.currency];
  return r > 0 ? Math.round(price.amount / r) : null;
}
