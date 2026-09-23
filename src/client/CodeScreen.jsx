import { useEffect, useRef, useState } from "react";
import { api, session } from "../api.js";
import { Notice } from "../ui.jsx";

export default function CodeScreen({ onEnter, reason }) {
  const [code, setCode] = useState("");
  const [agency, setAgency] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    api("public").then(setAgency).catch(() => {});
    input.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { session: s } = await api("enter", { method: "POST", body: { code } });
      session.set(s);
      onEnter();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const name = agency?.agencyName || agency?.agentName || "";
  const digits = code.replace(/\D/g, "");

  return (
    <div className="gate">
      <div className="gate-top">
        <svg className="gate-art" viewBox="0 0 346 110" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="280" cy="30" r="18" />
          <path d="M96 94 q26 -34 52 0M160 96 q14 -18 28 0M200 96 q10 -26 20 -8 q5 -8 10 8" />
          <path d="M0 106 q12 -5 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
        </svg>
        {name && <span className="gate-agency">{name}</span>}
        <h1 className="display gate-title">הטיול שלכם</h1>
      </div>
      <form className="gate-form" onSubmit={submit}>
        <label htmlFor="trip-code" className="gate-label">קוד הטיול</label>
        <input id="trip-code" ref={input} className="gate-input" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9 -]*" maxLength={10} dir="ltr" value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d -]/g, ""))} aria-describedby="code-help" />
        <p id="code-help" className="muted small">הקוד נמצא בהודעה שקיבלתם מהסוכנת. מכניסים אותו פעם אחת, והאפליקציה זוכרת אותו.</p>
        {reason && !error && <Notice kind="info">{reason}</Notice>}
        {error && <Notice kind="error">{error}</Notice>}
        <button className="btn btn-primary btn-block btn-lg" disabled={busy || digits.length < 6}>
          {busy ? "בודקים…" : "כניסה לטיול"}
        </button>
      </form>
    </div>
  );
}
