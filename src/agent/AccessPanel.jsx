import { useState } from "react";
import { CopyButton, Icon } from "../ui.jsx";
import { inviteText, prettyCode } from "./invite.js";

// Code the client types on first open; changing it signs out every device.
export default function AccessPanel({ trip, action }) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const setNew = async (value) => {
    setError("");
    const ok = await action("code", value ? `לשנות את הקוד ל־${value}? מכשירים שנכנסו עם הקוד הישן יצטרכו להכניס את החדש.` : "ליצור קוד חדש? מכשירים שנכנסו עם הקוד הישן יצטרכו להכניס את החדש.", value ? { code: value } : {});
    if (ok) { setEditing(false); setCode(""); }
  };

  return (
    <section className="panel access stack">
      <div className="row between">
        <h2 className="h3">כניסת הלקוח</h2>
        <CopyButton text={inviteText(trip)} label="העתקת הודעה ללקוח" className="btn btn-primary" />
      </div>
      <div className="access-code">
        <span className="muted small">קוד הטיול</span>
        <span className="display code-big" dir="ltr">{prettyCode(trip.accessCode) || "—"}</span>
      </div>
      <p className="muted small">הלקוח פותח את האפליקציה, מכניס את הקוד פעם אחת, והיא זוכרת אותו. אפשר לשלוח את אותו קוד לכל בני המשפחה.</p>

      {editing ? (
        <form className="row" onSubmit={(e) => { e.preventDefault(); const d = code.replace(/\D/g, ""); if (d.length < 6 || d.length > 8) { setError("הקוד צריך להיות בין 6 ל־8 ספרות"); return; } setNew(d); }}>
          <label className="sr-only" htmlFor="new-code">קוד חדש</label>
          <input id="new-code" className="code-input" inputMode="numeric" dir="ltr" maxLength={10} placeholder="6–8 ספרות"
            value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))} autoFocus />
          <button className="btn btn-primary">שמירת הקוד</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setError(""); }}>ביטול</button>
          {error && <span className="field-error" role="alert">{error}</span>}
        </form>
      ) : (
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>קביעת קוד משלך</button>
          <button type="button" className="btn btn-ghost" onClick={() => setNew("")}><Icon name="refresh" size={16} /> קוד חדש אקראי</button>
          <button type="button" className="btn btn-danger" onClick={() => action("signout", "לנתק את כל המכשירים שנכנסו לטיול? הקוד נשאר אותו קוד, וצריך להכניס אותו מחדש.")}>
            <Icon name="logout" size={16} /> ניתוק כל המכשירים
          </button>
        </div>
      )}
    </section>
  );
}
