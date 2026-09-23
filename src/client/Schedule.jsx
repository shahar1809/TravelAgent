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

function Month({ first, trip, selected, onSelect, plans }) {
  const y = first.getFullYear();
  const m = first.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(iso(new Date(y, m, d)));
  const today = todayIso();
  return (
    <section className="month">
      <h2 className="h3">{monthYear(iso(first))}</h2>
      <div className="cal-grid" role="grid">
        {WEEK.map((w) => <span key={w} className="cal-wd" aria-hidden="true">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
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
    </section>
  );
}

export default function Schedule({ trip }) {
  const days = eachDay(trip.startDate, trip.endDate);
  const today = todayIso();
  const [selected, setSelected] = useState(days.includes(today) ? today : days[0]);
  const plans = useMemo(() => daysWithPlans(trip), [trip]);

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
          <Month key={m.getTime()} first={m} trip={trip} selected={selected} onSelect={setSelected} plans={plans} />
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
