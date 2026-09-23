import { useEffect } from "react";
import { fileUrl } from "../api.js";
import { CopyButton, Icon, VOUCHER_KINDS } from "../ui.jsx";

export default function Wallet({ trip }) {
  const vouchers = trip.vouchers;

  // Open every attached document once so it stays available offline.
  useEffect(() => {
    if (!navigator.onLine) return;
    vouchers.filter((v) => v.fileId).forEach((v) => fetch(fileUrl(v.fileId)).catch(() => {}));
  }, [vouchers]);

  return (
    <div className="stack-lg">
      <div className="stack-sm">
        <h1 className="display h1">ארנק</h1>
        <p className="muted">כל מה שיבקשו מכם בדלפק. מה שנפתח כאן פעם אחת נשמר גם בלי אינטרנט.</p>
      </div>

      {vouchers.length === 0 && <p className="muted">עוד אין שוברים. אחרי שההזמנות יסגרו, אעלה אותם לכאן.</p>}

      <ul className="tickets">
        {vouchers.map((v) => {
          const kind = VOUCHER_KINDS[v.kind] || VOUCHER_KINDS.other;
          return (
            <li key={v.id} className={`ticket kind-${v.kind}`}>
              <div className="ticket-top">
                <span className="ticket-kind"><Icon name={kind.icon} size={16} /> {kind.label}</span>
                <span className="display ticket-title" dir="auto">{v.title}</span>
                {v.when && <span className="muted small">{v.when}</span>}
              </div>
              <div className="ticket-cut" aria-hidden="true" />
              <div className="ticket-bottom">
                {v.ref && (
                  <div className="ticket-field">
                    <span className="muted small">אסמכתא</span>
                    <span className="mono ref">{v.ref}</span>
                  </div>
                )}
                {v.who && (
                  <div className="ticket-field">
                    <span className="muted small">עבור</span>
                    <span>{v.who}</span>
                  </div>
                )}
                <div className="ticket-actions">
                  {v.ref && <CopyButton text={v.ref} label="העתקת אסמכתא" />}
                  {v.fileId && (
                    <a className="btn btn-primary" href={fileUrl(v.fileId)} target="_blank" rel="noreferrer">
                      <Icon name="file" size={16} /> פתיחת השובר
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
