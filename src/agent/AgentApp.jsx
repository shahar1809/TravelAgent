import { useEffect, useState } from "react";
import { api, auth } from "../api.js";
import { Link, navigate } from "../router.jsx";
import { Icon } from "../ui.jsx";
import Login from "./Login.jsx";
import TripList from "./TripList.jsx";
import TripEditor from "./TripEditor.jsx";
import Settings from "./Settings.jsx";
import Bank from "./Bank.jsx";

export default function AgentApp({ path }) {
  const [token, setToken] = useState(auth.get());
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const expired = () => setToken(null);
    window.addEventListener("auth-expired", expired);
    return () => window.removeEventListener("auth-expired", expired);
  }, []);

  useEffect(() => {
    if (token) api("settings").then(setSettings).catch(() => {});
  }, [token]);

  useEffect(() => { document.title = "ניהול טיולים"; }, []);

  if (!token) return <Login onLogin={(t) => { auth.set(t); setToken(t); }} />;

  const parts = path.split("/").filter(Boolean); // ["agent", ...]
  let page;
  if (parts[1] === "trip" && parts[2]) page = <TripEditor key={parts[2]} id={parts[2]} />;
  else if (parts[1] === "settings") page = <Settings settings={settings} onSaved={setSettings} />;
  else if (parts[1] === "bank") page = <Bank />;
  else page = <TripList />;

  const logout = () => { auth.clear(); setToken(null); navigate("/agent"); };
  const section = parts[1] === "settings" ? "settings" : parts[1] === "bank" ? "bank" : "trips";

  return (
    <div className="agent-shell">
      <aside className="side">
        <div className="side-brand">
          <span className="monogram light" aria-hidden="true">{(settings?.agencyName || "ט").charAt(0)}</span>
          <span>{settings?.agencyName || "ניהול טיולים"}</span>
        </div>
        <nav className="side-nav" aria-label="ניהול">
          <Link to="/agent" className={section === "trips" ? "on" : ""} aria-current={section === "trips" ? "page" : undefined}>
            <Icon name="suitcase" size={18} /> טיולים
          </Link>
          <Link to="/agent/bank" className={section === "bank" ? "on" : ""} aria-current={section === "bank" ? "page" : undefined}>
            <Icon name="bed" size={18} /> מאגר מלונות
          </Link>
          <Link to="/agent/settings" className={section === "settings" ? "on" : ""} aria-current={section === "settings" ? "page" : undefined}>
            <Icon name="settings" size={18} /> הגדרות
          </Link>
        </nav>
        <button type="button" className="side-logout" onClick={logout}>
          <Icon name="logout" size={18} /> יציאה
        </button>
      </aside>
      <main className="agent-main">{page}</main>
    </div>
  );
}
