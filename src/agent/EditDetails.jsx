import { Area, Field } from "./fields.jsx";
import AccessPanel from "./AccessPanel.jsx";

export default function EditDetails({ trip, update, action }) {
  return (
    <div className="stack-lg narrow">
      <AccessPanel trip={trip} action={action} />
      <Field label="שם הטיול" value={trip.title} onChange={(v) => update((t) => { t.title = v; })} />
      <div className="grid-2">
        <Field label="לקוח" value={trip.clientName} onChange={(v) => update((t) => { t.clientName = v; })} />
        <Field label="נוסעים" hint="למשל: 2 מבוגרים, 2 ילדים" value={trip.travelers} onChange={(v) => update((t) => { t.travelers = v; })} />
      </div>
      <div className="grid-2">
        <Field label="יציאה" type="date" value={trip.startDate} onChange={(v) => update((t) => { t.startDate = v; })} />
        <Field label="חזרה" type="date" value={trip.endDate} onChange={(v) => update((t) => { t.endDate = v; })} />
      </div>
      <Area label="הודעה ללקוח" hint="מופיעה במסך הראשי של הלקוח" rows={4} value={trip.intro} onChange={(v) => update((t) => { t.intro = v; })} />
      <Area label="הערות פנימיות" hint="רק את רואה את זה" rows={4} value={trip.agentNotes} onChange={(v) => update((t) => { t.agentNotes = v; })} />
    </div>
  );
}
