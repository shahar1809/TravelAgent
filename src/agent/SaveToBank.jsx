import { useState } from "react";
import { api } from "../api.js";
import { Notice } from "../ui.jsx";
import Dialog from "./Dialog.jsx";
import FolderSelect from "./FolderSelect.jsx";
import { suggestFolder } from "./bank.js";
import { Field } from "./fields.jsx";

// Saves a trip hotel into the bank (folder + location). onSaved(bankId, bank).
export default function SaveToBank({ hotel, city, bank, onSaved, onClose }) {
  const [folderId, setFolderId] = useState(suggestFolder(bank, city));
  const [currentBank, setCurrentBank] = useState(bank);
  const [place, setPlace] = useState(city || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api("bank/hotels", { method: "POST", body: { hotel, folderId, city: place } });
      onSaved(res.hotel.id, res.bank, res.updatedExisting);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title={`הוספה למאגר: ${hotel.name || "מלון"}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
        <button type="button" className="btn btn-primary" disabled={!folderId || busy} onClick={save}>{busy ? "שומרת…" : "שמירה למאגר"}</button>
      </>}>
      <div className="stack">
        <FolderSelect bank={currentBank} value={folderId} defaultNewName={city}
          onChange={(fid, b) => { setFolderId(fid); if (b) setCurrentBank(b); }} />
        <Field label="מיקום" hint="העיר או האזור של המלון. עוזר למצוא אותו לפי העצירה." value={place} onChange={setPlace} />
        <p className="muted small">נשמרים הפרטים, התמונות וסוגי החדרים. הערת המחיר לא נשמרת. אם המלון כבר במאגר (אותו דף ב־Booking), הוא יתעדכן במקום להיכפל.</p>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}
