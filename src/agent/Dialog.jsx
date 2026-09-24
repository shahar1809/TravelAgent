import { useEffect, useRef } from "react";
import { Icon } from "../ui.jsx";

// Modal wrapper: Escape and the X close it; focus stays inside while open.
export default function Dialog({ title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} className={`dlg${wide ? " wide" : ""}`} onClose={onClose} onCancel={onClose} aria-label={title}>
      <div className="dlg-head">
        <h2 className="h3">{title}</h2>
        <button type="button" className="icon-btn" aria-label="סגירה" onClick={onClose}><Icon name="plus" style={{ transform: "rotate(45deg)" }} /></button>
      </div>
      <div className="dlg-body">{children}</div>
      {footer && <div className="dlg-foot">{footer}</div>}
    </dialog>
  );
}
