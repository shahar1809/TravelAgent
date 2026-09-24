import { useEffect, useRef, useState } from "react";
import { range, nights, dayMonth } from "../dates.js";
import { hotelsState } from "../trip.js";
import { Icon, Notice, Stars } from "../ui.jsx";
import { Gallery, Thumbs } from "./Photos.jsx";

// Collapsed: two lines of description. "קראו עוד" opens the full text, amenity tags and room types.
function HotelMore({ hotel }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const rooms = hotel.rooms || [];
  const tags = hotel.tags || [];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hotel.description]);
  const hasMore = long || tags.length > 0 || rooms.length > 0;
  const moreId = `more-${hotel.id}`;
  if (!hotel.description && !hasMore) return null;
  return (
    <div className="more">
      {hotel.description && <p ref={ref} className={`hotel-desc${open ? "" : " clamp"}`} dir="auto">{hotel.description}</p>}
      {open && (
        <div id={moreId} className="more-body">
          {tags.length > 0 && <ul className="tags">{tags.map((t) => <li key={t} dir="auto">{t}</li>)}</ul>}
          {rooms.length > 0 && (
            <section className="rooms">
              <h4 className="rooms-title">סוגי חדרים</h4>
              <ul>
                {rooms.map((r) => (
                  <li key={r.id} className="room">
                    <span className="room-name" dir="auto">{r.name}</span>
                    {r.description && <span className="muted small" dir="auto">{r.description}</span>}
                    <Thumbs images={r.images} title={r.name} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
      {hasMore && (
        <button type="button" className="text-link small more-btn" aria-expanded={open} aria-controls={moreId} onClick={() => setOpen(!open)}>
          {open ? "פחות" : rooms.length ? `קראו עוד · ${rooms.length} סוגי חדרים` : "קראו עוד"}
        </button>
      )}
    </div>
  );
}

function HotelCard({ stop, hotel, selected, locked, busy, onPick, agentName }) {
  const isPick = stop.pickId === hotel.id;
  const inputId = `h-${stop.id}-${hotel.id}`;
  const choose = () => { if (!locked && !busy && !selected) onPick(hotel.id); };
  return (
    <article className={`hotel${selected ? " selected" : ""}${locked ? " locked" : ""}`}
      onClick={(e) => { if (!e.target.closest("a, button, details, input, label, dialog")) choose(); }}>
      <div className="hotel-media" style={{ background: hotel.color || "#2E5A5C" }}>
        <Gallery images={hotel.images?.length ? hotel.images : hotel.imageUrl ? [hotel.imageUrl] : []} title={hotel.name} />
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
        <HotelMore hotel={hotel} />
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
