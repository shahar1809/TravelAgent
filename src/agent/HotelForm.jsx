import HotelImport from "./HotelImport.jsx";
import HotelMedia from "./HotelMedia.jsx";
import { Area, Field, Select, TagsField } from "./fields.jsx";

export const HOTEL_COLORS = ["#2E5A5C", "#C8923A", "#6B7248", "#B5502F", "#6E9A9B", "#8E5A2E"];

export const emptyHotel = (id, color = HOTEL_COLORS[0]) => ({
  id, name: "", stars: 4, description: "", tags: [], priceNote: "", link: "", imageUrl: "", address: "",
  images: [], rooms: [], photoPool: [], color, bankId: "",
});

// All hotel fields, shared by the trip editor and the hotel bank. set(fn) mutates a copy of the hotel.
export default function HotelForm({ hotel: h, set, showPrice = true }) {
  return (
    <>
      <HotelImport onImported={(imp) => set((x) => {
        const keep = { id: x.id, priceNote: x.priceNote, color: x.color, bankId: x.bankId };
        Object.assign(x, imp, keep);
      })} />
      <Field label="שם המלון" value={h.name} onChange={(v) => set((x) => { x.name = v; })} />
      <div className="grid-2">
        <Select label="כוכבים" value={String(h.stars)} onChange={(v) => set((x) => { x.stars = Number(v); })}
          options={[["0", "ללא"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]} />
        {showPrice
          ? <Field label="הערת מחיר" hint="למשל: הכי משתלם" value={h.priceNote} onChange={(v) => set((x) => { x.priceNote = v; })} />
          : <Field label="כתובת" value={h.address} onChange={(v) => set((x) => { x.address = v; })} />}
      </div>
      <Area label="תיאור" rows={3} value={h.description} onChange={(v) => set((x) => { x.description = v; })} />
      <TagsField label="תגיות" value={h.tags || []} onChange={(v) => set((x) => { x.tags = v; })} />
      <Field label="קישור למלון" hint="מתמלא בייבוא. הלקוח רואה ״לאתר המלון״" type="url" dir="ltr" value={h.link} onChange={(v) => set((x) => { x.link = v; })} />
      {showPrice && <Field label="כתובת" value={h.address} onChange={(v) => set((x) => { x.address = v; })} />}
      <HotelMedia hotel={h} set={(fn) => set((x) => { x.images = x.images || []; x.rooms = x.rooms || []; fn(x); })} />
      <div className="swatches" role="radiogroup" aria-label="צבע">
        {HOTEL_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={h.color === c} aria-label={c}
            className={`swatch${h.color === c ? " on" : ""}`} style={{ background: c }}
            onClick={() => set((x) => { x.color = c; })} />
        ))}
      </div>
    </>
  );
}
