/* =========================================================
   AxomRank shared core, used by the course home and the lesson player:
   bilingual text helpers, saved progress, streak, sound, media URLs,
   offline downloads and the merge rule used by account sync.
   ========================================================= */
(() => {
"use strict";
const CFG = window.AXOM_CONFIG || {};
const B = (en, as) => ({ en, as });
const AS_DIGITS = "০১২৩৪৫৬৭৮৯";
const asNum = (s) => String(s).replace(/\d/g, (d) => AS_DIGITS[d]);
const T = (o) => (o == null ? "" : typeof o === "string" ? o : `<span class="en">${o.en}</span><span class="as">${o.as}</span>`);
const N = (n) => T(B(String(n), asNum(n)));

/* ---------- saved progress (localStorage; synced to the account when signed in) ---------- */
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const G = Object.assign({ xp: 0, streak: { n: 0, last: null }, sound: true, as: false, fs: 1, motion: true,
  mistakes: {}, srs: {}, days: {}, stats: {}, checkpoints: {}, updated: 0 }, store.get("axom:global", {}));
const lessonKey = (id) => `axom:lesson:${id}`;
const getLesson = (id) => Object.assign({ done: {} }, store.get(lessonKey(id), {}));
const listeners = [];
function saveGlobal() { G.updated = Date.now(); store.set("axom:global", G); listeners.forEach((f) => f()); }
function saveLesson(id, P) { store.set(lessonKey(id), P); saveGlobal(); }

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const iso = (offset = 0) => { const d = new Date(Date.now() + offset * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* ---------- spaced repetition (rule-based): a step returns after 1, 3, 7, 15, 30 days ---------- */
const INTERVALS = [1, 3, 7, 15, 30];
function srsLearn(stepId, lessonId) { if (!G.srs[stepId]) G.srs[stepId] = { l: lessonId, s: 0, d: iso(1) }; }
function srsAnswer(stepId, lessonId, right) {
  const cur = G.srs[stepId] || { l: lessonId, s: 0 };
  const s = right ? Math.min(cur.s + 1, INTERVALS.length - 1) : 0;
  G.srs[stepId] = { l: lessonId, s, d: iso(right ? INTERVALS[s] : 1) };
}
function reviewQueue() {   // due steps + saved mistakes, as [{ l, id }]
  const today = iso(), seen = new Set(), out = [];
  Object.entries(G.srs).filter(([, v]) => v.d <= today).sort((a, b) => (a[1].d < b[1].d ? -1 : 1)).forEach(([id, v]) => { seen.add(id); out.push({ l: v.l, id }); });
  Object.entries(G.mistakes).forEach(([l, ids]) => ids.forEach((id) => { if (!seen.has(id)) { seen.add(id); out.push({ l, id }); } }));
  return out;
}
function record(lessonId, right) { const st = (G.stats[lessonId] = G.stats[lessonId] || { a: 0, o: 0 }); st.a++; if (right) st.o++; }
function addDayXP(xp) { const k = iso(); G.days[k] = (G.days[k] || 0) + xp; }
const streakNow = () => { const t = dayKey(new Date()), y = dayKey(new Date(Date.now() - 864e5)); return G.streak.last === t || G.streak.last === y ? G.streak.n : 0; };
function bumpStreak() {
  const t = dayKey(new Date()), y = dayKey(new Date(Date.now() - 864e5));
  if (G.streak.last !== t) G.streak = { n: G.streak.last === y ? G.streak.n + 1 : 1, last: t };
}

/* ---------- account sync: one document per user ---------- */
// Shape of users/{uid}: { xp, streak, lessons: { id: { done: [...] } }, mistakes, srs, days, stats, checkpoints, updated }
function snapshot() {
  const lessons = {};
  Object.keys(localStorage).filter((k) => k.startsWith("axom:lesson:")).forEach((k) => { lessons[k.slice(12)] = { done: Object.keys(store.get(k, {}).done || {}) }; });
  return { xp: G.xp, streak: G.streak, lessons, mistakes: G.mistakes, srs: G.srs, days: G.days, stats: G.stats, checkpoints: G.checkpoints, updated: G.updated };
}
// Merge rule: never lose progress. XP = higher, finished units = union of both,
// streak and mistakes = whichever side was updated more recently.
function merge(a, b) {
  const newer = (b.updated || 0) > (a.updated || 0) ? b : a;
  const lessons = {};
  new Set([...Object.keys(a.lessons || {}), ...Object.keys(b.lessons || {})]).forEach((id) => {
    lessons[id] = { done: [...new Set([...((a.lessons || {})[id] || {}).done || [], ...((b.lessons || {})[id] || {}).done || []])] };
  });
  const days = { ...(a.days || {}) };
  Object.entries(b.days || {}).forEach(([k, v]) => (days[k] = Math.max(days[k] || 0, v)));
  return { xp: Math.max(a.xp || 0, b.xp || 0), streak: newer.streak || { n: 0, last: null }, lessons, mistakes: newer.mistakes || {},
    srs: newer.srs || {}, days, stats: newer.stats || {}, checkpoints: { ...(a.checkpoints || {}), ...(b.checkpoints || {}) }, updated: Math.max(a.updated || 0, b.updated || 0) };
}
function applySnapshot(s) {
  G.xp = s.xp; G.streak = s.streak; G.mistakes = s.mistakes; G.updated = s.updated;
  G.srs = s.srs || {}; G.days = s.days || {}; G.stats = s.stats || {}; G.checkpoints = s.checkpoints || {};
  store.set("axom:global", G);
  Object.entries(s.lessons).forEach(([id, v]) => { const P = getLesson(id); v.done.forEach((u) => (P.done[u] = true)); store.set(lessonKey(id), P); });
}

/* ---------- sound (gentle, optional; unlocked on first tap for phones) ---------- */
let ac = null;
function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (ac.state !== "running") ac.resume().catch(() => {});
  return ac;
}
function unlockAudio() {
  const c = audio(); if (!c) return;
  try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch { /* ignore */ }
  if (c.state === "running") ["pointerdown", "touchend", "keydown"].forEach((ev) => document.removeEventListener(ev, unlockAudio, true));
}
["pointerdown", "touchend", "keydown"].forEach((ev) => document.addEventListener(ev, unlockAudio, true));
document.addEventListener("visibilitychange", () => { if (!document.hidden && ac) ac.resume().catch(() => {}); });
function tone(freqs, type = "sine", dur = 0.14, gap = 0.09, vol = 0.2) {
  if (!G.sound) return;
  const c = audio(); if (!c) return;
  const play = () => {
    try {
      freqs.forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), st = c.currentTime + 0.01 + i * gap;
        o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(vol, st + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur); o.connect(g).connect(c.destination); o.start(st); o.stop(st + dur + 0.03);
      });
    } catch { /* no audio */ }
  };
  if (c.state === "running") play(); else c.resume().then(play).catch(() => {});
}
const buzz = (p) => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch { /* no vibration */ } };
const SFX = {   // volumes set for phone speakers
  tap: () => tone([520], "sine", 0.06, 0, 0.08),
  pair: () => tone([740], "sine", 0.1, 0, 0.16),
  good: () => { tone([659, 880], "sine", 0.18, 0.09, 0.22); buzz(12); },
  bad: () => { tone([233, 196], "triangle", 0.22, 0.12, 0.2); buzz([30, 40, 30]); },
  done: () => tone([523, 659, 784, 1047], "sine", 0.24, 0.11, 0.2),
  gift: () => { tone([988, 1319, 1568], "sine", 0.16, 0.07, 0.2); buzz([15, 30, 15]); },
};

/* ---------- content + media ---------- */
const mediaBase = CFG.mediaBase || "content/media/";
const media = (path, size) => mediaBase + (size === 480 ? path.replace(/\.webp$/, "@480.webp") : path);   // path like "sukaphaa/x.webp", "shared/x.webp", "faces/x.webp"
// Every content file is fetched with the release number (?v=…) from content/manifest.json, so a new
// release is a new address that no browser or service-worker cache can answer with an old copy.
let release = null;
const releaseVersion = () => (release = release || fetch("content/manifest.json", { cache: "no-cache" }).then((r) => r.json()).then((m) => m.version).catch(() => ""));
async function getJSON(url) {
  const v = url.startsWith("content/") && url !== "content/manifest.json" ? await releaseVersion() : "";
  const r = await fetch(v ? `${url}?v=${v}` : url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}

/* ---------- offline downloads (Cache API, shared with the service worker) ---------- */
const OFFLINE_CACHE = "axom-offline";
async function isOffline(urls) {
  if (!("caches" in window)) return false;
  const c = await caches.open(OFFLINE_CACHE);
  const hits = await Promise.all(urls.map((u) => c.match(u)));
  return hits.every(Boolean);
}
async function saveOffline(urls, onProgress) {
  const c = await caches.open(OFFLINE_CACHE);
  let done = 0;
  for (const u of urls) { await c.add(new Request(u, { cache: "reload" })); onProgress && onProgress(++done, urls.length); }
}

/* ---------- shared icons ---------- */
const ICON = {
  fire: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12.6 2.2c.3 2.8-1 4.4-2.4 6-1.4 1.6-2.9 3.3-2.9 6.1A5.2 5.2 0 0 0 12.5 20a5.6 5.6 0 0 0 5.7-5.6c0-2.3-1-3.9-2-5.2-.2 1.3-.8 2.3-1.9 2.8.4-3.3-.4-6.8-1.7-9.8z"/></svg>',
  gem: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 3h10l4 5.5L12 21 3 8.5z"/><path fill="#fff" opacity=".35" d="M7 3l2.5 5.5H3zM12 21 9.5 8.5h5z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
};

/* ---------- reading settings ---------- */
function applySettings() {
  document.documentElement.style.setProperty("--zoom", G.fs || 1);
  document.documentElement.classList.toggle("no-motion", G.motion === false);
}
applySettings();
function openSettings(extra = "") {
  const root = document.getElementById("sheet-root");
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-set="${key}" data-val="${v}" class="${String(G[key]) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
  root.innerHTML = `<div class="backdrop" data-close-settings></div><div class="sheet left"><div class="grab"></div><h2>${T(B("Settings", "ছেটিং"))}</h2>
    <div class="setting"><span>${T(B("Language", "ভাষা"))}</span>${seg("as", [[false, "English"], [true, "অসমীয়া"]])}</div>
    <div class="setting"><span>${T(B("Sound", "শব্দ"))}</span>${seg("sound", [[true, T(B("On", "অন"))], [false, T(B("Off", "অফ"))]])}</div>
    <div class="setting"><span>${T(B("Text size", "আখৰৰ আকাৰ"))}</span>${seg("fs", [[0.92, "A−"], [1, "A"], [1.12, "A+"]])}</div>
    <div class="setting"><span>${T(B("Animations", "এনিমেচন"))}</span>${seg("motion", [[true, T(B("On", "অন"))], [false, T(B("Off", "অফ"))]])}</div>
    ${extra}<div class="setting ver"><span>${T(B("App version", "এপৰ সংস্কৰণ"))}</span><span id="app-ver">…</span></div><button class="link" data-close-settings>${T(B("Close", "বন্ধ কৰা"))}</button></div>`;
  releaseVersion().then((v) => { const el = document.getElementById("app-ver"); if (el) el.textContent = v || "?"; });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-set]");
  if (b) {
    const k = b.dataset.set, raw = b.dataset.val;
    G[k] = raw === "true" ? true : raw === "false" ? false : +raw;
    if (k === "as") { const box = document.getElementById("as"); if (box) { box.checked = G.as; box.dispatchEvent(new Event("change")); } }
    saveGlobal(); applySettings();
    b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    return;
  }
  if (e.target.closest("[data-close-settings]")) document.getElementById("sheet-root").innerHTML = "";
});

/* ---------- language switch (both languages are in the page; CSS shows one) ---------- */
function initLang() {
  const box = document.getElementById("as");
  if (!box) return;
  if (G.as) box.checked = true;
  box.addEventListener("change", () => { G.as = box.checked; saveGlobal(); });
}

/* ---------- service worker (offline + install) ---------- */
// Coming back with the browser's Back button can show a frozen copy of the page from before the
// learner finished something (back/forward cache). Reload it so locks and progress are current.
addEventListener("pageshow", (e) => { if (e.persisted) location.reload(); });
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* ---------- account sync (only when Firebase is configured) ---------- */
const auth = { ready: false, user: null, signIn: null, signOut: null, onChange: [] };
if (CFG.firebase) {
  import("./sync.js").then((m) => m.start({ CFG, auth, snapshot, merge, applySnapshot, listeners })).catch((e) => console.warn("Sync unavailable:", e));
}

window.AXOM = { B, T, N, asNum, store, G, getLesson, saveGlobal, saveLesson, streakNow, bumpStreak, SFX, tone, media, getJSON,
  isOffline, saveOffline, ICON, initLang, auth, merge, snapshot, applySnapshot, onSave: (f) => listeners.push(f), _audioState: () => (ac ? ac.state : "none"),
  iso, srsLearn, srsAnswer, reviewQueue, record, addDayXP, openSettings };
})();
