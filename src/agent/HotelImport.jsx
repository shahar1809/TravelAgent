import { useEffect, useId, useRef, useState } from "react";
import { api } from "../api.js";
import { Icon, Notice } from "../ui.jsx";

const PREFIX = "SHELLY-IMPORT:";

// Runs in her browser on the Booking page: keeps the useful parts of the page and copies them.
const BOOKMARKLET = `javascript:(()=>{const d=document.documentElement.cloneNode(true);d.querySelectorAll('style,svg,noscript,iframe,link').forEach(e=>e.remove());d.querySelectorAll('script').forEach(s=>{const t=s.textContent||'';if(s.type!=='application/ld+json'&&!/hotelPhotos|associated_rooms|hotel_class|room_name|roomName/.test(t))s.remove();});const p='${PREFIX}'+JSON.stringify({u:location.href,h:d.outerHTML});navigator.clipboard.writeText(p).then(()=>alert('הדף הועתק. חזרי לאפליקציה והדביקי באזור ההדבקה.'),()=>alert('ההעתקה נכשלה. נסי שוב.'));})()`;

// Paste a hotel link (or a page copied with the bookmarklet) and fill the hotel. Never touches the price note.
export default function HotelImport({ onImported }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const link = useRef(null);
  const inputId = useId();

  useEffect(() => { link.current?.setAttribute("href", BOOKMARKLET); }, [showBrowser]);

  const finish = async (res) => {
    onImported(res.hotel);
    if (!res.ai) {
      setMsg({ kind: "ok", text: "הפרטים מולאו. סמני אילו סוגי חדרים יוצגו ללקוח, ובדקי את הטקסט." });
      return;
    }
    setBusy("polish");
    setMsg({ kind: "info", text: "הפרטים מולאו. מנסחת תיאור ותגיות בעברית…" });
    try {
      const polished = await api("import/polish", { method: "POST", body: { snapshot: res.snapshot } });
      if (polished.polished) onImported(polished.hotel);
      setMsg({ kind: "ok", text: polished.polished ? "הפרטים מולאו בעברית. סמני אילו סוגי חדרים יוצגו ללקוח." : "הפרטים מולאו (בלי תרגום). בדקי את הטקסט." });
    } catch {
      setMsg({ kind: "ok", text: "הפרטים מולאו (בלי תרגום). בדקי את הטקסט." });
    } finally {
      setBusy("");
    }
  };

  const fromUrl = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy("fetch");
    setMsg(null);
    try {
      await finish(await api("import/url", { method: "POST", body: { url } }));
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
      if (err.data?.blocked) setShowBrowser(true);
    } finally {
      setBusy((b) => (b === "fetch" ? "" : b));
    }
  };

  const onPaste = async (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!text.startsWith(PREFIX)) {
      setMsg({ kind: "error", text: "זה לא הדף שהועתק בסימנייה. פתחי את דף המלון ב־Booking, לחצי על הסימנייה, ואז הדביקי כאן." });
      return;
    }
    setBusy("fetch");
    setMsg(null);
    try {
      const { u, h } = JSON.parse(text.slice(PREFIX.length));
      await finish(await api("import/html", { method: "POST", body: { html: h, url: u } }));
      setShowBrowser(false);
    } catch (err) {
      setMsg({ kind: "error", text: err.message || "ההדבקה נכשלה" });
    } finally {
      setBusy((b) => (b === "fetch" ? "" : b));
    }
  };

  return (
    <div className="importer">
      <form className="import-row" onSubmit={fromUrl}>
        <label className="sr-only" htmlFor={inputId}>קישור למלון</label>
        <input id={inputId} type="url" dir="ltr" placeholder="הדביקי קישור מ־Booking" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!!busy} />
        <button className="btn btn-primary" disabled={!!busy || !url.trim()}>{busy === "fetch" ? "מייבאת…" : "מילוי אוטומטי"}</button>
      </form>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button type="button" className="text-link small" onClick={() => setShowBrowser((v) => !v)}>
        {showBrowser ? "הסתרה" : "הקישור לא עובד? ייבוא מהדפדפן"}
      </button>
      {showBrowser && (
        <div className="browser-import stack">
          <ol className="steps">
            <li>פעם אחת בלבד: גררי את הכפתור הזה לסרגל הסימניות בדפדפן. <a ref={link} className="bookmarklet" onClick={(e) => e.preventDefault()}><Icon name="copy" size={14} /> העתקה ל־Shelly Tours</a></li>
            <li>פתחי את דף המלון ב־Booking ולחצי על הסימנייה.</li>
            <li>חזרי לכאן והדביקי (⌘V) בתיבה:</li>
          </ol>
          <div className="paste-zone" contentEditable suppressContentEditableWarning onPaste={onPaste} onKeyDown={(e) => { if (!(e.metaKey || e.ctrlKey)) e.preventDefault(); }}
            role="textbox" aria-label="אזור הדבקה" tabIndex={0}>
            {busy === "fetch" ? "מייבאת…" : "הדביקי כאן"}
          </div>
        </div>
      )}
    </div>
  );
}
