import { useMemo, useState } from "react";
import { api } from "../api.js";
import { Icon, Loading, Notice, Stars } from "../ui.jsx";
import Dialog from "./Dialog.jsx";
import FolderSelect from "./FolderSelect.jsx";
import HotelForm, { emptyHotel } from "./HotelForm.jsx";
import { byUse, groupFolders, useBank } from "./bank.js";
import { Field } from "./fields.jsx";

function FolderDialog({ folder, bank, onDone, onClose }) {
  const [name, setName] = useState(folder?.name || "");
  const [country, setCountry] = useState(folder?.country || "");
  const [error, setError] = useState("");
  const countries = [...new Set(bank.folders.map((f) => f.country).filter(Boolean))];
  const save = async () => {
    setError("");
    try {
      const res = folder
        ? await api(`bank/folders/${folder.id}`, { method: "PUT", body: { name, country } })
        : (await api("bank/folders", { method: "POST", body: { name, country } })).bank;
      onDone(res);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Dialog title={folder ? "עריכת תיקייה" : "תיקייה חדשה"} onClose={onClose}
      footer={<><button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button><button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={save}>שמירה</button></>}>
      <div className="stack">
        <Field label="יעד" hint="למשל: סיציליה, כרתים, קו סמוי" value={name} onChange={setName} />
        <Field label="מדינה" hint="התיקיות מקובצות לפי מדינה" value={country} onChange={setCountry} list="bank-countries" />
        <datalist id="bank-countries">{countries.map((c) => <option key={c} value={c} />)}</datalist>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}

// Add or edit one bank hotel: same form as in trips, plus folder and location.
function HotelDialog({ bank, entry, defaultFolder, onDone, onClose }) {
  const [hotel, setHotel] = useState(entry?.hotel || emptyHotel("new"));
  const [folderId, setFolderId] = useState(entry?.meta.folderId || defaultFolder || "");
  const [city, setCity] = useState(entry?.meta.city || "");
  const [currentBank, setCurrentBank] = useState(bank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (fn) => setHotel((h) => { const n = structuredClone(h); fn(n); return n; });

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = entry
        ? await api(`bank/hotels/${entry.meta.id}`, { method: "PUT", body: { hotel, folderId, city } })
        : await api("bank/hotels", { method: "POST", body: { hotel, folderId, city } });
      onDone(res.bank, res.updatedExisting);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm(`למחוק את ״${hotel.name}״ מהמאגר? טיולים שכבר כוללים אותו לא ישתנו.`)) return;
    try {
      onDone(await api(`bank/hotels/${entry.meta.id}`, { method: "DELETE" }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Dialog title={entry ? hotel.name || "מלון" : "מלון חדש במאגר"} onClose={onClose} wide
      footer={<>
        {entry && <button type="button" className="btn btn-danger" onClick={remove}><Icon name="trash" size={16} /> מחיקה מהמאגר</button>}
        <span className="grow" />
        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
        <button type="button" className="btn btn-primary" disabled={busy || !folderId || !hotel.name} onClick={save}>{busy ? "שומרת…" : "שמירה"}</button>
      </>}>
      <div className="stack">
        <div className="grid-2">
          <FolderSelect bank={currentBank} value={folderId} onChange={(fid, b) => { setFolderId(fid); if (b) setCurrentBank(b); }} />
          <Field label="מיקום" hint="עיר או אזור, למשל טאורמינה" value={city} onChange={setCity} />
        </div>
        <div className="bank-form"><HotelForm hotel={hotel} set={set} showPrice={false} /></div>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}

export default function Bank() {
  const { bank, setBank, error } = useBank();
  const [folder, setFolder] = useState("all");
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState(null); // {type:'folder'|'hotel', ...}
  const [msg, setMsg] = useState(null);

  const list = useMemo(() => {
    if (!bank) return [];
    const term = q.trim();
    return bank.hotels
      .filter((h) => folder === "all" || h.folderId === folder)
      .filter((h) => !term || h.name.includes(term) || (h.city || "").includes(term) || (bank.folders.find((f) => f.id === h.folderId)?.name || "").includes(term))
      .sort(byUse);
  }, [bank, folder, q]);

  if (!bank) return <div className="page">{error ? <Notice kind="error">{error}</Notice> : <Loading />}</div>;
  const current = bank.folders.find((f) => f.id === folder);
  const count = (fid) => bank.hotels.filter((h) => h.folderId === fid).length;

  const openHotel = async (meta) => {
    try {
      const full = await api(`bank/hotels/${meta.id}`);
      setDialog({ type: "hotel", entry: { hotel: full, meta } });
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    }
  };
  const done = (b, text) => { setBank(b); setDialog(null); if (text) setMsg({ kind: "ok", text }); };

  return (
    <div className="page stack-lg">
      <div className="page-head">
        <div className="stack-sm">
          <h1 className="display h1">מאגר מלונות</h1>
          <span className="muted">המלונות שאת ממליצה עליהם שוב ושוב, מסודרים לפי יעד.</span>
        </div>
        <div className="row">
          <input type="search" className="search" aria-label="חיפוש במאגר" placeholder="חיפוש מלון או יעד" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" className="btn btn-ghost" onClick={() => setDialog({ type: "folder" })}><Icon name="plus" size={16} /> תיקייה חדשה</button>
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ type: "hotel" })}><Icon name="plus" size={16} /> הוספת מלון</button>
        </div>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="bank-layout">
        <nav className="bank-folders" aria-label="תיקיות">
          <button type="button" className={`fold${folder === "all" ? " on" : ""}`} aria-current={folder === "all"} onClick={() => setFolder("all")}>
            <span>כל המלונות</span><span className="muted small">{bank.hotels.length}</span>
          </button>
          {groupFolders(bank.folders).map(([country, fl]) => (
            <div key={country || "none"} className="fold-group">
              <span className="fold-country">{country || "ללא מדינה"}</span>
              {fl.map((f) => (
                <button key={f.id} type="button" className={`fold${folder === f.id ? " on" : ""}`} aria-current={folder === f.id} onClick={() => setFolder(f.id)}>
                  <span>{f.name}</span><span className="muted small">{count(f.id)}</span>
                </button>
              ))}
            </div>
          ))}
          {!bank.folders.length && <p className="muted small">צרי תיקייה לכל יעד, למשל ״סיציליה״ תחת ״איטליה״.</p>}
        </nav>

        <section className="stack">
          <div className="row between">
            <h2 className="h3">{current ? current.name : "כל המלונות"} <span className="muted small">{list.length === 1 ? "מלון אחד" : `${list.length} מלונות`} · לפי כמה פעמים נבחרו</span></h2>
            {current && (
              <div className="row">
                <button type="button" className="text-link small" onClick={() => setDialog({ type: "folder", folder: current })}>עריכת תיקייה</button>
                <button type="button" className="text-link small danger" onClick={async () => {
                  if (!window.confirm(`למחוק את התיקייה ״${current.name}״?`)) return;
                  try { setBank(await api(`bank/folders/${current.id}`, { method: "DELETE" })); setFolder("all"); } catch (e) { setMsg({ kind: "error", text: e.message }); }
                }}>מחיקה</button>
              </div>
            )}
          </div>
          <div className="bank-grid">
            {list.map((h) => (
              <button key={h.id} type="button" className="bank-card" onClick={() => openHotel(h)}>
                <span className="bank-cover" style={{ background: h.color || "#2E5A5C" }}>{h.cover && <img src={h.cover} alt="" referrerPolicy="no-referrer" loading="lazy" />}</span>
                <span className="bank-card-body">
                  <span className="bank-name" dir="auto">{h.name}</span>
                  <Stars n={h.stars} />
                  <span className="muted small">{[h.city, h.chosenCount ? `נבחר ${h.chosenCount === 1 ? "פעם אחת" : `${h.chosenCount} פעמים`}` : "עוד לא נבחר"].filter(Boolean).join(" · ")}</span>
                  <span className="tags">{h.tags.map((t) => <span key={t} className="tag" dir="auto">{t}</span>)}{h.roomsCount > 0 && <span className="tag">{h.roomsCount} סוגי חדרים</span>}</span>
                </span>
              </button>
            ))}
            <button type="button" className="bank-card add" onClick={() => setDialog({ type: "hotel" })}>
              <Icon name="plus" size={22} />
              <span>הוספת מלון</span>
              <span className="muted small">הדבקה מ־Booking או ידנית</span>
            </button>
          </div>
        </section>
      </div>

      {dialog?.type === "folder" && (
        <FolderDialog bank={bank} folder={dialog.folder} onClose={() => setDialog(null)} onDone={(b) => done(b, dialog.folder ? "התיקייה עודכנה." : "התיקייה נוצרה.")} />
      )}
      {dialog?.type === "hotel" && (
        <HotelDialog bank={bank} entry={dialog.entry} defaultFolder={folder === "all" ? "" : folder} onClose={() => setDialog(null)}
          onDone={(b, updatedExisting) => done(b, dialog.entry ? "נשמר." : updatedExisting ? "המלון כבר היה במאגר, ועודכן." : "המלון נוסף למאגר.")} />
      )}
    </div>
  );
}
