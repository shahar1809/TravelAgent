import { dayMonth, nights } from "../dates.js";
import { newId } from "../trip.js";
import { Icon, Notice } from "../ui.jsx";
import { Area, Field, Select, TagsField } from "./fields.jsx";

const COLORS = ["#2E5A5C", "#C8923A", "#6B7248", "#B5502F", "#6E9A9B", "#8E5A2E"];

function move(list, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

export default function EditHotels({ trip, update, saved, action }) {
  const addStop = () => update((t) => {
    const prev = t.stops[t.stops.length - 1];
    t.stops.push({ id: newId(), city: "", checkIn: prev?.checkOut || t.startDate || "", checkOut: "", note: "", pickId: "", hotels: [] });
  });
  const confirmed = saved?.hotelsConfirmedAt;
  const chosen = (saved?.stops || []).reduce((m, s) => ({ ...m, [s.id]: s.chosenId }), {});

  return (
    <div className="stack-lg">
      {confirmed ? (
        <Notice kind="ok">
          הלקוח אישר את המלונות ב־{dayMonth(confirmed.slice(0, 10))}.{" "}
          <button type="button" className="text-link" onClick={() => action("unlock", "לפתוח את הבחירה מחדש? הלקוח יוכל לשנות ולאשר שוב.")}>
            פתיחה מחדש לשינויים
          </button>
        </Notice>
      ) : (
        <p className="muted">הלקוח רואה את העצירות לפי הסדר, ובוחר מלון אחד בכל עצירה. המלון שמסומן כהמלצה שלך מודגש אצלו.</p>
      )}

      {trip.stops.map((s, si) => (
        <section key={s.id} className="panel stack">
          <div className="panel-head">
            <span className="display stop-num">{si + 1}</span>
            <strong className="panel-title">{s.city || "עצירה חדשה"}</strong>
            <span className="muted small">{nights(s.checkIn, s.checkOut) ? `${nights(s.checkIn, s.checkOut)} לילות` : ""}</span>
            <div className="row end grow">
              <button type="button" className="icon-btn" aria-label="להזיז למעלה" disabled={si === 0} onClick={() => update((t) => move(t.stops, si, -1))}><Icon name="up" /></button>
              <button type="button" className="icon-btn" aria-label="להזיז למטה" disabled={si === trip.stops.length - 1} onClick={() => update((t) => move(t.stops, si, 1))}><Icon name="down" /></button>
              <button type="button" className="icon-btn danger" aria-label={`מחיקת העצירה ${s.city}`} onClick={() => {
                if (window.confirm(`למחוק את העצירה ${s.city || ""}?`)) update((t) => { t.stops.splice(si, 1); });
              }}><Icon name="trash" /></button>
            </div>
          </div>
          <div className="grid-3">
            <Field label="מקום" value={s.city} onChange={(v) => update((t) => { t.stops[si].city = v; })} />
            <Field label="צ׳ק־אין" type="date" value={s.checkIn} onChange={(v) => update((t) => { t.stops[si].checkIn = v; })} />
            <Field label="צ׳ק־אאוט" type="date" value={s.checkOut} onChange={(v) => update((t) => { t.stops[si].checkOut = v; })} />
          </div>
          <Area label="כמה מילים על העצירה" rows={2} value={s.note} onChange={(v) => update((t) => { t.stops[si].note = v; })} />

          <div className="hotel-editors">
            {s.hotels.map((h, hi) => (
              <div key={h.id} className={`hotel-editor${s.pickId === h.id ? " is-pick" : ""}`}>
                <div className="row between">
                  <label className="radio-line">
                    <input type="radio" name={`pick-${s.id}`} checked={s.pickId === h.id} onChange={() => update((t) => { t.stops[si].pickId = h.id; })} />
                    ההמלצה שלי
                  </label>
                  <div className="row">
                    {chosen[s.id] === h.id && <span className="chip chip-ok">הלקוח בחר</span>}
                    <button type="button" className="icon-btn danger" aria-label={`מחיקת ${h.name || "מלון"}`} onClick={() => update((t) => {
                      t.stops[si].hotels.splice(hi, 1);
                      if (t.stops[si].pickId === h.id) t.stops[si].pickId = "";
                    })}><Icon name="trash" size={18} /></button>
                  </div>
                </div>
                <Field label="שם המלון" value={h.name} onChange={(v) => update((t) => { t.stops[si].hotels[hi].name = v; })} />
                <div className="grid-2">
                  <Select label="כוכבים" value={String(h.stars)} onChange={(v) => update((t) => { t.stops[si].hotels[hi].stars = Number(v); })}
                    options={[["0", "ללא"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]} />
                  <Field label="הערת מחיר" hint="למשל: הכי משתלם" value={h.priceNote} onChange={(v) => update((t) => { t.stops[si].hotels[hi].priceNote = v; })} />
                </div>
                <Area label="תיאור" rows={3} value={h.description} onChange={(v) => update((t) => { t.stops[si].hotels[hi].description = v; })} />
                <TagsField label="תגיות" value={h.tags} onChange={(v) => update((t) => { t.stops[si].hotels[hi].tags = v; })} />
                <Field label="קישור לאתר המלון" type="url" dir="ltr" value={h.link} onChange={(v) => update((t) => { t.stops[si].hotels[hi].link = v; })} />
                <Field label="קישור לתמונה" type="url" dir="ltr" hint="אופציונלי. בלי תמונה מוצג צבע" value={h.imageUrl} onChange={(v) => update((t) => { t.stops[si].hotels[hi].imageUrl = v; })} />
                <div className="swatches" role="radiogroup" aria-label="צבע">
                  {COLORS.map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={h.color === c} aria-label={c}
                      className={`swatch${h.color === c ? " on" : ""}`} style={{ background: c }}
                      onClick={() => update((t) => { t.stops[si].hotels[hi].color = c; })} />
                  ))}
                </div>
              </div>
            ))}
            {s.hotels.length < 6 && (
              <button type="button" className="hotel-add" onClick={() => update((t) => {
                const hid = newId();
                t.stops[si].hotels.push({ id: hid, name: "", stars: 4, description: "", tags: [], priceNote: "", link: "", imageUrl: "", color: COLORS[t.stops[si].hotels.length % COLORS.length] });
                if (!t.stops[si].pickId) t.stops[si].pickId = hid;
              })}>
                <Icon name="plus" /> הוספת מלון
              </button>
            )}
          </div>
        </section>
      ))}

      <button type="button" className="btn btn-ghost" onClick={addStop}><Icon name="plus" size={16} /> הוספת עצירה</button>
    </div>
  );
}
