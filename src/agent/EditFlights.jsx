import { dayMonth } from "../dates.js";
import { AIRPORTS, LEGS, layover } from "../flights.js";
import { newId } from "../trip.js";
import { Icon, Notice } from "../ui.jsx";
import { Area, Field, Select } from "./fields.jsx";

const CABINS = [["תיירים", "תיירים"], ["פרימיום", "פרימיום"], ["עסקים", "עסקים"], ["ראשונה", "ראשונה"]];

function move(list, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
}

const emptySeg = (leg, prev = {}) => ({
  id: newId(), leg, airline: prev.airline || "", flightNumber: "",
  from: prev.to || "", fromCity: prev.toCity || "", fromTerminal: "",
  departDate: prev.arriveDate || "", departTime: "",
  to: "", toCity: "", toTerminal: "", arriveDate: prev.arriveDate || "", arriveTime: "",
});

function newOption(trip) {
  return {
    id: newId(), title: "", cabin: "תיירים", baggage: "", fareNote: "", priceNote: "", note: "",
    segments: [
      { ...emptySeg("out"), from: "TLV", fromCity: AIRPORTS.TLV, departDate: trip.startDate || "", arriveDate: trip.startDate || "" },
      { ...emptySeg("back"), to: "TLV", toCity: AIRPORTS.TLV, departDate: trip.endDate || "", arriveDate: trip.endDate || "" },
    ],
  };
}

// One flight leg: direction, flight, from, to.
function SegmentEditor({ s, onChange, onRemove, prev }) {
  const set = (patch) => onChange({ ...s, ...patch });
  const code = (side) => (e) => {
    const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
    const cityKey = side === "from" ? "fromCity" : "toCity";
    const auto = AIRPORTS[v];
    const wasAuto = !s[cityKey] || s[cityKey] === AIRPORTS[s[side]];
    set({ [side]: v, ...(auto && wasAuto ? { [cityKey]: auto } : {}) });
  };
  const lay = prev && (prev.leg || "") === (s.leg || "") ? layover(prev, s) : "";
  return (
    <div className="seg-edit">
      {lay && <div className="layover small">המתנה ב{prev.toCity || prev.to}: {lay}</div>}
      <div className="seg-grid">
        <label className="mini"><span>כיוון</span>
          <select value={s.leg} onChange={(e) => set({ leg: e.target.value })}>
            <option value="out">הלוך</option><option value="back">חזור</option><option value="">אחר</option>
          </select>
        </label>
        <label className="mini wide"><span>חברת תעופה</span><input dir="auto" value={s.airline} onChange={(e) => set({ airline: e.target.value })} /></label>
        <label className="mini"><span>מספר טיסה</span><input dir="ltr" value={s.flightNumber} placeholder="LY 381" onChange={(e) => set({ flightNumber: e.target.value.toUpperCase() })} /></label>
        <button type="button" className="icon-btn danger small-btn" aria-label="מחיקת הטיסה" onClick={onRemove}><Icon name="trash" size={16} /></button>

        <span className="seg-side">המראה</span>
        <label className="mini"><span>שדה</span><input dir="ltr" className="code" value={s.from} placeholder="TLV" onChange={code("from")} /></label>
        <label className="mini"><span>עיר</span><input dir="auto" value={s.fromCity} onChange={(e) => set({ fromCity: e.target.value })} /></label>
        <label className="mini"><span>טרמינל</span><input dir="ltr" value={s.fromTerminal} onChange={(e) => set({ fromTerminal: e.target.value })} /></label>
        <label className="mini"><span>תאריך</span><input type="date" value={s.departDate} onChange={(e) => set({ departDate: e.target.value, ...(!s.arriveDate || s.arriveDate < e.target.value ? { arriveDate: e.target.value } : {}) })} /></label>
        <label className="mini"><span>שעה</span><input type="time" value={s.departTime} onChange={(e) => set({ departTime: e.target.value })} /></label>

        <span className="seg-side">נחיתה</span>
        <label className="mini"><span>שדה</span><input dir="ltr" className="code" value={s.to} placeholder="CTA" onChange={code("to")} /></label>
        <label className="mini"><span>עיר</span><input dir="auto" value={s.toCity} onChange={(e) => set({ toCity: e.target.value })} /></label>
        <label className="mini"><span>טרמינל</span><input dir="ltr" value={s.toTerminal} onChange={(e) => set({ toTerminal: e.target.value })} /></label>
        <label className="mini"><span>תאריך</span><input type="date" value={s.arriveDate} onChange={(e) => set({ arriveDate: e.target.value })} /></label>
        <label className="mini"><span>שעה</span><input type="time" value={s.arriveTime} onChange={(e) => set({ arriveTime: e.target.value })} /></label>
      </div>
    </div>
  );
}

export default function EditFlights({ trip, update, saved, action }) {
  const groups = trip.flightGroups || [];
  const confirmed = saved?.flightsConfirmedAt;
  const chosen = Object.fromEntries((saved?.flightGroups || []).map((g) => [g.id, g.chosenId]));
  const upd = (fn) => update((t) => { t.flightGroups = t.flightGroups || []; fn(t.flightGroups); });

  return (
    <div className="stack-lg">
      {confirmed ? (
        <Notice kind="ok">
          הלקוח אישר את הטיסות ב־{dayMonth(confirmed.slice(0, 10))}.{" "}
          <button type="button" className="text-link" onClick={() => action("unlock-flights", "לפתוח את בחירת הטיסות מחדש? הלקוח יוכל לשנות ולאשר שוב.")}>פתיחה מחדש לשינויים</button>
        </Notice>
      ) : (
        <p className="muted">בכל בחירה אפשר להציע כמה אפשרויות, והלקוח בוחר אחת. הטיסה שנבחרה (או ההמלצה שלך, עד שיבחרו) נכנסת אוטומטית ללו״ז וליומן.</p>
      )}

      {groups.map((g, gi) => (
        <section key={g.id} className="panel stack">
          <div className="panel-head">
            <Icon name="plane" />
            <strong className="panel-title">{g.title || "בחירת טיסה"}</strong>
            <span className="muted small">{(g.options || []).length} אפשרויות</span>
            <div className="row end grow">
              <button type="button" className="icon-btn" aria-label="להזיז למעלה" disabled={gi === 0} onClick={() => upd((fg) => move(fg, gi, -1))}><Icon name="up" /></button>
              <button type="button" className="icon-btn" aria-label="להזיז למטה" disabled={gi === groups.length - 1} onClick={() => upd((fg) => move(fg, gi, 1))}><Icon name="down" /></button>
              <button type="button" className="icon-btn danger" aria-label="מחיקת בחירת הטיסה" onClick={() => { if (window.confirm(`למחוק את ״${g.title || "בחירת טיסה"}״ על כל האפשרויות שבה?`)) upd((fg) => fg.splice(gi, 1)); }}><Icon name="trash" /></button>
            </div>
          </div>
          <div className="grid-2">
            <Field label="כותרת" hint="למשל: הלוך ושוב, טיסה פנימית" value={g.title} onChange={(v) => upd((fg) => { fg[gi].title = v; })} />
            <Field label="הערה ללקוח" value={g.note} onChange={(v) => upd((fg) => { fg[gi].note = v; })} />
          </div>

          {(g.options || []).map((o, oi) => {
            const setO = (fn) => upd((fg) => fn(fg[gi].options[oi]));
            return (
              <div key={o.id} className={`flight-editor${g.pickId === o.id ? " is-pick" : ""}`}>
                <div className="row between">
                  <label className="radio-line">
                    <input type="radio" name={`fpick-${g.id}`} checked={g.pickId === o.id} onChange={() => upd((fg) => { fg[gi].pickId = o.id; })} />
                    ההמלצה שלי
                  </label>
                  <div className="row">
                    {chosen[g.id] === o.id && <span className="chip chip-ok">הלקוח בחר</span>}
                    <button type="button" className="btn btn-ghost" onClick={() => upd((fg) => {
                      const copy = structuredClone(o);
                      copy.id = newId();
                      copy.title = copy.title ? `${copy.title} (עותק)` : "";
                      copy.segments.forEach((x) => { x.id = newId(); });
                      fg[gi].options.splice(oi + 1, 0, copy);
                    })}><Icon name="copy" size={16} /> שכפול</button>
                    <button type="button" className="icon-btn danger" aria-label={`מחיקת ${o.title || "האפשרות"}`} onClick={() => upd((fg) => {
                      fg[gi].options.splice(oi, 1);
                      if (fg[gi].pickId === o.id) fg[gi].pickId = fg[gi].options[0]?.id || "";
                    })}><Icon name="trash" size={18} /></button>
                  </div>
                </div>
                <div className="grid-3">
                  <Field label="שם האפשרות" hint="למשל: ישירה עם אל על" value={o.title} onChange={(v) => setO((x) => { x.title = v; })} />
                  <Select label="מחלקה" value={o.cabin || "תיירים"} options={CABINS} onChange={(v) => setO((x) => { x.cabin = v; })} />
                  <Field label="הערת מחיר" hint="למשל: הכי זול" value={o.priceNote} onChange={(v) => setO((x) => { x.priceNote = v; })} />
                </div>
                <div className="grid-2">
                  <Field label="כבודה" hint="מה כלול לכל נוסע" value={o.baggage} onChange={(v) => setO((x) => { x.baggage = v; })} />
                  <Field label="שינויים וביטולים" value={o.fareNote} onChange={(v) => setO((x) => { x.fareNote = v; })} />
                </div>
                <Area label="הערה" rows={2} value={o.note} onChange={(v) => setO((x) => { x.note = v; })} />

                <div className="stack">
                  {o.segments.map((s, si) => (
                    <SegmentEditor key={s.id} s={s} prev={o.segments[si - 1]}
                      onChange={(next) => setO((x) => { x.segments[si] = next; })}
                      onRemove={() => setO((x) => { x.segments.splice(si, 1); })} />
                  ))}
                  <div className="row">
                    {["out", "back"].map((leg) => (
                      <button key={leg} type="button" className="btn btn-ghost" onClick={() => setO((x) => {
                        const same = x.segments.filter((z) => z.leg === leg);
                        const seg = emptySeg(leg, same[same.length - 1]);
                        const at = x.segments.map((z) => z.leg).lastIndexOf(leg);
                        if (leg === "out" && at < 0) x.segments.unshift(seg); else x.segments.splice(at < 0 ? x.segments.length : at + 1, 0, seg);
                      })}><Icon name="plus" size={16} /> טיסה ב{LEGS[leg]}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {(g.options || []).length < 6 && (
            <button type="button" className="hotel-add" onClick={() => upd((fg) => {
              const o = newOption(trip);
              fg[gi].options = [...(fg[gi].options || []), o];
              if (!fg[gi].pickId) fg[gi].pickId = o.id;
            })}><Icon name="plus" /> הוספת אפשרות טיסה</button>
          )}
        </section>
      ))}

      <button type="button" className="btn btn-ghost" onClick={() => upd((fg) => {
        const o = newOption(trip);
        fg.push({ id: newId(), title: fg.length ? "" : "הלוך ושוב", note: "", pickId: o.id, options: [o] });
      })}><Icon name="plus" size={16} /> {groups.length ? "הוספת בחירת טיסה נוספת" : "הוספת טיסות"}</button>
    </div>
  );
}
