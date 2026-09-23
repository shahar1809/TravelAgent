import { dayMonth, eachDay, weekday } from "../dates.js";
import { newId } from "../trip.js";
import { ITEM_KINDS, Icon } from "../ui.jsx";

const KIND_OPTIONS = Object.entries(ITEM_KINDS).map(([k, v]) => [k, v.label]);

function ItemRow({ item, onChange, onRemove }) {
  const set = (k) => (e) => onChange({ ...item, [k]: e.target.value });
  return (
    <div className="item-row">
      <input aria-label="שעה" type="time" value={item.time} onChange={set("time")} />
      <input aria-label="עד שעה" type="time" value={item.endTime} onChange={set("endTime")} />
      <select aria-label="סוג" value={item.kind} onChange={set("kind")}>
        {KIND_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input aria-label="כותרת" placeholder="מה קורה" value={item.title} onChange={set("title")} />
      <input aria-label="מקום" placeholder="איפה" value={item.place} onChange={set("place")} />
      <input aria-label="הערה" placeholder="הערה ללקוח" value={item.note} onChange={set("note")} />
      <input aria-label="קישור לניווט" placeholder="קישור למפה" dir="ltr" value={item.mapUrl} onChange={set("mapUrl")} />
      <input aria-label="תאריך" type="date" value={item.date} onChange={set("date")} />
      <button type="button" className="icon-btn danger" aria-label={`מחיקת ${item.title || "פריט"}`} onClick={onRemove}><Icon name="trash" size={18} /></button>
    </div>
  );
}

export default function EditSchedule({ trip, update }) {
  const days = eachDay(trip.startDate, trip.endDate);
  const orphan = trip.items.filter((i) => !days.includes(i.date));
  const idx = (id) => trip.items.findIndex((i) => i.id === id);
  const add = (date) => update((t) => {
    t.items.push({ id: newId(), date, time: "", endTime: "", kind: "activity", title: "", place: "", note: "", mapUrl: "" });
  });
  const change = (id) => (next) => update((t) => { t.items[idx(id)] = next; });
  const remove = (id) => () => update((t) => { t.items.splice(idx(id), 1); });

  if (!days.length) return <p className="muted">קודם צריך לקבוע תאריכי יציאה וחזרה בלשונית ״פרטים״.</p>;

  const sorted = (list) => [...list].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return (
    <div className="stack-lg">
      <p className="muted">טיסות, צ׳ק־אין וצ׳ק־אאוט נוספים אוטומטית מלשוניות ״טיסות״ ו״מלונות״. כאן מוסיפים את כל השאר.</p>
      <div className="item-legend" aria-hidden="true">
        <span>שעה</span><span>עד</span><span>סוג</span><span>כותרת</span><span>מקום</span><span>הערה</span><span>מפה</span><span>תאריך</span><span />
      </div>
      {days.map((d, i) => {
        const list = sorted(trip.items.filter((it) => it.date === d));
        return (
          <section key={d} className="day-edit">
            <div className="row between">
              <h3 className="h3">יום {i + 1} · {weekday(d)}, {dayMonth(d)}</h3>
              <button type="button" className="btn btn-ghost" onClick={() => add(d)}><Icon name="plus" size={16} /> הוספה</button>
            </div>
            {list.length === 0 && <p className="muted small">אין פריטים ביום הזה.</p>}
            {list.map((it) => <ItemRow key={it.id} item={it} onChange={change(it.id)} onRemove={remove(it.id)} />)}
          </section>
        );
      })}
      {orphan.length > 0 && (
        <section className="day-edit">
          <h3 className="h3">מחוץ לתאריכי הטיול</h3>
          <p className="muted small">הלקוח לא רואה את אלה. שני להם תאריך בתוך הטיול.</p>
          {orphan.map((it) => <ItemRow key={it.id} item={it} onChange={change(it.id)} onRemove={remove(it.id)} />)}
        </section>
      )}
    </div>
  );
}
