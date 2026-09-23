import { addDays } from "./dates.js";
import { flightOptionFor } from "./flights.js";

// The hotel for a stop: the client's choice, else the agent's pick.
export function stopHotel(stop) {
  return stop.hotels.find((h) => h.id === (stop.chosenId || stop.pickId)) || null;
}

// Where the travelers sleep on a given night.
export function stayOn(trip, day) {
  return trip.stops.find((s) => s.checkIn && s.checkOut && s.checkIn <= day && day < s.checkOut) || null;
}

// Timeline for one day: agent items plus check-in / check-out derived from the stops.
export function dayTimeline(trip, day) {
  const list = trip.items.filter((i) => i.date === day).map((i) => ({ ...i, source: "item" }));
  for (const s of trip.stops) {
    const hotel = stopHotel(s);
    const name = hotel ? hotel.name : s.city;
    if (s.checkIn === day) list.push({ id: `in-${s.id}`, time: "15:00", kind: "stay", title: `צ׳ק־אין · ${name}`, place: s.city, note: "", source: "stay" });
    if (s.checkOut === day) list.push({ id: `out-${s.id}`, time: "11:00", kind: "stay", title: `צ׳ק־אאוט · ${name}`, place: s.city, note: "", source: "stay" });
  }
  for (const g of trip.flightGroups || []) {
    const o = flightOptionFor(g);
    if (!o) continue;
    for (const x of o.segments || []) {
      if (x.departDate !== day) continue;
      const late = x.arriveDate && x.arriveDate > x.departDate;
      list.push({
        id: `fl-${x.id}`, time: x.departTime, endTime: "", kind: "flight", source: "flight",
        title: `טיסה ל${x.toCity || x.to}`,
        place: x.from ? `${x.fromCity || x.from}${x.fromTerminal ? `, טרמינל ${x.fromTerminal}` : ""}` : "",
        note: [x.arriveTime ? `נחיתה ${x.arriveTime}${late ? " (למחרת)" : ""}` : "", [x.airline, x.flightNumber].filter(Boolean).join(" "), g.chosenId ? "" : "לפי ההמלצה, עד שתבחרו טיסה"].filter(Boolean).join(" · "),
      });
    }
  }
  return list.sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
}

export function daysWithPlans(trip) {
  const set = new Set(trip.items.map((i) => i.date).filter(Boolean));
  for (const g of trip.flightGroups || []) for (const x of flightOptionFor(g)?.segments || []) if (x.departDate) set.add(x.departDate);
  for (const s of trip.stops) {
    if (s.checkIn) set.add(s.checkIn);
    if (s.checkOut) set.add(s.checkOut);
  }
  return set;
}

export const newId = () => Math.random().toString(36).slice(2, 10);

export function hotelsState(trip) {
  const total = trip.stops.length;
  const chosen = trip.stops.filter((s) => s.chosenId).length;
  return { total, chosen, confirmed: !!trip.hotelsConfirmedAt, allChosen: total > 0 && chosen === total };
}

export { addDays };
