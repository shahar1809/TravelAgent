import { useState } from "react";
import { api } from "../api.js";
import { Notice } from "../ui.jsx";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api("login", { method: "POST", body: { password } });
      onLogin(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <h1 className="display h1">כניסה לניהול</h1>
        <div className="field">
          <label htmlFor="pw">סיסמה</label>
          <input id="pw" type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required autoFocus />
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "נכנסת…" : "כניסה"}</button>
      </form>
    </div>
  );
}
