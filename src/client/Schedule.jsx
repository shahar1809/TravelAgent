import { useMemo, useState } from "react";
import { calendarUrl } from "../api.js";
import { addDays, dayMonth, diffDays, eachDay, iso, monthYear, parse, todayIso, weekday } from "../dates.js";
import { dayTimeline, daysWithPlans, stayOn, stopHotel } from "../trip.js";
import { ITEM_KINDS, Icon } from "../ui.jsx";

const WEEK = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function months(start, end) {
  const out = [];
  let d = parse(start);
  d = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = parse(end);
  while (d <= last && out.length < 12) {
    out.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return out;
}

const STAY_COLORS = ["#2E5A5C", "#C8923A", "#6B7248", "#B5502F", "#6E9A9B", "#8E5A2E"];

// Stays as half-day ranges from the trip start: on a move day the old place gets the morning, the new one the afternoon.
function stayRanges(trip) {
  const stops = trip.stops.filter((s) => s.city && s.checkIn && s.checkOut && s.checkIn < s.checkOut);
  return stops.map((s, i) => {
    const moveIn = stops.some((o) => o !== s && o.checkOut === s.checkIn);
    const moveOut = stops.some((o) => o !== s && o.checkIn === s.checkOut);
    const hotel = stopHotel(s);
    return {
      id: s.id, city: s.city, checkIn: s.checkIn, nights: diffDays(s.checkIn, s.checkOut),
      color: hotel?.color || STAY_COLORS[i % STAY_COLORS.length],
      start: diffDays(trip.startDate, s.checkIn) * 2 + (moveIn ? 1 : 0),
      end: diffDays(trip.startDate, s.checkOut) * 2 + (moveOut ? 0 : 1),
    };
  });
}

// The location strip above one week: each day is 4 grid tracks (edge, morning, afternoon, edge).
function StayLane({ week, inMonth, trip, ranges, onSelect }) {
  const bars = [];
  for (const r of ranges) {
    let first = null;
    let last = null;
    week.forEach((d, c) => {
      if (!inMonth[c]) return;
      for (const h of [0, 1]) {
        const u = diffDays(trip.startDate, d) * 2 + h;
        if (u >= r.start && u <= r.end) {
          if (!first) first = { c, h, u };
          last = { c, h, u };
        }
      }
    });
    if (!first) continue;
    const startsHere = first.u === r.start;
    const endsHere = last.u === r.end;
    const from = first.h === 0 ? first.c * 4 + 1 : first.c * 4 + 3;
    const to = last.h === 1 ? last.c * 4 + 5 : last.c * 4 + 3;
    bars.push(
      <button key={r.id} type="button" className={`stay-bar${startsHere ? " starts" : ""}${endsHere ? " ends" : ""}`}
        style={{ gridColumn: `${from} / ${to}`, "--stay": r.color }}
        onClick={() => onSelect(r.checkIn)} aria-label={`${r.city}, ${r.nights} לילות. מעבר ליום הראשון`}>
        {to - from > 4 && (startsHere ? <Icon name="pin" size={12} /> : <Icon name="back" size={12} />)}
        <span className="stay-name">{r.city}</span>
        {startsHere && to - from >= 12 && <span className="stay-nights">{r.nights} לילות</span>}
      </button>,
    );
  }
  return <div className="stay-lane">{bars}</div>;
}

function Month({ first, trip, selected, onSelect, plans, ranges }) {
  const y = first.getFullYear();
  const m = first.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const today = todayIso();
  const weeks = [];
  const count = Math.ceil((first.getDay() + daysIn) / 7);
  for (let w = 0; w < count; w++) {
    const week = [];
    const inMonth = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(y, m, 1 - first.getDay() + w * 7 + i);
      week.push(iso(dt));
      inMonth.push(dt.getMonth() === m);
    }
    weeks.push({ week, inMonth });
  }
  return (
    <section className="month">
      <h2 className="h3">{monthYear(iso(first))}</h2>
      <div className="cal-head" aria-hidden="true">{WEEK.map((w) => <span key={w} className="cal-wd">{w}</span>)}</div>
      {weeks.map(({ week, inMonth }) => (
        <div key={week[0]} className="cal-week">
          {ranges.length > 0 && <StayLane week={week} inMonth={inMonth} trip={trip} ranges={ranges} onSelect={onSelect} />}
          <div className="cal-grid">
            {week.map((d, i) => {
              if (!inMonth[i]) return <span key={d} />;
              const inTrip = d >= trip.startDate && d <= trip.endDate;
              const num = Number(d.slice(8));
              if (!inTrip) return <span key={d} className={`cal-day out${d === today ? " today" : ""}`}>{num}</span>;
              const cls = ["cal-day", "in", d === selected ? "sel" : "", d === today ? "today" : ""].join(" ");
              return (
                <button key={d} type="button" className={cls} aria-pressed={d === selected}
                  aria-label={`${weekday(d)}, ${dayMonth(d)}`} onClick={() => onSelect(d)}>
                  <span>{num}</span>
                  {plans.has(d) && <span className="cal-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Schedule({ trip }) {
  const days = eachDay(trip.startDate, trip.endDate);
  const today = todayIso();
  const [selected, setSelected] = useState(days.includes(today) ? today : days[0]);
  const plans = useMemo(() => daysWithPlans(trip), [trip]);
  const ranges = useMemo(() => stayRanges(trip), [trip]);

  if (!days.length) {
    return (
      <div className="stack-lg">
        <h1 className="display h1">לו״ז</h1>
        <p className="muted">עוד לא נקבעו תאריכים לטיול. כשהלו״ז יהיה מוכן, הוא יופיע כאן.</p>
      </div>
    );
  }

  const timeline = dayTimeline(trip, selected);
  const stay = stayOn(trip, selected);
  const hotel = stay ? stopHotel(stay) : null;
  const idx = days.indexOf(selected);

  return (
    <div className="stack-lg">
      <div className="section-head">
        <h1 className="display h1">לו״ז</h1>
        <a className="btn btn-ghost" href={calendarUrl()}>
          <Icon name="calendar" size={16} /> הוספה ליומן
        </a>
      </div>

      <div className="months">
        {months(trip.startDate, trip.endDate).map((m) => (
          <Month key={m.getTime()} first={m} trip={trip} selected={selected} onSelect={setSelected} plans={plans} ranges={ranges} />
        ))}
      </div>

      <section className="day" aria-live="polite">
        <div className="day-head">
          <button type="button" className="icon-btn" aria-label="היום הקודם" disabled={idx <= 0} onClick={() => setSelected(days[idx - 1])}>
            <Icon name="back" />
          </button>
          <div className="day-titles">
            <span className="muted small">יום {diffDays(trip.startDate, selected) + 1} מתוך {days.length}{selected === today ? ", היום" : ""}</span>
            <h2 className="display h2">{weekday(selected)}, {dayMonth(selected)}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="היום הבא" disabled={idx >= days.length - 1} onClick={() => setSelected(days[idx + 1])}>
            <Icon name="forward" />
          </button>
        </div>

        {timeline.length === 0 ? (
          <p className="muted empty-day">יום חופשי. אין תוכניות מתוזמנות.</p>
        ) : (
          <ol className="timeline">
            {timeline.map((it) => {
              const kind = it.kind === "stay" ? { label: "לינה", icon: "bed" } : ITEM_KINDS[it.kind] || ITEM_KINDS.other;
              return (
                <li key={it.id} className={`tl-item kind-${it.kind}`}>
                  <span className="tl-time"><span>{it.time || "—"}</span>{it.endTime && <span className="tl-end">עד {it.endTime}</span>}</span>
                  <span className="tl-dot" aria-hidden="true"><Icon name={kind.icon} size={14} /></span>
                  <div className="tl-body">
                    <span className="tl-title">{it.title}</span>
                    {it.place && <span className="muted small">{it.place}</span>}
                    {it.note && <span className="tl-note">{it.note}</span>}
                    {it.kind === "tip" && <span className="chip chip-clay">טיפ שלי</span>}
                    {it.mapUrl && (
                      <a className="text-link" href={it.mapUrl} target="_blank" rel="noreferrer">
                        <Icon name="map" size={14} /> ניווט
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {stay && (
          <div className="tonight">
            <Icon name="bed" />
            <span>
              <span className="muted small">לנים הלילה ב{stay.city}</span>
              <strong>{hotel ? hotel.name : "המלון עוד לא נבחר"}</strong>
            </span>
          </div>
        )}
        {!stay && selected === trip.endDate && <p className="muted small">היום האחרון — חוזרים הביתה.</p>}
      </section>
    </div>
  );
}
