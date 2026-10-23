/* =========================================================
   Service worker: makes the app work offline and installable.
   VERSION is stamped by scripts/build.py on every build, so phones
   fetch the new app files after each release.
   ========================================================= */
const VERSION = "d87976a6b9";
const SHELL = `axom-shell-${VERSION}`;
const RUNTIME = "axom-runtime";
const OFFLINE = "axom-offline";   // lessons the learner downloaded (see app/common.js)
const SHELL_FILES = [
  "./", "index.html", "lesson.html", "manifest.webmanifest",
  "app/app.css", "app/config.js", "app/common.js", "app/engine.js", "app/home.js",
  "icons/icon-192.png", "icons/icon-512.png",
  "content/manifest.json", "content/courses/ahom-kings.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("axom-shell-") && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true })) || Response.error();
  }
}
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") (await caches.open(RUNTIME)).put(req, res.clone());
  return res;
}
async function staleWhileRevalidate(req) {
  const hit = await caches.match(req);
  const fresh = fetch(req).then(async (res) => { if (res.ok || res.type === "opaque") (await caches.open(RUNTIME)).put(req, res.clone()); return res; }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("googleapis.com") && !url.hostname.startsWith("fonts.")) return;   // Firebase APIs: always live
  if (url.hostname.startsWith("fonts.")) return e.respondWith(staleWhileRevalidate(req));
  if (req.destination === "image" || url.pathname.includes("/content/media/")) return e.respondWith(cacheFirst(req));
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate" || url.pathname.endsWith(".json") || url.pathname.endsWith(".html")) return e.respondWith(networkFirst(req));
  e.respondWith(staleWhileRevalidate(req));
});
