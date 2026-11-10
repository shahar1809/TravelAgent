import { useEffect, useRef, useState } from "react";
import { fileUrl } from "../api.js";
import { Icon } from "../ui.jsx";

// Draws every PDF page into the container (pdf.js is loaded only when a PDF is opened).
async function renderPdf(data, container, isCancelled) {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const pdf = await pdfjs.getDocument({ data }).promise;
  const width = container.clientWidth - 16;
  const ratio = Math.min(window.devicePixelRatio || 1, 2) * 1.5; // sharp enough to zoom in
  for (let n = 1; n <= pdf.numPages; n++) {
    if (isCancelled()) return;
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * ratio });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${width}px`;
    canvas.setAttribute("aria-label", `עמוד ${n} מתוך ${pdf.numPages}`);
    canvas.setAttribute("role", "img");
    container.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  }
}

// Full-screen voucher viewer that stays inside the app. Close with X, Escape or the phone's back button.
export default function DocViewer({ voucher, onClose }) {
  const dialog = useRef(null);
  const pages = useRef(null);
  const [state, setState] = useState({ status: "loading" });

  // Phone back button closes the viewer instead of leaving the app.
  useEffect(() => {
    window.history.pushState({ docViewer: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    dialog.current?.showModal();
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const close = () => window.history.back();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(fileUrl(voucher.fileId));
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        const type = blob.type || voucher.fileType || "";
        const file = new File([blob], voucher.fileName || "voucher", { type });
        if (cancelled) return;
        if (type.startsWith("image/")) {
          setState({ status: "image", file, url: URL.createObjectURL(blob) });
        } else {
          setState({ status: "pdf", file });
          await renderPdf(await blob.arrayBuffer(), pages.current, () => cancelled);
          if (!cancelled) setState((s) => ({ ...s, rendered: true }));
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, [voucher.fileId]);

  useEffect(() => () => { if (state.url) URL.revokeObjectURL(state.url); }, [state.url]);

  const share = async () => {
    const { file } = state;
    if (!file) return;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: voucher.title });
        return;
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
    const url = URL.createObjectURL(file);
    const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <dialog ref={dialog} className="docview" aria-label={voucher.title || "שובר"} onCancel={(e) => { e.preventDefault(); close(); }}>
      <div className="docview-top">
        <button type="button" className="docview-close" onClick={close}>
          <Icon name="back" size={20} /> חזרה
        </button>
        <span className="docview-title" dir="auto">{voucher.title}</span>
        {state.file && (
          <button type="button" className="docview-share" onClick={share} aria-label="שיתוף או שמירה">
            <Icon name="upload" size={20} />
          </button>
        )}
      </div>
      <div className="docview-body">
        {state.status === "loading" && <p className="docview-msg">טוען…</p>}
        {state.status === "error" && <p className="docview-msg">לא הצלחנו לפתוח את השובר. בדקו את החיבור ונסו שוב.</p>}
        {state.status === "image" && <img src={state.url} alt={voucher.title || "שובר"} />}
        <div ref={pages} className="docview-pages" dir="ltr" hidden={state.status !== "pdf"} />
        {state.status === "pdf" && !state.rendered && <p className="docview-msg">טוען…</p>}
      </div>
    </dialog>
  );
}
