import { useState } from "react";
import { api, openAgentFile } from "../api.js";
import { newId } from "../trip.js";
import { Icon, VOUCHER_KINDS } from "../ui.jsx";
import { Field, Select } from "./fields.jsx";

const KIND_OPTIONS = Object.entries(VOUCHER_KINDS).map(([k, v]) => [k, v.label]);

export default function EditWallet({ trip, update, id, setMsg }) {
  const [uploading, setUploading] = useState("");

  const upload = async (vi, file) => {
    if (!file) return;
    const vid = trip.vouchers[vi].id;
    setUploading(vid);
    try {
      const res = await api(`trips/${id}/files`, { method: "POST", file });
      update((t) => {
        const v = t.vouchers.find((x) => x.id === vid);
        if (v) Object.assign(v, res);
      });
      setMsg({ kind: "ok", text: "הקובץ הועלה. לחצי ״שמירה״ כדי שהלקוח יראה אותו." });
    } catch (e) {
      setMsg({ kind: "error", text: e.message });
    } finally {
      setUploading("");
    }
  };

  return (
    <div className="stack-lg">
      <p className="muted">כרטיסי טיסה, אישורי מלון, מעבורות וביטוח. אפשר לצרף PDF או תמונה עד 10MB.</p>
      {trip.vouchers.map((v, vi) => (
        <section key={v.id} className="panel stack">
          <div className="grid-3">
            <Select label="סוג" value={v.kind} options={KIND_OPTIONS} onChange={(val) => update((t) => { t.vouchers[vi].kind = val; })} />
            <Field label="כותרת" value={v.title} onChange={(val) => update((t) => { t.vouchers[vi].title = val; })} />
            <Field label="מתי" hint="למשל: 12 ביוני · 06:10" value={v.when} onChange={(val) => update((t) => { t.vouchers[vi].when = val; })} />
          </div>
          <div className="grid-3">
            <Field label="אסמכתא" dir="ltr" value={v.ref} onChange={(val) => update((t) => { t.vouchers[vi].ref = val; })} />
            <Field label="עבור" value={v.who} onChange={(val) => update((t) => { t.vouchers[vi].who = val; })} />
            <div className="field">
              <span className="label">קובץ</span>
              {v.fileId ? (
                <div className="row">
                  <button type="button" className="text-link" onClick={() => openAgentFile(id, v.fileId)}><Icon name="file" size={16} /> {v.fileName || "קובץ"}</button>
                  <button type="button" className="text-link danger" onClick={() => update((t) => { Object.assign(t.vouchers[vi], { fileId: "", fileName: "", fileType: "" }); })}>הסרה</button>
                </div>
              ) : (
                <label className="upload">
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => upload(vi, e.target.files[0])} disabled={uploading === v.id} />
                  <Icon name="upload" size={16} /> {uploading === v.id ? "מעלה…" : "העלאת קובץ"}
                </label>
              )}
            </div>
          </div>
          <div className="row end">
            <button type="button" className="btn btn-danger" onClick={() => update((t) => { t.vouchers.splice(vi, 1); })}><Icon name="trash" size={16} /> מחיקת השובר</button>
          </div>
        </section>
      ))}
      <div>
        <button type="button" className="btn btn-ghost" onClick={() => update((t) => {
          t.vouchers.push({ id: newId(), kind: "flight", title: "", when: "", ref: "", who: "", fileId: "", fileName: "", fileType: "" });
        })}><Icon name="plus" size={16} /> הוספת שובר</button>
      </div>
    </div>
  );
}
