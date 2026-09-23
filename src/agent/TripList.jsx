import { useEffect, useState } from "react";
import { api } from "../api.js";
import { inviteText, prettyCode } from "./invite.js";
import { range, todayIso } from "../dates.js";
import { Link, navigate } from "../router.jsx";
import { CopyButton, Icon, Loading, Notice } from "../ui.jsx";

function status(t) {
  const today = todayIso();
  if (t.startDate && t.endDate && today >= t.startDate && today <= t.endDate) return { text: "בטיול עכשיו", kind: "sea" };
  if (t.endDate && today > t.endDate) return { text: "הסתיים", kind: "muted" };
  if (!t.stopsCount) return { text: "אין עצירות עדיין", kind: "muted" };
  if (t.hotelsConfirmedAt) return { text: "המלונות אושרו", kind: "ok" };
  if (t.chosenCount) return { text: `נבחרו ${t.chosenCount} מתוך ${t.stopsCount}`, kind: "clay" };
  return { text: "ממתין לבחירת מלונות", kind: "clay" };
}

export default function TripList() {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api("trips").then(setTrips).catch((e) => setError(e.message));
  }, []);

  const create = async (template) => {
    setBusy(template);
    try {
      const t = await api("trips", { method: "POST", body: { template } });
      navigate(`/agent/trip/${t.id}`);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  };

  return (
    <div className="page stack-lg">
      <div className="page-head">
        <h1 className="display h1">טיולים</h1>
        <div className="row">
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => create("sample")}>טיול לדוגמה</button>
          <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => create("blank")}>
            <Icon name="plus" size={16} /> טיול חדש
          </button>
        </div>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {!trips && !error && <Loading />}
      {trips && trips.length === 0 && (
        <div className="empty">
          <p>עוד אין טיולים. צרי טיול חדש, או התחילי מטיול לדוגמה עם ארבע עצירות ושלושה מלונות בכל אחת.</p>
        </div>
      )}
      {trips && trips.length > 0 && (
        <table className="trips">
          <thead>
            <tr><th>טיול</th><th>לקוח</th><th>תאריכים</th><th>קוד</th><th>מלונות</th><th><span className="sr-only">פעולות</span></th></tr>
          </thead>
          <tbody>
            {trips.map((t) => {
              const s = status(t);
              return (
                <tr key={t.id}>
                  <td><Link to={`/agent/trip/${t.id}`} className="trip-link">{t.title || "ללא שם"}</Link></td>
                  <td>{t.clientName}</td>
                  <td className="nowrap">{range(t.startDate, t.endDate)}</td>
                  <td className="mono nowrap" dir="ltr">{prettyCode(t.accessCode)}</td>
                  <td><span className={`chip chip-${s.kind}`}>{s.text}</span></td>
                  <td className="row end">
                    <CopyButton text={inviteText(t)} label="הודעה ללקוח" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
