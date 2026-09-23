import { useState } from "react";
import { range, nights, dayMonth } from "../dates.js";
import { hotelsState } from "../trip.js";
import { Icon, Notice, Stars } from "../ui.jsx";

function Gallery({ hotel }) {
  const images = hotel.images?.length ? hotel.images : hotel.imageUrl ? [hotel.imageUrl] : [];
  if (!images.length) return null;
  return (
    <div className="gallery" tabIndex={images.length > 1 ? 0 : undefined} aria-label={images.length > 1 ? `${images.length} תמונות, גללו הצידה` : undefined}>
      {images.map((u, i) => <img key={u} src={u} alt={i === 0 ? hotel.name : ""} loading="lazy" referrerPolicy="no-referrer" />)}
      {images.length > 1 && <span className="gallery-count">{images.length} תמונות</span>}
    </div>
  );
}

function HotelCard({ stop, hotel, selected, locked, busy, onPick, agentName }) {
  const isPick = stop.pickId === hotel.id;
  const inputId = `h-${stop.id}-${hotel.id}`;
  const rooms = hotel.rooms || [];
  const choose = () => { if (!locked && !busy && !selected) onPick(hotel.id); };
  return (
    <article className={`hotel${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={(e) => { if (!e.target.closest("a, details, input, label")) choose(); }}>
      <div className="hotel-media" style={{ background: hotel.color || "#2E5A5C" }}>
        <Gallery hotel={hotel} />
        {isPick && <span className="pick-badge">ההמלצה של {agentName}</span>}
      </div>
      <div className="hotel-body">
        <label className="hotel-head" htmlFor={inputId}>
          <input id={inputId} type="radio" name={`stop-${stop.id}`} checked={selected} disabled={locked || busy}
            onChange={choose} className="sr-radio" />
          <span className="radio-mark" aria-hidden="true">{selected && <Icon name="check" size={14} stroke={2.4} />}</span>
          <span className="hotel-name" dir="auto">{hotel.name}</span>
        </label>
        <div className="hotel-meta">
          <Stars n={hotel.stars} />
          {hotel.priceNote && <span className="price-note">{hotel.priceNote}</span>}
        </div>
        {hotel.address && <span className="muted small" dir="auto">{hotel.address}</span>}
        {hotel.description && <p className="hotel-desc" dir="auto">{hotel.description}</p>}
        {hotel.tags.length > 0 && (
          <ul className="tags">{hotel.tags.map((t) => <li key={t} dir="auto">{t}</li>)}</ul>
        )}
        {rooms.length > 0 && (
          <details className="rooms">
            <summary>סוגי חדרים ({rooms.length})</summary>
            <ul>
              {rooms.map((r) => (
                <li key={r.id} className="room">
                  <span className="room-name" dir="auto">{r.name}</span>
                  {r.description && <span className="muted small" dir="auto">{r.description}</span>}
                  {r.images.length > 0 && (
                    <div className="room-imgs">
                      {r.images.map((u) => <img key={u} src={u} alt="" loading="lazy" referrerPolicy="no-referrer" />)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
        {hotel.link && (
          <a className="text-link" href={hotel.link} target="_blank" rel="noreferrer">
            לאתר המלון <Icon name="external" size={14} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function Hotels({ trip, act }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const hs = hotelsState(trip);
  const agentName = trip.agency?.agentName || "הסוכנת";

  if (!trip.stops.length) {
    return (
      <div className="stack-lg">
        <h1 className="display h1">מלונות</h1>
        <p className="muted">המסלול עוד בהכנה. כשהמלונות יהיו מוכנים לבחירה, הם יופיעו כאן.</p>
      </div>
    );
  }

  const pick = async (stopId, hotelId) => {
    setBusy(stopId);
    setError("");
    try {
      await act("choose", { stopId, hotelId });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const confirm = async () => {
    setBusy("confirm");
    setError("");
    try {
      await act("confirm");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="stack-lg">
      <div className="stack-sm">
        <h1 className="display h1">מלונות</h1>
        <p className="muted">
          {hs.confirmed
            ? "זו הבחירה שלכם. אם תרצו לשנות משהו, פנו אליי ואפתח אותה מחדש."
            : `המסלול סגור. בכל עצירה בוחרים מלון אחד — ההמלצה שלי מסומנת. הבחירה נשמרת מיד, ובסוף מאשרים.`}
        </p>
      </div>

      {hs.confirmed && <Notice kind="ok">אישרתם את המלונות ב־{dayMonth(trip.hotelsConfirmedAt.slice(0, 10))}.</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      {trip.stops.map((stop, i) => {
        const n = nights(stop.checkIn, stop.checkOut);
        return (
          <fieldset key={stop.id} className="stop" disabled={hs.confirmed}>
            <legend className="stop-head">
              <span className="display stop-num">{i + 1}</span>
              <span className="stop-titles">
                <span className="display stop-city">{stop.city}</span>
                <span className="muted small">{[range(stop.checkIn, stop.checkOut), n ? `${n} לילות` : ""].filter(Boolean).join(", ")}</span>
              </span>
              {busy === stop.id && <span className="muted small saving">שומר…</span>}
            </legend>
            {stop.note && <p className="muted stop-note">{stop.note}</p>}
            <div className="hotels">
              {stop.hotels.map((h) => (
                <HotelCard key={h.id} stop={stop} hotel={h} agentName={agentName}
                  selected={stop.chosenId === h.id} locked={hs.confirmed} busy={!!busy}
                  onPick={(hid) => pick(stop.id, hid)} />
              ))}
            </div>
          </fieldset>
        );
      })}

      {!hs.confirmed && (
        <div className="confirm-bar">
          <span>{hs.allChosen ? "בחרתם מלון בכל העצירות." : `נבחרו ${hs.chosen} מתוך ${hs.total}.`}</span>
          <button type="button" className="btn btn-primary" disabled={!hs.allChosen || busy === "confirm"} onClick={confirm}>
            {busy === "confirm" ? "שולח…" : "אישור הבחירה"}
          </button>
        </div>
      )}
    </div>
  );
}
