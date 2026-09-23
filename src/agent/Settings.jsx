import { useEffect, useState } from "react";
import { api } from "../api.js";
import { Notice } from "../ui.jsx";
import { Field } from "./fields.jsx";

export default function Settings({ settings, onSaved }) {
  const [form, setForm] = useState({ agencyName: "", agentName: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const s = await api("settings", { method: "PUT", body: form });
      onSaved(s);
      setMsg({ kind: "ok", text: "ההגדרות נשמרו." });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    }
  };

  return (
    <form className="page narrow stack-lg" onSubmit={save}>
      <h1 className="display h1">הגדרות</h1>
      <p className="muted">השמות האלה מופיעים ללקוחות בראש האפליקציה וליד ההמלצות שלך.</p>
      <Field label="שם הסוכנות" value={form.agencyName} onChange={(v) => setForm({ ...form, agencyName: v })} />
      <Field label="השם שלך" hint="מופיע ב״ההמלצה של…״" value={form.agentName} onChange={(v) => setForm({ ...form, agentName: v })} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div><button className="btn btn-primary">שמירת הגדרות</button></div>
    </form>
  );
}
