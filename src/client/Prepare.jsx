import { useState } from "react";
import { diffDays, range, todayIso, nights, shortDate } from "../dates.js";
import { hotelsState } from "../trip.js";
import { Link } from "../router.jsx";
import { Notice } from "../ui.jsx";

function Countdown({ trip }) {
  const today = todayIso();
  if (!trip.startDate) return null;
  if (today < trip.startDate) {
    const n = diffDays(today, trip.startDate);
    return <div className="count"><span className="num">{n}</span><span>{n === 1 ? "יום ליציאה" : "ימים ליציאה"}</span></div>;
  }
  if (!trip.endDate || today <= trip.endDate) {
    const total = trip.endDate ? diffDays(trip.startDate, trip.endDate) + 1 : null;
    return <div className="count"><span className="num">{diffDays(trip.startDate, today) + 1}</span><span>{total ? `יום בטיול מתוך ${total}` : "יום בטיול"}</span></div>;
  }
  return <div className="count"><span className="count-home">ברוכים השבים</span></div>;
}

export default function Prepare({ trip, act, base }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const hs = hotelsState(trip);
  const done = trip.done || {};
  const doneCount = trip.checklist.filter((c) => done[c.id]).length;
  const n = nights(trip.startDate, trip.endDate);

  const toggle = async (item) => {
    setBusy(item.id);
    setError("");
    try {
      await act("checklist", { itemId: item.id, done: !done[item.id] });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="stack-lg">
      <section className="hero">
        <svg className="hero-art" viewBox="0 0 346 70" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="290" cy="20" r="13" />
          <path d="M110 58 q20 -26 40 0M166 60 q11 -14 22 0M204 60 q8 -20 16 -6 q4 -6 8 6" />
          <path d="M0 68 q12 -5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
        </svg>
        <h1 className="display hero-title">{trip.title}</h1>
        <div className="hero-foot">
          <div className="hero-meta">
            <span>{range(trip.startDate, trip.endDate)}</span>
            <span>{[n ? `${n} לילות` : "", trip.travelers].filter(Boolean).join(", ")}</span>
          </div>
          <Countdown trip={trip} />
        </div>
      </section>

      {trip.intro && <p className="intro">{trip.intro}</p>}

      {hs.total > 0 && !hs.confirmed && (
        <section className="card card-action">
          <h2 className="display h2">{hs.chosen === 0 ? "בחרו מלון בכל עצירה" : `נבחרו ${hs.chosen} מתוך ${hs.total} מלונות`}</h2>
          <p className="muted">
            {trip.stops.map((s) => s.city).filter(Boolean).join(" ← ")}
          </p>
          <Link to="/hotels" className="btn btn-primary btn-block">{hs.chosen === 0 ? "לבחירת מלונות" : "להמשך הבחירה"}</Link>
        </section>
      )}
      {hs.confirmed && (
        <Notice kind="ok">המלונות אושרו. אני מטפלת בהזמנות, והשוברים יופיעו בארנק.</Notice>
      )}

      {trip.checklist.length > 0 && (
        <section className="stack">
          <div className="section-head">
            <h2 className="h3">מה צריך לסדר</h2>
            <span className="muted small">{doneCount} מתוך {trip.checklist.length}</span>
          </div>
          <div className="progress" aria-hidden="true"><span style={{ width: `${(doneCount / trip.checklist.length) * 100}%` }} /></div>
          {error && <Notice kind="error">{error}</Notice>}
          <ul className="checklist">
            {trip.checklist.map((c) => (
              <li key={c.id}>
                <label className={done[c.id] ? "is-done" : ""}>
                  <input type="checkbox" checked={!!done[c.id]} disabled={busy === c.id} onChange={() => toggle(c)} />
                  <span className="check-text">
                    <span className="check-title">{c.title}</span>
                    {(c.note || c.due) && (
                      <span className="muted small">{[c.note, c.due ? `עד ${shortDate(c.due)}` : ""].filter(Boolean).join(". ")}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {trip.goodToKnow.length > 0 && (
        <section className="stack">
          <h2 className="h3">טוב לדעת</h2>
          <div className="facts">
            {trip.goodToKnow.map((g) => (
              <div key={g.id} className="fact">
                <span className="muted small">{g.title}</span>
                <span className="display fact-value" dir="auto">{g.value}</span>
                {g.note && <span className="muted small">{g.note}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
