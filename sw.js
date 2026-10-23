/* =========================================================
   Service worker: makes the app work offline and installable.
   VERSION is stamped by scripts/build.py on every build, so phones
   fetch the new app files after each release.
   ========================================================= */
const VERSION = "912cfcd1a2";
const SHELL = `axom-shell-${VERSION}`;
const RUNTIME = "axom-runtime";
const OFFLINE = "axom-offline";   // lessons the learner downloaded (see app/common.js)
const SHELL_FILES = [
  "./", "index.html", "lesson.html", "manifest.webmanifest",
  "app/app.css", "app/config.js", "app/common.js", "app/engine.js", "app/home.js",
  "icons/icon-192.png", "icons/icon-512.png",
  "content/manifest.json", "content/courses/ahom-kings.json",
  "content/entities.json", "content/maps/assam.json", "content/questions/ahom.json",
];

// Hosts like Cloudflare Pages redirect "lesson.html" to "/lesson". Browsers refuse to use a
// saved redirected response for a page, so store a clean copy instead.
const clean = (res) => (res.redirected ? new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers }) : res);

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(SHELL_FILES.map(async (f) => {
      const res = await fetch(new Request(f, { cache: "reload" }));
      if (!res.ok) throw new Error(`${f}: ${res.status}`);
      await c.put(f, clean(res));
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (e) => {
  // New version: drop old app files and the runtime copies (lessons saved for offline live in OFFLINE and are kept).
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => (k.startsWith("axom-shell-") && k !== SHELL) || k === RUNTIME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function fromCache(req) {
  const url = new URL(req.url);
  const alt = url.pathname.endsWith("/") ? "index.html" : url.pathname.endsWith(".html") ? null : `${url.pathname}.html`;   // "/lesson" → "lesson.html"
  return (await caches.match(req)) || (await caches.match(req, { ignoreSearch: true })) || (alt && (await caches.match(new URL(alt, url).href, { ignoreSearch: true })));
}
async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok && !res.redirected) (await caches.open(RUNTIME)).put(req, res.clone());
    return res;
  } catch {
    return (await fromCache(req)) || Response.error();
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
  // This version's app files come first, so an older runtime copy can never win.
  const hit = (await (await caches.open(SHELL)).match(req)) || (await caches.match(req));
  const fresh = fetch(req, { cache: "no-cache" }).then(async (res) => { if (res.ok || res.type === "opaque") (await caches.open(RUNTIME)).put(req, res.clone()); return res; }).catch(() => hit);
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
