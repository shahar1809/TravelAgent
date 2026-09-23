const AGENT_KEY = "agent_token";
const SESSION_KEY = "trip_session";

export const auth = {
  get: () => localStorage.getItem(AGENT_KEY),
  set: (t) => localStorage.setItem(AGENT_KEY, t),
  clear: () => localStorage.removeItem(AGENT_KEY),
};

// The traveler's signed-in trip on this device.
export const session = {
  get: () => localStorage.getItem(SESSION_KEY),
  set: (s) => localStorage.setItem(SESSION_KEY, s),
  clear: async () => {
    localStorage.removeItem(SESSION_KEY);
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("data-")).map((k) => caches.delete(k)));
    }
  },
};

export async function api(path, { method = "GET", body, file } = {}) {
  const headers = {};
  const isClient = path === "me" || path.startsWith("me/");
  const token = isClient ? session.get() : auth.get();
  if (token && path !== "enter") headers.authorization = `Bearer ${token}`;
  let payload;
  if (file) {
    payload = file;
    headers["content-type"] = file.type || "application/octet-stream";
    headers["x-file-name"] = encodeURIComponent(file.name);
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["content-type"] = "application/json";
  }
  let res;
  try {
    res = await fetch(`/api/${path}`, { method, headers, body: payload });
  } catch {
    throw new Error("אין חיבור לאינטרנט. נסו שוב כשהחיבור יחזור.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (isClient) window.dispatchEvent(new Event("session-expired"));
    else if (path !== "login") { auth.clear(); window.dispatchEvent(new Event("auth-expired")); }
  }
  if (!res.ok) {
    const err = new Error(data.error || "משהו השתבש. נסו שוב.");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Files and the calendar open outside the app, so they carry the session in the URL.
const s = () => encodeURIComponent(session.get() || "");
export const fileUrl = (fileId) => `/api/me/files/${fileId}?s=${s()}`;
export const calendarUrl = () => `/api/me/calendar.ics?s=${s()}`;
export const appUrl = () => window.location.origin;

// Agent: open an uploaded file (needs the agent's auth header, so fetch it first).
export async function openAgentFile(tripId, fileId) {
  const win = window.open("", "_blank");
  try {
    const res = await fetch(`/api/trips/${tripId}/files/${fileId}`, { headers: { authorization: `Bearer ${auth.get()}` } });
    if (!res.ok) throw new Error();
    const url = URL.createObjectURL(await res.blob());
    if (win) win.location.href = url; else window.location.href = url;
  } catch {
    if (win) win.close();
    alert("לא הצלחנו לפתוח את הקובץ.");
  }
}
