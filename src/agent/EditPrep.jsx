import { newId } from "../trip.js";
import { Icon } from "../ui.jsx";

export default function EditPrep({ trip, update, saved }) {
  const done = saved?.done || {};
  return (
    <div className="stack-lg">
      <section className="stack">
        <h2 className="h3">רשימת משימות ללקוח</h2>
        <p className="muted small">הלקוח מסמן ״בוצע״ בעצמו. את רואה כאן מה סומן.</p>
        {trip.checklist.map((c, i) => (
          <div key={c.id} className="check-edit">
            <span className={`chip ${done[c.id] ? "chip-ok" : "chip-muted"}`}>{done[c.id] ? "בוצע" : "פתוח"}</span>
            <input aria-label="משימה" placeholder="משימה" value={c.title} onChange={(e) => update((t) => { t.checklist[i].title = e.target.value; })} />
            <input aria-label="פירוט" placeholder="פירוט" value={c.note} onChange={(e) => update((t) => { t.checklist[i].note = e.target.value; })} />
            <input aria-label="עד תאריך" type="date" value={c.due} onChange={(e) => update((t) => { t.checklist[i].due = e.target.value; })} />
            <button type="button" className="icon-btn danger" aria-label={`מחיקת ${c.title || "משימה"}`} onClick={() => update((t) => { t.checklist.splice(i, 1); })}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <div><button type="button" className="btn btn-ghost" onClick={() => update((t) => { t.checklist.push({ id: newId(), title: "", note: "", due: "" }); })}><Icon name="plus" size={16} /> הוספת משימה</button></div>
      </section>

      <section className="stack">
        <h2 className="h3">טוב לדעת</h2>
        <p className="muted small">כרטיסים קצרים: מזג אוויר, כסף, שקעים, מספרי חירום.</p>
        {trip.goodToKnow.map((g, i) => (
          <div key={g.id} className="check-edit">
            <input aria-label="נושא" placeholder="נושא" value={g.title} onChange={(e) => update((t) => { t.goodToKnow[i].title = e.target.value; })} />
            <input aria-label="ערך" placeholder="ערך קצר" value={g.value} onChange={(e) => update((t) => { t.goodToKnow[i].value = e.target.value; })} />
            <input aria-label="הסבר" placeholder="הסבר" value={g.note} onChange={(e) => update((t) => { t.goodToKnow[i].note = e.target.value; })} />
            <button type="button" className="icon-btn danger" aria-label={`מחיקת ${g.title || "כרטיס"}`} onClick={() => update((t) => { t.goodToKnow.splice(i, 1); })}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        <div><button type="button" className="btn btn-ghost" onClick={() => update((t) => { t.goodToKnow.push({ id: newId(), title: "", value: "", note: "" }); })}><Icon name="plus" size={16} /> הוספת כרטיס</button></div>
      </section>
    </div>
  );
}
