import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui.jsx";

// Tracks which photo in a scroll-snap strip is showing, and scrolls to a given one (RTL-safe).
function useStrip(count, start = 0) {
  const ref = useRef(null);
  const [index, setIndex] = useState(start);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const imgs = [...el.querySelectorAll("[data-slide]")];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setIndex(Number(e.target.dataset.slide)); }),
      { root: el, threshold: 0.6 },
    );
    imgs.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [count]);
  const go = (i, smooth = true) => {
    const target = ref.current?.querySelector(`[data-slide="${Math.max(0, Math.min(count - 1, i))}"]`);
    target?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "start", block: "nearest" });
  };
  return { ref, index, go };
}

function Arrows({ index, count, go, label }) {
  if (count < 2) return null;
  return (
    <>
      <button type="button" className="ph-arrow prev" aria-label={`${label} הקודמת`} disabled={index === 0}
        onClick={(e) => { e.stopPropagation(); go(index - 1); }}><Icon name="back" size={20} stroke={2.2} /></button>
      <button type="button" className="ph-arrow next" aria-label={`${label} הבאה`} disabled={index === count - 1}
        onClick={(e) => { e.stopPropagation(); go(index + 1); }}><Icon name="forward" size={20} stroke={2.2} /></button>
    </>
  );
}

// Full-screen viewer: swipe, arrows, keyboard, Escape to close.
export function Lightbox({ images, start = 0, title, onClose }) {
  const dialog = useRef(null);
  const { ref, index, go } = useStrip(images.length, start);

  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    requestAnimationFrame(() => go(start, false));
    return () => d?.close();
  }, []);

  const onKey = (e) => {
    if (e.key === "ArrowLeft") go(index + 1); // RTL: left is "next"
    if (e.key === "ArrowRight") go(index - 1);
  };

  return (
    <dialog ref={dialog} className="lightbox" aria-label={title ? `תמונות: ${title}` : "תמונות"} onClose={onClose} onCancel={onClose} onKeyDown={onKey}>
      <div className="lb-top">
        <span className="lb-count" dir="ltr">{index + 1} / {images.length}</span>
        {title && <span className="lb-title" dir="auto">{title}</span>}
        <button type="button" className="lb-close" aria-label="סגירה" onClick={onClose}><Icon name="plus" size={22} style={{ transform: "rotate(45deg)" }} /></button>
      </div>
      <div className="lb-strip" ref={ref}>
        {images.map((u, i) => (
          <div key={u} className="lb-slide" data-slide={i}>
            <img src={u} alt={`תמונה ${i + 1} מתוך ${images.length}`} referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
      <Arrows index={index} count={images.length} go={go} label="התמונה" />
    </dialog>
  );
}

// Photo strip on the hotel card: swipe or arrows; tap opens the full-screen viewer.
export function Gallery({ images, title }) {
  const { ref, index, go } = useStrip(images.length);
  const [open, setOpen] = useState(null);
  if (!images.length) return null;
  return (
    <div className="gallery-wrap">
      <div className="gallery" ref={ref}>
        {images.map((u, i) => (
          <button key={u} type="button" className="gallery-slide" data-slide={i}
            aria-label={`פתיחת תמונה ${i + 1} מתוך ${images.length} במסך מלא`}
            onClick={(e) => { e.stopPropagation(); setOpen(i); }}>
            <img src={u} alt="" loading={i === 0 ? "eager" : "lazy"} referrerPolicy="no-referrer" />
          </button>
        ))}
      </div>
      <Arrows index={index} count={images.length} go={go} label="התמונה" />
      {images.length > 1 && (
        <div className="dots" aria-hidden="true">
          {images.map((u, i) => <span key={u} className={i === index ? "on" : ""} />)}
        </div>
      )}
      <span className="gallery-count"><Icon name="eye" size={13} /> {images.length > 1 ? <bdi dir="ltr">{index + 1}/{images.length}</bdi> : "הגדלה"}</span>
      {open !== null && <Lightbox images={images} start={open} title={title} onClose={() => setOpen(null)} />}
    </div>
  );
}

// Small room photos that open the viewer.
export function Thumbs({ images, title }) {
  const [open, setOpen] = useState(null);
  if (!images.length) return null;
  return (
    <div className="room-imgs">
      {images.map((u, i) => (
        <button key={u} type="button" className="thumb-open" aria-label={`פתיחת תמונה ${i + 1} של ${title}`} onClick={() => setOpen(i)}>
          <img src={u} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </button>
      ))}
      {open !== null && <Lightbox images={images} start={open} title={title} onClose={() => setOpen(null)} />}
    </div>
  );
}
