import { useCallback, useEffect, useState } from "react";
import { api, session } from "../api.js";
import { Link, navigate } from "../router.jsx";
import { Icon, Loading, Notice } from "../ui.jsx";
import CodeScreen from "./CodeScreen.jsx";
import Prepare from "./Prepare.jsx";
import Hotels from "./Hotels.jsx";
import Schedule from "./Schedule.jsx";
import Wallet from "./Wallet.jsx";

const TABS = [
  { key: "", label: "הכנות", icon: "checklist", Page: Prepare },
  { key: "hotels", label: "מלונות", icon: "bed", Page: Hotels },
  { key: "schedule", label: "לו״ז", icon: "calendar", Page: Schedule },
  { key: "wallet", label: "ארנק", icon: "ticket", Page: Wallet },
];

// The agent's "preview as client" opens the app with ?s=<session>.
function takeSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("s");
  if (s) {
    session.set(s);
    window.history.replaceState({}, "", window.location.pathname);
  }
}
takeSessionFromUrl();

export default function ClientApp({ section }) {
  const [hasSession, setHasSession] = useState(!!session.get());
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setError("");
    api("me").then(setTrip).catch((e) => { if (e.status !== 401) setError(e.message); });
  }, []);

  useEffect(() => { if (hasSession) load(); }, [hasSession, load]);

  useEffect(() => {
    const expired = async () => {
      await session.clear();
      setTrip(null);
      setReason("הגישה לטיול התעדכנה. הכניסו את הקוד העדכני.");
      setHasSession(false);
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);

  useEffect(() => { document.title = trip?.title || "הטיול שלכם"; }, [trip?.title]);

  const act = async (path, body) => {
    const next = await api(`me/${path}`, { method: "POST", body });
    setTrip(next);
    return next;
  };

  const leave = async () => {
    if (!window.confirm("לצאת מהטיול במכשיר הזה? כדי לחזור תצטרכו את הקוד.")) return;
    await session.clear();
    setTrip(null);
    setReason("");
    setHasSession(false);
    navigate("/");
  };

  if (!hasSession) return <CodeScreen reason={reason} onEnter={() => { setReason(""); setHasSession(true); }} />;
  if (error && !trip) {
    return (
      <div className="client-shell"><main className="client-main stack">
        <Notice kind="error">{error}</Notice>
        <button type="button" className="btn btn-ghost" onClick={load}>ניסיון נוסף</button>
      </main></div>
    );
  }
  if (!trip) return <div className="client-shell"><Loading /></div>;

  const tab = TABS.find((t) => t.key === section) || TABS[0];
  const agency = trip.agency || {};
  const pendingHotels = trip.stops.length > 0 && !trip.hotelsConfirmedAt;

  return (
    <div className="client-shell">
      <header className="client-top">
        <div className="brand">
          <span className="monogram" aria-hidden="true">{(agency.agencyName || agency.agentName || "ט").trim().charAt(0)}</span>
          <span className="brand-text">
            <span className="muted small">תוכנן על ידי</span>
            <strong>{agency.agencyName || agency.agentName || "הסוכנת שלכם"}</strong>
          </span>
        </div>
        <button type="button" className="icon-btn" aria-label="יציאה מהטיול במכשיר הזה" onClick={leave}>
          <Icon name="logout" size={18} />
        </button>
      </header>
      <main className="client-main">
        <tab.Page trip={trip} act={act} base="" />
      </main>
      <nav className="tabbar" aria-label="אזורי הטיול">
        {TABS.map((t) => {
          const to = `/${t.key}`;
          const on = t === tab;
          return (
            <Link key={t.key} to={to} className={`tab${on ? " on" : ""}`} aria-current={on ? "page" : undefined}>
              <span className="tab-icon">
                <Icon name={t.icon} size={22} />
                {t.key === "hotels" && pendingHotels && <span className="dot" aria-label="ממתין לבחירה" />}
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
