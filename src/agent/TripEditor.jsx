import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { range } from "../dates.js";
import { Link, navigate } from "../router.jsx";
import { CopyButton, Icon, Loading, Notice } from "../ui.jsx";
import EditDetails from "./EditDetails.jsx";
import EditHotels from "./EditHotels.jsx";
import EditSchedule from "./EditSchedule.jsx";
import EditPrep from "./EditPrep.jsx";
import EditWallet from "./EditWallet.jsx";
import { inviteText } from "./invite.js";

const TABS = [
  ["details", "פרטים", EditDetails],
  ["hotels", "מלונות", EditHotels],
  ["schedule", "לו״ז", EditSchedule],
  ["prep", "הכנות", EditPrep],
  ["wallet", "ארנק", EditWallet],
];

export default function TripEditor({ id }) {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState("details");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api(`trips/${id}`)
      .then((t) => { setSaved(t); setDraft(t); })
      .catch((e) => setMsg({ kind: "error", text: e.message }));
  }, [id]);
  useEffect(load, [load]);

  const dirty = saved && draft && JSON.stringify(saved) !== JSON.stringify(draft);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Edit a copy of the draft in place: update((t) => { t.title = "…" })
  const update = (fn) => setDraft((d) => { const n = structuredClone(d); fn(n); return n; });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const t = await api(`trips/${id}`, { method: "PUT", body: draft });
      setSaved(t);
      setDraft(t);
      setMsg({ kind: "ok", text: "השינויים נשמרו. הלקוח רואה אותם עכשיו." });
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  // Server actions that change access or locks; returns true on success.
  const action = async (path, confirmText, body) => {
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(true);
    setMsg(null);
    try {
      const t = await api(`trips/${id}/${path}`, { method: "POST", body: body ?? {} });
      const keep = { accessCode: t.accessCode, accessVersion: t.accessVersion, hotelsConfirmedAt: t.hotelsConfirmedAt };
      setSaved((s) => ({ ...s, ...keep }));
      setDraft((d) => ({ ...d, ...keep }));
      if (path === "code") setMsg({ kind: "ok", text: "הקוד עודכן. שלחי ללקוח את ההודעה החדשה." });
      if (path === "signout") setMsg({ kind: "ok", text: "כל המכשירים נותקו. בכניסה הבאה יתבקשו להכניס את הקוד." });
      return true;
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const preview = async () => {
    const win = window.open("", "_blank");
    try {
      const { session } = await api(`trips/${id}/preview`, { method: "POST" });
      if (win) win.location.href = `/?s=${encodeURIComponent(session)}`;
    } catch (e) {
      if (win) win.close();
      setMsg({ kind: "error", text: e.message });
    }
  };

  const remove = async () => {
    if (!window.confirm("למחוק את הטיול לגמרי? הלקוח יאבד גישה, והשוברים שהועלו יימחקו.")) return;
    try {
      await api(`trips/${id}`, { method: "DELETE" });
      navigate("/agent");
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    }
  };

  if (!draft) return <div className="page">{msg ? <Notice kind="error">{msg.text}</Notice> : <Loading />}</div>;

  const Section = TABS.find((t) => t[0] === tab)[2];

  return (
    <div className="page stack-lg">
      <div className="page-head">
        <div className="stack-sm">
          <Link to="/agent" className="text-link small"><Icon name="back" size={14} /> כל הטיולים</Link>
          <h1 className="display h1">{draft.title || "ללא שם"}</h1>
          <span className="muted">{[draft.clientName, range(draft.startDate, draft.endDate)].filter(Boolean).join(", ")}</span>
        </div>
        <div className="row">
          <CopyButton text={inviteText(draft)} label="העתקת הודעה ללקוח" />
          <button type="button" className="btn btn-ghost" onClick={preview}><Icon name="eye" size={16} /> תצוגת לקוח</button>
          <button type="button" className="btn btn-ghost" disabled={dirty || busy} onClick={load} title="לטעון בחירות חדשות של הלקוח">
            <Icon name="refresh" size={16} /> רענון
          </button>
        </div>
      </div>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="tabs" role="tablist" aria-label="חלקי הטיול">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <Section trip={draft} update={update} saved={saved} action={action} id={id} setMsg={setMsg} />

      <div className="danger-zone end">
        <button type="button" className="btn btn-danger" onClick={remove}><Icon name="trash" size={16} /> מחיקת הטיול</button>
      </div>

      <div className={`savebar${dirty ? " show" : ""}`} aria-hidden={!dirty}>
        <span>יש שינויים שלא נשמרו</span>
        <div className="row">
          <button type="button" className="btn btn-ghost light" onClick={() => setDraft(saved)} disabled={busy || !dirty}>ביטול</button>
          <button type="button" className="btn btn-light" onClick={save} disabled={busy || !dirty}>{busy ? "שומרת…" : "שמירה"}</button>
        </div>
      </div>
    </div>
  );
}
