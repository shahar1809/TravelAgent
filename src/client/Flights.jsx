import { useState } from "react";
import { dayMonth, weekday } from "../dates.js";
import { LEGS, flightsState, layover, legsOf, nextDay, stopsLabel } from "../flights.js";
import { Icon, Notice } from "../ui.jsx";

function Segment({ s }) {
  return (
    <div className="seg">
      <div className="seg-end">
        <span className="seg-time">{s.departTime || "--:--"}</span>
        <span className="seg-code">{s.from}</span>
        <span className="muted small">{s.fromCity}{s.fromTerminal ? `, טרמינל ${s.fromTerminal}` : ""}</span>
      </div>
      <div className="seg-mid" aria-hidden="true">
        <span className="seg-line"><Icon name="plane" size={16} className="plane" /></span>
        {s.airline && <span className="small muted" dir="auto">{s.airline}</span>}
        {s.flightNumber && <span className="small mono" dir="ltr">{s.flightNumber}</span>}
      </div>
      <div className="seg-end far">
        <span className="seg-time">{s.arriveTime || "--:--"}{nextDay(s) && <sup className="plus1" title="למחרת">+1</sup>}</span>
        <span className="seg-code">{s.to}</span>
        <span className="muted small">{s.toCity}{s.toTerminal ? `, טרמינל ${s.toTerminal}` : ""}</span>
      </div>
      <span className="sr-only">
        {`${s.airline || ""} ${s.flightNumber || ""}, מ${s.fromCity || s.from} ב־${s.departTime} אל ${s.toCity || s.to}, נחיתה ב־${s.arriveTime}${nextDay(s) ? " למחרת" : ""}`}
      </span>
    </div>
  );
}

function OptionCard({ group, option, selected, locked, busy, onPick, agentName }) {
  const isPick = group.pickId === option.id;
  const inputId = `f-${group.id}-${option.id}`;
  const choose = () => { if (!locked && !busy && !selected) onPick(option.id); };
  return (
    <article className={`flight-opt${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={(e) => { if (!e.target.closest("a, input, label, details")) choose(); }}>
      <div className="opt-head">
        <label className="hotel-head" htmlFor={inputId}>
          <input id={inputId} type="radio" name={`fg-${group.id}`} checked={selected} disabled={locked || busy} onChange={choose} className="sr-radio" />
          <span className="radio-mark" aria-hidden="true">{selected && <Icon name="check" size={14} stroke={2.4} />}</span>
          <span className="hotel-name" dir="auto">{option.title || "אפשרות טיסה"}</span>
        </label>
        <div className="row">
          {isPick && <span className="chip chip-clay">ההמלצה של {agentName}</span>}
          {option.priceNote && <span className="price-note">{option.priceNote}</span>}
        </div>
      </div>

      {legsOf(option).map(({ leg, segments }) => (
        <section key={leg || "x"} className="leg">
          <div className="leg-head">
            <strong>{LEGS[leg]}</strong>
            {segments[0]?.departDate && <span className="muted small">{weekday(segments[0].departDate)}, {dayMonth(segments[0].departDate)}</span>}
            <span className="chip chip-sea">{stopsLabel(segments)}</span>
          </div>
          {segments.map((s, i) => (
            <div key={s.id}>
              {i > 0 && (
                <div className="layover">
                  <Icon name="clock" size={14} /> המתנה ב{segments[i - 1].toCity || segments[i - 1].to}
                  {layover(segments[i - 1], s) ? `: ${layover(segments[i - 1], s)}` : ""}
                </div>
              )}
              <Segment s={s} />
            </div>
          ))}
        </section>
      ))}

      <dl className="fare">
        {option.cabin && <><dt>מחלקה</dt><dd>{option.cabin}</dd></>}
        {option.baggage && <><dt>כבודה</dt><dd>{option.baggage}</dd></>}
        {option.fareNote && <><dt>שינויים וביטולים</dt><dd>{option.fareNote}</dd></>}
      </dl>
      {option.note && <p className="small" dir="auto">{option.note}</p>}
    </article>
  );
}

export default function Flights({ trip, act }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const groups = trip.flightGroups || [];
  const fs = flightsState(trip);
  const agentName = trip.agency?.agentName || "הסוכנת";

  if (!groups.length) {
    return (
      <div className="stack-lg">
        <h1 className="display h1">טיסות</h1>
        <p className="muted">הטיסות עוד בהכנה. כשהאפשרויות יהיו מוכנות, הן יופיעו כאן.</p>
      </div>
    );
  }

  const run = async (key, path, body) => {
    setBusy(key);
    setError("");
    try {
      await act(path, body);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="stack-lg">
      <div className="stack-sm">
        <h1 className="display h1">טיסות</h1>
        <p className="muted">
          {fs.confirmed
            ? "זו הטיסה שבחרתם. אם תרצו לשנות, פנו אליי ואפתח את הבחירה מחדש."
            : groups.some((g) => (g.options || []).length > 1)
              ? "בחרו את האפשרות שמתאימה לכם — ההמלצה שלי מסומנת. הבחירה נשמרת מיד, ובסוף מאשרים."
              : "אלה פרטי הטיסות שלכם. אשרו כדי שאזמין."}
        </p>
      </div>
      {fs.confirmed && <Notice kind="ok">אישרתם את הטיסות ב־{dayMonth(trip.flightsConfirmedAt.slice(0, 10))}.</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      {groups.map((g) => (
        <fieldset key={g.id} className="stop" disabled={fs.confirmed}>
          {(groups.length > 1 || g.title) && (
            <legend className="stop-head">
              <span className="stop-titles">
                <span className="display stop-city">{g.title || "טיסה"}</span>
                {g.note && <span className="muted small">{g.note}</span>}
              </span>
              {busy === g.id && <span className="muted small saving">שומר…</span>}
            </legend>
          )}
          <div className="hotels">
            {(g.options || []).map((o) => (
              <OptionCard key={o.id} group={g} option={o} agentName={agentName}
                selected={g.chosenId === o.id} locked={fs.confirmed} busy={!!busy}
                onPick={(oid) => run(g.id, "choose-flight", { groupId: g.id, optionId: oid })} />
            ))}
          </div>
        </fieldset>
      ))}

      {!fs.confirmed && (
        <div className="confirm-bar">
          <span>{fs.allChosen ? "בחרתם טיסה." : groups.length > 1 ? `נבחרו ${fs.chosen} מתוך ${fs.total}.` : "עוד לא נבחרה טיסה."}</span>
          <button type="button" className="btn btn-primary" disabled={!fs.allChosen || busy === "confirm"}
            onClick={() => run("confirm", "confirm-flights")}>
            {busy === "confirm" ? "שולח…" : "אישור הטיסות"}
          </button>
        </div>
      )}
    </div>
  );
}
