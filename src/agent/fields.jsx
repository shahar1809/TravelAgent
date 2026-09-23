import { useEffect, useId, useState } from "react";

export function Field({ label, hint, value, onChange, type = "text", ...rest }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} dir="auto" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Area({ label, hint, value, onChange, rows = 3, ...rest }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={rows} dir="auto" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

// Comma-separated tags, committed on blur so multi-word tags can be typed.
export function TagsField({ label, value, onChange }) {
  const id = useId();
  const [text, setText] = useState(value.join(", "));
  useEffect(() => setText(value.join(", ")), [value.join("|")]);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={text} onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text.split(",").map((t) => t.trim()).filter(Boolean))} />
      <span className="hint">מופרד בפסיקים</span>
    </div>
  );
}
