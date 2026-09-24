import { useId, useState } from "react";
import { api } from "../api.js";
import { groupFolders } from "./bank.js";

// Pick a destination folder, or create a new one right here. Calls onChange(folderId, updatedBank).
export default function FolderSelect({ bank, value, onChange, label = "תיקייה במאגר", defaultNewName = "" }) {
  const id = useId();
  const [creating, setCreating] = useState(!bank.folders.length);
  const [name, setName] = useState(defaultNewName);
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const countries = [...new Set(bank.folders.map((f) => f.country).filter(Boolean))];

  const create = async () => {
    setError("");
    try {
      const res = await api("bank/folders", { method: "POST", body: { name, country } });
      onChange(res.folder.id, res.bank);
      setCreating(false);
    } catch (e) {
      setError(e.message);
    }
  };

  if (creating) {
    return (
      <div className="field">
        <span className="label">תיקייה חדשה</span>
        <div className="grid-2">
          <input aria-label="יעד" placeholder="יעד (למשל: סיציליה)" value={name} onChange={(e) => setName(e.target.value)} />
          <input aria-label="מדינה" placeholder="מדינה (למשל: איטליה)" list={`${id}-countries`} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <datalist id={`${id}-countries`}>{countries.map((c) => <option key={c} value={c} />)}</datalist>
        {error && <span className="field-error" role="alert">{error}</span>}
        <div className="row">
          <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={create}>יצירת תיקייה</button>
          {bank.folders.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>בחירת תיקייה קיימת</button>}
        </div>
      </div>
    );
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value || ""} onChange={(e) => (e.target.value === "__new" ? setCreating(true) : onChange(e.target.value, bank))}>
        <option value="" disabled>בחרי תיקייה</option>
        {groupFolders(bank.folders).map(([country, list]) => (
          <optgroup key={country || "none"} label={country || "ללא מדינה"}>
            {list.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </optgroup>
        ))}
        <option value="__new">+ תיקייה חדשה…</option>
      </select>
    </div>
  );
}
