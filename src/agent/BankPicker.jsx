import { useMemo, useState } from "react";
import { api } from "../api.js";
import { Icon, Notice, Stars } from "../ui.jsx";
import Dialog from "./Dialog.jsx";
import { byUse, groupFolders, suggestFolder } from "./bank.js";

// Pick bank hotels for one stop. onAdd(fullHotels).
export default function BankPicker({ bank, stop, onAdd, onClose }) {
  const [folderId, setFolderId] = useState(suggestFolder(bank, stop.city) || "all");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inStop = new Set(stop.hotels.map((h) => h.bankId).filter(Boolean));
  const room = 6 - stop.hotels.length;
  const city = (stop.city || "").trim();

  const list = useMemo(() => {
    const term = q.trim();
    return bank.hotels
      .filter((h) => folderId === "all" || h.folderId === folderId)
      .filter((h) => !term || h.name.includes(term) || (h.city || "").includes(term))
      .sort((a, b) => (Number((b.city || "") === city) - Number((a.city || "") === city)) || byUse(a, b));
  }, [bank, folderId, q, city]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < room ? [...p, id] : p));

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      onAdd(await api("bank/hotels/full", { method: "POST", body: { ids: picked } }));
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title={`מהמאגר ל${stop.city || "עצירה"}`} onClose={onClose} wide
      footer={<>
        <span className="muted small grow">{room <= 0 ? "בעצירה כבר יש 6 מלונות." : city ? `מלונות מ${city} מופיעים ראשונים` : ""}</span>
        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
        <button type="button" className="btn btn-primary" disabled={!picked.length || busy} onClick={add}>
          {busy ? "מוסיפה…" : picked.length ? `הוספת ${picked.length === 1 ? "מלון אחד" : `${picked.length} מלונות`}` : "הוספה"}
        </button>
      </>}>
      <div className="picker-bar">
        <select aria-label="תיקייה" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
          <option value="all">כל התיקיות</option>
          {groupFolders(bank.folders).map(([country, fl]) => (
            <optgroup key={country || "none"} label={country || "ללא מדינה"}>
              {fl.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </optgroup>
          ))}
        </select>
        <input type="search" aria-label="חיפוש מלון" placeholder="חיפוש מלון או מיקום" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {list.length === 0 ? (
        <p className="muted empty-pick">{bank.hotels.length ? "אין מלונות שמתאימים." : "המאגר עוד ריק. שמרי מלונות מטיולים או הוסיפי אותם בדף ״מאגר מלונות״."}</p>
      ) : (
        <ul className="bank-list">
          {list.map((h) => {
            const already = inStop.has(h.id);
            const on = picked.includes(h.id);
            return (
              <li key={h.id}>
                <label className={`bank-row${on ? " on" : ""}${already ? " off" : ""}`}>
                  <span className="bank-thumb" style={{ background: h.color || "#2E5A5C" }}>{h.cover && <img src={h.cover} alt="" referrerPolicy="no-referrer" loading="lazy" />}</span>
                  <span className="bank-info">
                    <span className="bank-name" dir="auto">{h.name}</span>
                    <span className="muted small">
                      <Stars n={h.stars} /> {[h.city, h.chosenCount ? `נבחר ${h.chosenCount === 1 ? "פעם אחת" : `${h.chosenCount} פעמים`}` : "", already ? "כבר בעצירה הזו" : ""].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <input type="checkbox" checked={on || already} disabled={already || (!on && picked.length >= room)} onChange={() => toggle(h.id)} />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
