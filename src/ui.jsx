import { useEffect, useState } from "react";

const PATHS = {
  back: <path d="m9 18 6-6-6-6" />,
  forward: <path d="m15 18-6-6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12 5 5L20 7" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  map: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></>,
  ticket: <><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 2.5" /></>,
  bed: <><path d="M3 18V7" /><path d="M3 14h18v4" /><path d="M21 14v-3a3 3 0 0 0-3-3h-7v6" /><circle cx="7" cy="11" r="2" /></>,
  checklist: <><path d="m4 7 2 2 4-4" /><path d="M13 7h7" /><path d="m4 16 2 2 4-4" /><path d="M13 16h7" /></>,
  suitcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></>,
  file: <><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></>,
  upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
  logout: <><path d="M10 4H5v16h5" /><path d="m14 8-4 4 4 4" /><path d="M10 12h10" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  plane: <path d="M10 13 3 11l1-2 7 1 5-6a2 2 0 0 1 3 3l-6 5 1 7-2 1-2-7-4 3v2l-2 1-1-3-3-1 1-2h2z" />,
  ship: <><path d="M3 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0" /><path d="M5 14 4 10h16l-1 4" /><path d="M12 10V4M8 7h8" /></>,
  car: <><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v2H3z" /><circle cx="7.5" cy="13" r="1" /><circle cx="16.5" cy="13" r="1" /></>,
  pin: <><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />,
  meal: <><path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" /><path d="M16 21V3c2 1 3 4 3 7h-3" /></>,
};

export function Icon({ name, size = 20, stroke = 1.7, fill = "none", ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export const ITEM_KINDS = {
  flight: { label: "טיסה", icon: "plane" },
  ferry: { label: "מעבורת", icon: "ship" },
  transfer: { label: "העברה", icon: "car" },
  activity: { label: "פעילות", icon: "pin" },
  meal: { label: "ארוחה", icon: "meal" },
  tip: { label: "טיפ", icon: "spark" },
  other: { label: "אחר", icon: "calendar" },
};

export const VOUCHER_KINDS = {
  flight: { label: "טיסה", icon: "plane" },
  hotel: { label: "מלון", icon: "bed" },
  ferry: { label: "מעבורת", icon: "ship" },
  activity: { label: "פעילות", icon: "pin" },
  transfer: { label: "העברה", icon: "car" },
  insurance: { label: "ביטוח", icon: "shield" },
  other: { label: "מסמך", icon: "file" },
};

export function Stars({ n }) {
  if (!n) return null;
  return (
    <span className="stars" aria-label={`${n} כוכבים`}>
      {Array.from({ length: n }, (_, i) => <Icon key={i} name="star" size={12} fill="currentColor" stroke={1} />)}
    </span>
  );
}

// Small "Copied" feedback after copying text.
export function CopyButton({ text, label = "העתקה", done = "הועתק", className = "btn btn-ghost" }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button type="button" className={className} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setCopied(true); } catch { window.prompt("העתיקו:", text); }
    }}>
      <Icon name={copied ? "check" : "copy"} size={16} />
      <span>{copied ? done : label}</span>
    </button>
  );
}

export function Notice({ kind = "info", children }) {
  return <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

export function Loading({ label = "טוען…" }) {
  return <div className="loading" role="status">{label}</div>;
}
