import { useState } from "react";
import { newId } from "../trip.js";
import { Icon } from "../ui.jsx";
import PhotoPicker from "./PhotoPicker.jsx";

const img = (u) => <img src={u} alt="" loading="lazy" referrerPolicy="no-referrer" />;

// General photos (up to 5) and room types (each up to 2 photos, ticked ones shown to the client).
export default function HotelMedia({ hotel, set }) {
  const [picker, setPicker] = useState(null); // { title, onPick, taken }
  const [roomsOpen, setRoomsOpen] = useState(false);
  const pool = hotel.photoPool || [];
  const images = hotel.images || [];
  const rooms = hotel.rooms || [];

  const pickGeneral = () => setPicker({
    title: "בחירת תמונות כלליות",
    taken: images,
    onPick: (u) => set((h) => {
      h.images = h.images || [];
      const i = h.images.indexOf(u);
      if (i >= 0) h.images.splice(i, 1);
      else if (h.images.length < 5) h.images.push(u);
    }),
  });

  const pickRoom = (ri, slot) => setPicker({
    title: `תמונה ל${rooms[ri].name || "חדר"}`,
    taken: rooms[ri].images,
    onPick: (u) => { set((h) => { h.rooms[ri].images[slot] = u; h.rooms[ri].images = h.rooms[ri].images.filter(Boolean); }); setPicker(null); },
  });

  const addByUrl = () => {
    const u = window.prompt("קישור לתמונה (https://…)");
    if (u && /^https:\/\//.test(u.trim())) set((h) => { h.images = [...(h.images || []), u.trim()].slice(0, 5); });
  };

  return (
    <div className="stack">
      <div className="row between">
        <span className="label-strong">תמונות כלליות ({images.length}/5)</span>
        <div className="row">
          {pool.length > 0 && <button type="button" className="text-link small" onClick={pickGeneral}>בחירה מהתמונות</button>}
          <button type="button" className="text-link small" onClick={addByUrl}>הוספה מקישור</button>
        </div>
      </div>
      {images.length > 0 ? (
        <div className="thumbs">
          {images.map((u, i) => (
            <div key={u} className={`thumb${i === 0 ? " cover" : ""}`}>
              {img(u)}
              {i === 0 ? <span className="thumb-tag">ראשית</span> : (
                <button type="button" className="thumb-btn start" aria-label="להפוך לתמונה ראשית" onClick={() => set((h) => { h.images.splice(i, 1); h.images.unshift(u); })}><Icon name="star" size={12} /></button>
              )}
              <button type="button" className="thumb-btn" aria-label="הסרת התמונה" onClick={() => set((h) => { h.images.splice(i, 1); })}><Icon name="plus" size={12} style={{ transform: "rotate(45deg)" }} /></button>
            </div>
          ))}
        </div>
      ) : <p className="muted small">בלי תמונות מוצג ללקוח צבע.</p>}

      <button type="button" className="rooms-toggle" aria-expanded={roomsOpen} onClick={() => setRoomsOpen(!roomsOpen)}>
        <span className="label-strong">סוגי חדרים</span>
        <span className="muted small">
          {rooms.length ? `${rooms.length} סוגים · ${rooms.filter((r) => r.show).length} מוצגים ללקוח` : "אין עדיין"}
        </span>
        <Icon name={roomsOpen ? "up" : "down"} size={16} />
      </button>
      {roomsOpen && (
        <>
          {rooms.length === 0 && <p className="muted small">אין סוגי חדרים. הם מתמלאים בייבוא, או שאפשר להוסיף ידנית.</p>}
          {rooms.map((r, ri) => (
            <div key={r.id} className={`room-edit${r.show ? " on" : ""}`}>
              <label className="radio-line">
                <input type="checkbox" checked={r.show} onChange={(e) => set((h) => { h.rooms[ri].show = e.target.checked; })} />
                להציג ללקוח
              </label>
              <input dir="auto" aria-label="שם סוג החדר" placeholder="שם סוג החדר" value={r.name} onChange={(e) => set((h) => { h.rooms[ri].name = e.target.value; })} />
              <input dir="auto" aria-label="תיאור קצר" placeholder="תיאור קצר: מיטות, גודל, נוף" value={r.description} onChange={(e) => set((h) => { h.rooms[ri].description = e.target.value; })} />
              <div className="room-thumbs">
                {[0, 1].map((slot) => (
                  <button key={slot} type="button" className="room-slot" onClick={() => pickRoom(ri, slot)} aria-label={r.images[slot] ? "החלפת תמונה" : "בחירת תמונה"}>
                    {r.images[slot] ? img(r.images[slot]) : <Icon name="plus" size={16} />}
                  </button>
                ))}
                <button type="button" className="icon-btn danger small-btn" aria-label={`מחיקת ${r.name || "סוג חדר"}`} onClick={() => set((h) => { h.rooms.splice(ri, 1); })}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          ))}
          <button type="button" className="text-link small" onClick={() => set((h) => { h.rooms = [...(h.rooms || []), { id: newId(), sourceId: "", name: "", description: "", images: [], show: true }]; })}>הוספת סוג חדר</button>
        </>
      )}
      {picker && <PhotoPicker photos={pool} title={picker.title} taken={picker.taken} onPick={picker.onPick} onClose={() => setPicker(null)} />}
    </div>
  );
}
