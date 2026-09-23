import { useEffect, useRef } from "react";
import { Icon } from "../ui.jsx";

// Modal grid of the hotel's photos; picking one calls onPick(url).
export default function PhotoPicker({ photos, title, onPick, onClose, taken = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} className="picker" onClose={onClose} onCancel={onClose}>
      <div className="picker-head">
        <h3 className="h3">{title}</h3>
        <button type="button" className="icon-btn" aria-label="סגירה" onClick={onClose}><Icon name="plus" style={{ transform: "rotate(45deg)" }} /></button>
      </div>
      {photos.length === 0 ? (
        <p className="muted">אין תמונות מהייבוא. אפשר להדביק קישור לתמונה במקום.</p>
      ) : (
        <div className="picker-grid">
          {photos.map((u) => (
            <button key={u} type="button" className={`picker-item${taken.includes(u) ? " taken" : ""}`} onClick={() => onPick(u)}>
              <img src={u} alt="" loading="lazy" referrerPolicy="no-referrer" />
              {taken.includes(u) && <span className="picker-badge"><Icon name="check" size={14} stroke={2.4} /></span>}
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}
