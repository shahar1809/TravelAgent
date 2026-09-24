import { dayMonth, nights } from "../dates.js";
import { newId } from "../trip.js";
import { Icon, Notice } from "../ui.jsx";
import { useState } from "react";
import { api } from "../api.js";
import { Area, Field } from "./fields.jsx";
import HotelForm, { HOTEL_COLORS as COLORS, emptyHotel } from "./HotelForm.jsx";
import BankPicker from "./BankPicker.jsx";
import SaveToBank from "./SaveToBank.jsx";
import { folderLabel, useBank } from "./bank.js";


function move(list, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

export default function EditHotels({ trip, update, saved, action }) {
  const { bank, setBank } = useBank();
  const [picking, setPicking] = useState(null); // stop index
  const [saving, setSaving] = useState(null); // { si, hi }
  const [note, setNote] = useState(null);
  const folderOf = (bankId) => bank?.folders.find((f) => f.id === bank.hotels.find((x) => x.id === bankId)?.folderId);

  const pushToBank = async (h) => {
    if (!window.confirm(`לעדכן את ״${h.name}״ במאגר לפי הגרסה שבטיול הזה? טיולים אחרים לא משתנים.`)) return;
    try {
      const res = await api(`bank/hotels/${h.bankId}`, { method: "PUT", body: { hotel: h } });
      setBank(res.bank);
      setNote({ kind: "ok", text: `״${h.name}״ עודכן במאגר.` });
    } catch (e) {
      setNote({ kind: "error", text: e.message });
    }
  };
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

      {note && <Notice kind={note.kind}>{note.text}</Notice>}
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
          <div className="row">
            <button type="button" className="btn btn-primary" disabled={!bank || s.hotels.length >= 6} onClick={() => setPicking(si)}>
              <Icon name="bed" size={16} /> בחירה מהמאגר
            </button>
            {bank && <span className="muted small">{bank.hotels.length ? `${bank.hotels.length} מלונות במאגר` : "המאגר עוד ריק"}</span>}
          </div>

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
                    {bank && h.bankId && folderOf(h.bankId) && (
                      <>
                        <span className="chip chip-sea" title={folderLabel(folderOf(h.bankId))}>מהמאגר · {folderOf(h.bankId).name}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => pushToBank(h)}>עדכון במאגר</button>
                      </>
                    )}
                    {bank && (!h.bankId || !folderOf(h.bankId)) && h.name && (
                      <button type="button" className={`btn btn-sm ${h.link ? "btn-primary" : "btn-ghost"}`} onClick={() => setSaving({ si, hi })}>
                        <Icon name="plus" size={14} /> הוספה למאגר
                      </button>
                    )}
                    <button type="button" className="icon-btn danger" aria-label={`מחיקת ${h.name || "מלון"}`} onClick={() => update((t) => {
                      t.stops[si].hotels.splice(hi, 1);
                      if (t.stops[si].pickId === h.id) t.stops[si].pickId = "";
                    })}><Icon name="trash" size={18} /></button>
                  </div>
                </div>
                <HotelForm hotel={h} set={(fn) => update((t) => fn(t.stops[si].hotels[hi]))} />
              </div>
            ))}
            {s.hotels.length < 6 && (
              <button type="button" className="hotel-add" onClick={() => update((t) => {
                const hid = newId();
                t.stops[si].hotels.push(emptyHotel(hid, COLORS[t.stops[si].hotels.length % COLORS.length]));
                if (!t.stops[si].pickId) t.stops[si].pickId = hid;
              })}>
                <Icon name="plus" /> הוספת מלון
              </button>
            )}
          </div>
        </section>
      ))}

      <button type="button" className="btn btn-ghost" onClick={addStop}><Icon name="plus" size={16} /> הוספת עצירה</button>

      {picking !== null && bank && (
        <BankPicker bank={bank} stop={trip.stops[picking]} onClose={() => setPicking(null)}
          onAdd={(list) => {
            update((t) => {
              const st = t.stops[picking];
              for (const b of list) {
                if (st.hotels.length >= 6 || st.hotels.some((x) => x.bankId === b.bankId)) continue;
                const hid = newId();
                st.hotels.push({ ...b, id: hid, bankId: b.bankId, priceNote: "" });
                if (!st.pickId) st.pickId = hid;
              }
            });
            setNote({ kind: "ok", text: `נוספו ${list.length === 1 ? "מלון אחד" : `${list.length} מלונות`} מהמאגר. לחצי ״שמירה״ כדי שהלקוח יראה.` });
            setPicking(null);
          }} />
      )}
      {saving && bank && (
        <SaveToBank hotel={trip.stops[saving.si].hotels[saving.hi]} city={trip.stops[saving.si].city} bank={bank}
          onClose={() => setSaving(null)}
          onSaved={(bankId, b, updatedExisting) => {
            setBank(b);
            update((t) => { t.stops[saving.si].hotels[saving.hi].bankId = bankId; });
            setNote({ kind: "ok", text: updatedExisting ? "המלון כבר היה במאגר, ועודכן. לחצי ״שמירה״ לשמירת הטיול." : "המלון נשמר למאגר. לחצי ״שמירה״ לשמירת הטיול." });
            setSaving(null);
          }} />
      )}
    </div>
  );
}
