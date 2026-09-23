// Keeps the trip, the app and opened vouchers available without internet.
const SHELL = "shell-v2";
const DATA = "data-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

function networkFirst(request, cacheName, fallbackKey) {
  return fetch(request)
    .then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(cacheName).then((c) => {
          c.put(request, copy.clone());
          if (fallbackKey) c.put(fallbackKey, copy);
        });
      }
      return res;
    })
    .catch(async () => (await caches.match(request)) || (fallbackKey ? caches.match(fallbackKey) : Response.error()));
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(async (c) => {
    const hit = await c.match(request);
    if (hit) return hit;
    const res = await fetch(request);
    if (res.ok) c.put(request, res.clone());
    return res;
  });
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname === "/api/me" || url.pathname.startsWith("/api/me/")) {
    if (url.pathname.includes("/files/")) return e.respondWith(cacheFirst(e.request, DATA));
    if (url.pathname.endsWith(".ics")) return;
    return e.respondWith(networkFirst(e.request, DATA));
  }
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.mode === "navigate") return e.respondWith(networkFirst(e.request, SHELL, "/index.html"));
  e.respondWith(networkFirst(e.request, SHELL));
});
