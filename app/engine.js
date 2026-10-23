/* =========================================================
   AxomRank lesson engine
   A lesson page sets window.LESSON (content) and loads this file.
   The engine builds the lesson path, the units, the feedback,
   progress, streak, sounds and the mistakes bank.
   ========================================================= */
(() => {
"use strict";
const { B, T, N, asNum, G, SFX, media } = window.AXOM;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const shuffledIdx = (n) => { let s; do { s = shuffle([...Array(n).keys()]); } while (n > 1 && s.every((v, k) => v === k)); return s; };
const params = new URLSearchParams(location.search);
const UNLOCK_ALL = params.has("all");

/* Load content/lessons/<id>.json, then build the lesson. */
async function load() {
  const id = (params.get("id") || "sukaphaa").replace(/[^a-z0-9-]/g, "");
  try { boot(await AXOM.getJSON(`content/lessons/${id}.json`)); }
  catch (e) {
    document.body.insertAdjacentHTML("afterbegin", `<div class="stage"><div class="device"><div class="load-error"><h2>${T(B("This lesson could not be opened", "পাঠটো খুলিব পৰা নগ'ল"))}</h2><p>${T(B("Check your internet connection, or download the lesson for offline use when you are online.", "ইণ্টাৰনেট সংযোগ পৰীক্ষা কৰা, বা অনলাইন থকাৰ সময়ত পাঠটো অফলাইনৰ বাবে ডাউনলোড কৰি ৰাখা।"))}</p><a class="btn" href="index.html">${T(B("All lessons", "সকলো পাঠ"))}</a></div></div></div>`);
    console.warn(e);
  }
}

/* Everything below runs once the lesson data L is loaded. */
function boot(L) {
const P = AXOM.getLesson(L.id);
const saveAll = () => AXOM.saveLesson(L.id, P);
const streakNow = AXOM.streakNow;
const bank = () => (G.mistakes[L.id] = G.mistakes[L.id] || []);

/* ---------- icons and art ---------- */
const ICONS = {
  walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4" r="2"/><path d="M10 22l2-6-3-3 1-5 4 3h3M9 8l-3 3"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
  hands: '<svg viewBox="0 0 24 24"><path d="M8 13l3 3a2 2 0 0 0 3 0l5-5M2 12l4-4 4 2 3-2 4 2 5 2"/><path d="M6 8l-4 4 6 6"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>',
  hill: '<svg viewBox="0 0 24 24"><path d="M2 20l7-11 4 6 3-4 6 9z"/><circle cx="17" cy="5" r="2"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg>',
  river: '<svg viewBox="0 0 24 24"><path d="M3 6c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 12c3 0 3 3 6 3s3-3 6-3 3 3 6 3M3 18c3 0 3 3 6 3"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  done: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3.4"/></svg>',
};
const ART = {
  scroll: `<svg viewBox="0 0 200 150"><rect x="44" y="32" width="112" height="86" rx="6" fill="var(--surface)" stroke="var(--terra)" stroke-width="3"/><rect x="30" y="26" width="18" height="98" rx="9" fill="var(--terra)"/><rect x="152" y="26" width="18" height="98" rx="9" fill="var(--terra)"/>${[50, 62, 74, 86, 98].map((y, i) => `<path d="M60 ${y}h${i % 2 ? 66 : 80}" stroke="var(--indigo)" stroke-width="4" stroke-linecap="round" opacity="${0.85 - i * 0.1}"/>`).join("")}<circle cx="132" cy="104" r="8" fill="var(--gold)"/></svg>`,
  calendar: `<svg viewBox="0 0 200 150"><rect x="50" y="22" width="100" height="112" rx="14" fill="var(--surface)" stroke="var(--line-2)" stroke-width="3"/><path d="M50 36a14 14 0 0 1 14-14h72a14 14 0 0 1 14 14v18H50z" fill="var(--terra)"/><rect x="72" y="12" width="8" height="22" rx="4" fill="var(--indigo)"/><rect x="120" y="12" width="8" height="22" rx="4" fill="var(--indigo)"/><text class="en" x="100" y="48" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="14" fill="#fff" letter-spacing="2">DEC</text><text class="as" x="100" y="48" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-weight="800" font-size="14" fill="#fff">ডিচেম্বৰ</text><text class="en" x="100" y="114" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="58" fill="var(--indigo)">2</text><text class="as" x="100" y="114" text-anchor="middle" font-family="Noto Sans Bengali, sans-serif" font-weight="800" font-size="58" fill="var(--indigo)">২</text></svg>`,
  rooster: `<svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice"><rect width="200" height="150" fill="#2E3170"/><circle cx="160" cy="34" r="22" fill="#F6E7C4" opacity=".18"/><circle cx="160" cy="34" r="15" fill="#F6E7C4"/>${[[30, 20], [70, 40], [120, 18], [40, 60], [180, 70], [95, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#F6E7C4"/>`).join("")}<path d="M0 128c40-10 80-10 120-4s60 6 80 2v24H0z" fill="#1D1F4D"/><g transform="translate(62 54)"><path d="M30 70c-22 0-34-16-30-34 3-12 14-20 26-20 6-10 18-14 26-8l-4 6c8 0 12 6 10 12l-10-2c4 8 4 20-2 30" fill="var(--terra)"/><path d="M50 8c2-6 8-8 10-4-4 0-6 2-6 6z" fill="#D2483E"/><path d="M62 18l10 3-10 3z" fill="var(--gold)"/><circle cx="55" cy="16" r="2" fill="#1D1F4D"/><path d="M6 44c-10-6-16-20-8-30 2 10 8 16 14 18" fill="var(--gold)"/><path d="M24 70v12M36 68v14M18 82h10M30 82h12" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/></g><path d="M140 70q8-6 16 0M146 60q10-8 20 0" stroke="#F6E7C4" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,
  embassy: `<svg viewBox="0 0 200 150"><path d="M20 120 C 60 60, 140 60, 180 120" fill="none" stroke="var(--terra)" stroke-width="4" stroke-dasharray="8 7" stroke-linecap="round"/><circle cx="20" cy="120" r="12" fill="var(--indigo)"/><circle cx="180" cy="120" r="12" fill="var(--gold)"/><rect x="82" y="44" width="36" height="26" rx="4" fill="var(--surface)" stroke="var(--terra)" stroke-width="3"/><path d="M82 46l18 14 18-14" fill="none" stroke="var(--terra)" stroke-width="3"/></svg>`,
};

/* ---------- maps (each lesson supplies its own spec) ---------- */
function mapSVG(spec, { story = false, route = false, choices = [] } = {}) {
  const lab = (o, hide) => (hide || !o ? "" : `<text class="lbl ${o.cls || "place"}" x="${o.x}" y="${o.y}" text-anchor="${o.anchor || "start"}" ${o.rot ? `transform="rotate(${o.rot} ${o.x} ${o.y})"` : ""}><tspan class="en">${o.t.en}</tspan></text><text class="lbl ${o.cls || "place"} as" x="${o.x}" y="${o.y}" text-anchor="${o.anchor || "start"}" ${o.rot ? `transform="rotate(${o.rot} ${o.x} ${o.y})"` : ""}>${o.t.as}</text>`);
  const isChoice = (id) => choices.includes(id);
  let out = `<svg class="map" viewBox="${spec.view}" role="img" aria-label="Schematic map"><defs><marker id="arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--terra)"/></marker></defs>`;
  if (story) (spec.texts || []).forEach((t) => (out += lab({ ...t, cls: t.cls || "big" })));   // region names only on story maps (they would give answers away)
  (spec.rivers || []).forEach((r) => {
    out += `<path class="river${r.small ? " small" : ""}" d="${r.d}" ${r.small ? 'style="stroke-width:4"' : ""}/>`;
    if (isChoice(r.id)) out += `<g class="hit" data-place="${r.id}"><path class="zone" d="${r.d}"/></g>`;
    out += lab(r.label, !story && isChoice(r.id));
  });
  (spec.hills || []).forEach((h) => {
    out += `<g class="hills">${h.peaks.map(([x, y]) => `<path d="M${x - 16} ${y + 10} L${x} ${y - 14} L${x + 16} ${y + 10} Z"/>`).join("")}</g>`;
    if (isChoice(h.id)) out += `<g class="hit" data-place="${h.id}"><path class="zone" d="${h.zone}"/></g>`;
    out += lab(h.label, !story && isChoice(h.id));
  });
  if (story && route) (spec.routes || []).forEach((r) => (out += `<path class="route" d="${r}" marker-end="url(#arrowhead)"/>`));
  (spec.passes || []).forEach((p) => {   // mountain passes: always highlighted, so learners notice them
    if (isChoice(p.id) && !story) { out += `<g class="hit pass-hit" data-place="${p.id}"><circle class="ring" cx="${p.x}" cy="${p.y}" r="17"/><circle class="pass" cx="${p.x}" cy="${p.y}" r="8"/></g>`; return; }
    out += `<circle class="pass-glow" cx="${p.x}" cy="${p.y}" r="13"/><circle class="pass" cx="${p.x}" cy="${p.y}" r="8"/><path class="pass-mark" d="M${p.x - 4} ${p.y + 3} L${p.x} ${p.y - 3} L${p.x + 4} ${p.y + 3}"/>`;
    out += lab({ ...p.label, cls: "place passlbl" }, !story && choices.length > 0);
  });
  (spec.places || []).forEach((p) => {
    if (!story && !isChoice(p.id)) return;
    if (isChoice(p.id) && !story) out += `<g class="hit" data-place="${p.id}"><circle class="ring" cx="${p.x}" cy="${p.y}" r="17"/><circle class="dot" cx="${p.x}" cy="${p.y}" r="7"/></g>`;
    else out += `<circle class="dot" cx="${p.x}" cy="${p.y}" r="6"/>`;
    if (story) out += lab(p.label);
  });
  return out + `</svg><div class="map-note">${T(B("Schematic map, not to scale", "আনুমানিক মানচিত্ৰ, জোখ অনুসৰি নহয়"))}</div>`;
}

/* ---------- labels ---------- */
const KICK = {
  mcq: B("Choose the correct answer", "শুদ্ধ উত্তৰটো বাছি লোৱা"), tf: B("True or false?", "শুদ্ধ নে অশুদ্ধ?"),
  map: B("Tap on the map", "মানচিত্ৰত টিপা"), unscramble: B("Unscramble", "সজাই লিখা"), inline: B("Complete the sentence", "বাক্যটো সম্পূৰ্ণ কৰা"),
  order: B("Put it in order", "ক্ৰম অনুসৰি সজোৱা"), match: B("Match the following", "মিলোৱা"), fill: B("Fill in the blank", "খালী ঠাই পূৰ কৰা"),
  odd: B("Odd one out", "অমিলটো বিচাৰা"), picture: B("Picture", "ছবি চিনাক্ত কৰা"), whoami: B("Who am I?", "মই কোন?"),
  spot: B("Spot the error", "ভুলটো বিচাৰা"), timeline: B("Timeline", "সময়ৰেখা"), story: B("Story", "কাহিনী"),
};
const PRAISE = [B("Correct!", "শুদ্ধ!"), B("Excellent!", "বঢ়িয়া!"), B("Well done!", "বহুত ভাল!"), B("Great!", "চমৎকাৰ!")];

/* ---------- page skeleton ---------- */
document.body.insertAdjacentHTML("afterbegin", `
<input type="checkbox" id="as" aria-label="Show in Assamese">
<div class="stage"><div class="device" id="device">
  <div class="confetti" id="confetti" aria-hidden="true"></div>
  <div class="view" id="v-path">
    <div class="p-top">
      <a class="icon-btn" href="index.html" aria-label="All lessons">${AXOM.ICON.back}</a>
      <label class="lang" for="as"><span class="en">অ</span><span class="as">EN</span></label>
      <span class="spacer"></span>
      <span class="fire" id="fire">${AXOM.ICON.fire}<span id="streak"></span></span>
      <span class="gem">${AXOM.ICON.gem}<span id="xp-total"></span></span>
      <button class="icon-btn" id="sound" aria-label="Sound on or off"></button>
    </div>
    <div class="p-scroll">
      <section class="hero">
        <img src="${media(`${L.id}/${L.portrait}`)}" alt="">
        <div class="txt">
          <div class="eyebrow">${T(B(`Ahom kings · Lesson ${L.no}`, `আহোম ৰজা · পাঠ ${asNum(L.no)}`))}</div>
          <h1>${T(L.king)}</h1>
          <div class="reign">${T(L.reign)}</div>
          ${L.buildsOn ? `<a class="builds-on" href="lesson.html?id=${L.buildsOn.id}">${T(B(`Builds on Lesson ${L.buildsOn.no}: ${L.buildsOn.title.en}`, `পাঠ ${asNum(L.buildsOn.no)}ৰ ভেটিত: ${L.buildsOn.title.as}`))}</a>` : ""}
          <div class="meter"><i id="meter"></i></div>
          <div class="count" id="count"></div>
          <button class="offline-btn" id="offline"></button>
        </div>
      </section>
      <div id="mistake-slot"></div>
      <div class="path" id="path"></div>
      <div class="p-foot">${T(B("Paintings are artistic reconstructions. Maps are schematic, not to scale.", "ছবিবোৰ শিল্পীৰ কল্পনা। মানচিত্ৰবোৰ আনুমানিক, জোখ অনুসৰি নহয়।"))}</div>
    </div>
  </div>
  <div class="view" id="v-play">
    <div class="top">
      <button class="close" id="exit" aria-label="Leave unit">×</button>
      <div class="bar"><i id="progress"></i></div>
      <label class="lang" for="as"><span class="en">অ</span><span class="as">EN</span></label>
    </div>
    <div class="screen" id="screen"></div>
    <div class="foot" id="foot">
      <div class="fb" role="status" aria-live="polite">
        <div class="fb-head"><span class="fb-badge" id="fb-badge"></span><span id="fb-title"></span><span class="fb-xp" id="fb-xp"></span></div>
        <div class="fb-ans" id="fb-ans"></div>
        <div class="fb-why" id="fb-why"></div>
      </div>
      <button class="btn" id="action"></button>
    </div>
  </div>
  <div class="view" id="v-done">
    <div class="done-wrap" id="done"></div>
    <div class="foot"><button class="btn" id="done-btn">${T(B("Continue", "আগবাঢ়া"))}</button></div>
  </div>
  <div id="sheet-root"></div>
</div></div>`);
AXOM.initLang();
const langBox = $("#as");
const isAS = () => langBox.checked;
document.title = `${L.king.en} · Lesson ${L.no}`;

/* ---------- lesson path ---------- */
const ALL = [...L.units, L.test];
const unlocked = (k) => UNLOCK_ALL || k === 0 || !!P.done[ALL[k - 1].id];
const showView = (id) => $$(".view").forEach((v) => v.classList.toggle("on", v.id === id));
let pop = null;

function topStats() {
  const s = streakNow();
  $("#fire").classList.toggle("on", s > 0);
  $("#streak").innerHTML = N(s);
  $("#xp-total").innerHTML = N(G.xp);
  $("#sound").innerHTML = G.sound ? AXOM.ICON.soundOn : AXOM.ICON.soundOff;
  $("#sound").classList.toggle("off", !G.sound);
}
const BY_ID = new Map(ALL.flatMap((u) => u.steps.map((s) => [s.id, s])));
(() => {   // migrate mistakes saved by position before steps had ids
  const b = bank(), conv = b.map((ref) => { const m = /^(\w+):(\d+)$/.exec(ref); if (!m) return ref; const u = ALL.find((x) => x.id === m[1]); return u && u.steps[+m[2]] ? u.steps[+m[2]].id : null; }).filter(Boolean);
  if (conv.join() !== b.join()) { G.mistakes[L.id] = [...new Set(conv)]; saveAll(); }
})();
function resolveStep(ref) { const s = BY_ID.get(ref); return s ? { s, ref } : null; }
function renderPath() {
  topStats();
  const doneCount = ALL.filter((u) => P.done[u.id]).length;
  $("#meter").style.width = `${(doneCount / ALL.length) * 100}%`;
  $("#count").innerHTML = T(B(`${doneCount} of ${ALL.length} steps complete`, `${asNum(ALL.length)}টাৰ ভিতৰত ${asNum(doneCount)}টা সম্পূৰ্ণ`));
  const m = bank().map(resolveStep).filter(Boolean);
  $("#mistake-slot").innerHTML = m.length ? `<button class="mistake-card" id="practise"><span class="ic">${N(m.length)}</span><span><b>${T(B("Practise your mistakes", "তোমাৰ ভুলবোৰ অনুশীলন কৰা"))}</b><span class="s">${T(B("Questions you missed in this lesson", "এই পাঠত ভুল হোৱা প্ৰশ্নবোৰ"))}</span></span><span class="go">›</span></button>` : "";
  const cur = ALL.findIndex((u, k) => unlocked(k) && !P.done[u.id]);
  const offs = [0, -64, -88, -50, 30, 80, 0];
  $("#path").innerHTML = ALL.map((u, k) => {
    const isTest = u === L.test, isDone = !!P.done[u.id], open = unlocked(k);
    const cls = `${isTest ? "test " : ""}${isDone ? "done" : open ? "open" : "locked"}${k === cur ? " cur" : ""}`;
    const icon = isDone ? ICONS.done : !open ? ICONS.lock : ICONS[isTest ? "trophy" : u.icon] || ICONS.star;
    const ex = u.steps.filter((s) => s.type !== "story").length;
    const types = [...new Set(u.steps.filter((s) => s.type !== "story").map((s) => s.type))];
    const popHTML = pop === k ? `<div class="pop ${isDone ? "done" : isTest ? "test" : open ? "" : "locked"}">
        <h3>${T(u.title)}</h3>
        <p>${open ? T(B(`${ex} exercises · about 4 min`, `${asNum(ex)}টা অনুশীলন · প্ৰায় ৪ মিনিট`)) : T(B("Complete the step above to unlock this.", "ওপৰৰ স্তৰটো শেষ কৰিলে এইটো খোল খাব।"))}</p>
        ${open && unitLinks(u).length ? `<p class="builds">${CHAIN}${T(B("Builds on", "ভেটি"))}: ${unitLinks(u).map((l) => T(linkLabel(l))).join(", ")}</p>` : ""}
        ${open ? `<div class="types">${types.map((ty) => `<span>${T(KICK[ty])}</span>`).join("")}</div><button class="btn" data-start="${k}">${isDone ? T(B("Practise again", "আকৌ অনুশীলন")) : T(B("Start", "আৰম্ভ"))}</button>` : ""}
      </div>` : "";
    return `<div class="node-wrap" style="transform:translateX(${offs[k % offs.length]}px);z-index:${pop === k ? 6 : 1}">
      ${k === cur && pop !== k ? `<span class="bubble">${T(B("Start", "আৰম্ভ"))}</span>` : ""}
      <button class="node ${cls}" data-node="${k}" aria-label="${u.title.en}">${icon}</button>
      <div class="node-label ${open ? "" : "locked"}">${isTest ? "" : T(B(`Unit ${k + 1}`, `অধ্যায় ${asNum(k + 1)}`)) + " · "}${T(u.title)}</div>
      ${popHTML}
    </div>`;
  }).join("");
}

/* ---------- connections between units / lessons ---------- */
// step.link = { unit: "u1", note }                       → a unit earlier in this lesson
// step.link = { lesson: 1, file, unitNo, unitTitle, note } → a unit in another lesson
function linkLabel(link) {
  if (link.lesson) return B(`Lesson ${link.lesson} · ${link.unitTitle.en}`, `পাঠ ${asNum(link.lesson)} · ${link.unitTitle.as}`);
  const k = ALL.findIndex((u) => u.id === link.unit);
  return k < 0 ? B("", "") : B(`Unit ${k + 1} · ${ALL[k].title.en}`, `অধ্যায় ${asNum(k + 1)} · ${ALL[k].title.as}`);
}
const CHAIN = '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';
function linkCallout(link) {
  return `<button class="linkback" data-link><span class="ic">${CHAIN}</span><span><small>${T(B("Connects to", "সংযোগ"))} · ${T(linkLabel(link))}</small>${T(link.note)}</span></button>`;
}
function openLinkSheet(link) {
  let body = `<p class="note">${T(link.note)}</p>`;
  if (link.lesson) {
    body += `<a class="btn" href="lesson.html?id=${link.lessonId}" target="_blank" rel="noopener">${T(B(`Open Lesson ${link.lesson} in a new tab`, `পাঠ ${asNum(link.lesson)} নতুন টেবত খোলা`))}</a>`;
  } else {
    const u = ALL.find((x) => x.id === link.unit);
    if (u && u.learned) body += `<ul class="recap">${u.learned.map((l) => `<li>${T(l)}</li>`).join("")}</ul>`;
  }
  $("#sheet-root").innerHTML = `<div class="backdrop" data-keep></div><div class="sheet left"><div class="grab"></div><h2>${T(linkLabel(link))}</h2>${body}<button class="link" data-keep>${T(B("Back to the exercise", "অনুশীলনলৈ উভতি যোৱা"))}</button></div>`;
}
const unitLinks = (u) => {
  const seen = new Map();
  u.steps.forEach((s) => { if (s.link) { const key = s.link.lesson ? `L${s.link.lesson}:${s.link.unitNo}` : s.link.unit; if (!seen.has(key)) seen.set(key, s.link); } });
  return [...seen.values()];
};

/* ---------- unit play ---------- */
let U = null;
function startUnit(k) {
  const unit = ALL[k];
  U = { unit, practice: false, queue: unit.steps.map((s) => ({ s, ref: s.id })), pos: 0, done: 0, total: unit.steps.length, xp: 0, ok: 0, asked: 0, mistakes: [], start: Date.now(), phase: "answer", st: {} };
  pop = null; showView("v-play"); renderStep(true);
}
function startPractice() {
  const items = shuffle(bank().map(resolveStep).filter(Boolean)).slice(0, 10);
  if (!items.length) return;
  const unit = { id: "practice", title: B("Practise your mistakes", "ভুলৰ অনুশীলন"), learned: [], steps: items.map((x) => x.s) };
  U = { unit, practice: true, queue: items, pos: 0, done: 0, total: items.length, xp: 0, ok: 0, asked: 0, mistakes: [], start: Date.now(), phase: "answer", st: {} };
  pop = null; showView("v-play"); renderStep(true);
}
const step = () => U.queue[U.pos];

function renderStep(animate) {
  const it = step(), s = it.s;
  U.phase = "answer"; U.st = {};
  $("#progress").style.width = `${(U.done / U.total) * 100}%`;
  $("#foot").className = "foot";
  const scr = $("#screen");
  scr.classList.remove("enter"); void scr.offsetWidth; if (animate) scr.classList.add("enter");
  const kick = s.type === "story" ? `<div class="kicker story">${T(KICK.story)}</div>`
    : it.retry ? `<div class="kicker retry">${T(B("Previous mistake", "আগৰ ভুল"))}</div>`
    : `<div class="kicker">${T(KICK[s.type])}${s.link ? `<button class="linkchip" data-link>${CHAIN}${T(linkLabel(s.link))}</button>` : ""}${s.type === "whoami" ? `<span class="xp" id="who-xp"></span>` : ""}</div>`;
  scr.innerHTML = kick + RENDER[s.type](s) + (s.type === "story" && s.link ? linkCallout(s.link) : "");
  scr.scrollTop = 0;
  if (SETUP[s.type]) SETUP[s.type](s, scr);
  refresh();
}
const img = (f, size) => media(`${L.id}/${f}`, size);
const picture = (f, cls = "") => `<img src="${img(f)}" srcset="${img(f, 480)} 480w, ${img(f)} 1080w" sizes="(max-width: 440px) 92vw, 360px" alt="" ${cls}>`;
const RENDER = {
  story: (s) => `<h1 class="t">${T(s.title)}</h1>
    ${s.img ? `<figure class="frame ${s.top ? "top" : ""}">${picture(s.img)}<span class="credit">${T(B("Artistic reconstruction", "শিল্পীৰ কল্পনা"))}</span></figure>`
      : s.map ? `<figure class="frame mapframe">${mapSVG(L.map, { story: true, route: s.map.route })}</figure>`
      : `<figure class="frame art${s.art === "rooster" ? " full" : ""}">${ART[s.art]}</figure>`}
    <div class="story">${s.text.map((p) => `<p>${T(p)}</p>`).join("")}</div>`,
  mcq: (s) => `<p class="prompt" ${s.small ? 'style="font-size:18px"' : ""}>${T(s.q)}</p>
    <div class="opts">${s.options.map((o, k) => `<button class="tile opt" data-opt="${k}"><span class="k">${"ABCD"[k]}</span><span>${T(o)}</span></button>`).join("")}</div>`,
  odd: (s) => `<p class="prompt">${T(s.q)}</p><div class="opts grid2">${s.options.map((o, k) => `<button class="tile opt" data-opt="${k}"><span>${T(o)}</span></button>`).join("")}</div>`,
  inline: (s) => `<p class="sentence">${T(s.before)} <span class="blank" data-fillchip>&nbsp;</span> ${T(s.after)}</p>
    <div class="opts grid2 ${s.big ? "big" : ""}">${s.options.map((o, k) => `<button class="tile opt" data-opt="${k}"><span>${T(o)}</span></button>`).join("")}</div>`,
  tf: (s) => `<div class="statement">${T(s.s)}</div><div class="tf">
    <button class="tile t" data-tf="1"><span class="sym">✓</span>${T(B("True", "শুদ্ধ"))}</button>
    <button class="tile f" data-tf="0"><span class="sym">✕</span>${T(B("False", "অশুদ্ধ"))}</button></div>`,
  fill: (s) => `<div class="en"><p class="sentence">${s.before.en} <span class="blank"><span class="given">${s.answer[0]}</span><input type="text" maxlength="${s.answer.length - 1}" style="--n:${s.answer.length - 1}" placeholder="${"_".repeat(s.answer.length - 1)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Type the rest of the word"></span>${s.after.en}</p>
      <p class="help">The first letter is given. Type the rest.</p></div>
    <div class="as"><p class="sentence">${s.before.as} <span class="blank" data-fillchip>&nbsp;</span> ${s.after.as}</p>
      <div class="chips">${s.asOptions.map((o, k) => `<button class="tile" data-chip="${k}">${o}</button>`).join("")}</div></div>`,
  map: (s) => `<p class="prompt">${T(s.q)}</p>${mapSVG(L.map, { choices: s.choices })}`,
  picture: (s) => `<p class="prompt">${T(s.q)}</p><div class="pics">${s.options.map((src, k) => `<button class="tile pic" data-opt="${k}"><img src="${img(src, 480)}" alt=""></button>`).join("")}</div>`,
  whoami: (s) => `<div class="clues" id="clues"></div><div class="more"><button class="chip-btn" id="more">${T(B("Show another clue", "আৰু এটা সূত্ৰ"))}</button></div>
    <div class="opts grid2">${s.options.map((o, k) => `<button class="tile opt" data-opt="${k}"><span>${T(o)}</span></button>`).join("")}</div>`,
  unscramble: (s) => `<p class="prompt">${T(s.q)}</p>
    <div class="en"><div class="word-slots" data-lang="en">${s.word.en.map(() => `<span class="wslot"></span>`).join("")}</div><div class="letters" data-lang="en"></div></div>
    <div class="as"><div class="word-slots" data-lang="as">${s.word.as.map(() => `<span class="wslot"></span>`).join("")}</div><div class="letters" data-lang="as"></div></div>`,
  spot: (s) => `<p class="prompt" style="font-size:18px">${T(s.q)}</p>
    <div class="spot en">${s.tokens.en.map((w, k) => `<button class="tok" data-tok="${k}" data-lang="en">${w}</button>`).join(" ")}</div>
    <div class="spot as">${s.tokens.as.map((w, k) => `<button class="tok" data-tok="${k}" data-lang="as">${w}</button>`).join(" ")}</div>`,
  order: (s) => `<p class="prompt">${T(s.q)}</p><div class="slots">${s.items.map((_, k) => `<div class="oslot"><span class="n">${N(k + 1)}</span></div>`).join("")}</div><div class="bank"></div>`,
  match: (s) => `<p class="prompt">${T(s.q)}</p><div class="match"><div class="col" data-side="left"></div><div class="col" data-side="right"></div></div>`,
  timeline: (s) => {
    const slot = (k) => `<div class="tslot" data-slot="${k}">${T(B("Tap an event, then tap here", "ঘটনা এটা টিপি ইয়াত টিপা"))}</div>`;
    return `<p class="prompt">${T(s.q)}</p><div class="tline">${slot(0)}${s.anchors.map((a, k) => `<div class="anchor"><span class="y">${N(a.y)}</span><span class="l">${T(a.l)}</span></div>${slot(k + 1)}`).join("")}</div>
      <div class="tbank">${s.items.map((x, k) => `<button class="tile" data-item="${k}">${T(x.t)}</button>`).join("")}</div>`;
  },
};
const SETUP = {
  order: (s, scr) => { const bk = $(".bank", scr); shuffledIdx(s.items.length).forEach((k) => bk.insertAdjacentHTML("beforeend", `<button class="tile" data-step="${k}">${T(s.items[k])}</button>`)); U.st.placed = []; },
  match: (s, scr) => {
    shuffledIdx(s.pairs.length).forEach((k) => $('[data-side="left"]', scr).insertAdjacentHTML("beforeend", `<button class="tile" data-pair="${k}">${T(s.pairs[k][0])}</button>`));
    shuffledIdx(s.pairs.length).forEach((k) => $('[data-side="right"]', scr).insertAdjacentHTML("beforeend", `<button class="tile" data-pair="${k}">${T(s.pairs[k][1])}</button>`));
    U.st = { left: null, right: null, matched: 0, misses: 0 };
  },
  unscramble: (s, scr) => {
    ["en", "as"].forEach((lg) => { const box = $(`.letters[data-lang="${lg}"]`, scr); shuffledIdx(s.word[lg].length).forEach((k) => box.insertAdjacentHTML("beforeend", `<button class="tile" data-letter="${k}" data-lang="${lg}">${s.word[lg][k]}</button>`)); });
    U.st = { en: [], as: [] };
  },
  whoami: (s) => { U.st.clues = 0; revealClue(s); },
  timeline: () => { U.st = { armed: null, placed: {} }; },
};
function revealClue(s) {
  const n = U.st.clues++;
  $("#clues").insertAdjacentHTML("beforeend", `<div class="clue"><span class="n">${N(n + 1)}</span><span>${T(s.clues[n])}</span></div>`);
  if (U.st.clues >= s.clues.length) $("#more").disabled = true;
  const el = $("#who-xp"); if (el) el.innerHTML = T(B(`Worth ${whoXP()} XP`, `${asNum(whoXP())} XP`));
}
const whoXP = () => [30, 20, 10][Math.min(U.st.clues, 3) - 1];

function ready() {
  const s = step().s, st = U.st, scr = $("#screen");
  switch (s.type) {
    case "story": return true;
    case "mcq": case "odd": case "inline": case "picture": case "whoami": return st.sel != null;
    case "fill": return isAS() ? st.chip != null : $(".en input", scr).value.trim().length === s.answer.length - 1;
    case "map": return st.place != null;
    case "unscramble": { const lg = isAS() ? "as" : "en"; return st[lg].length === s.word[lg].length; }
    case "spot": return st.tok != null;
    case "order": return st.placed.length === s.items.length;
    case "timeline": return Object.keys(st.placed).length === s.items.length;
  }
  return false;   // tf and match check themselves
}
function refresh() {
  const s = step().s, btn = $("#action"), last = U.pos === U.queue.length - 1;
  if (U.phase === "feedback" || s.type === "story") { btn.innerHTML = last ? T(B("Finish", "শেষ কৰা")) : T(B("Continue", "আগবাঢ়া")); btn.disabled = false; return; }
  btn.innerHTML = T(B("Check", "পৰীক্ষা কৰা"));
  btn.disabled = !ready();
}
function check() {
  const s = step().s, st = U.st, scr = $("#screen");
  let right = false;
  const markOpts = (ci) => { $$("[data-opt]", scr).forEach((o) => { o.disabled = true; if (+o.dataset.opt === ci) o.classList.add("right"); }); if (st.sel !== ci) $(`[data-opt="${st.sel}"]`, scr).classList.add("wrong"); };
  switch (s.type) {
    case "mcq": case "odd": case "picture": case "whoami": right = st.sel === s.answer; markOpts(s.answer); if (s.type === "whoami") $("#more").disabled = true; break;
    case "inline": { right = st.sel === s.answer; markOpts(s.answer); const c = $("[data-fillchip]", scr); c.innerHTML = T(s.options[s.answer]); c.classList.add("right"); break; }
    case "tf": right = st.sel === s.answer; $$("[data-tf]", scr).forEach((b) => { b.disabled = true; const v = b.dataset.tf === "1"; if (v === s.answer) b.classList.add("right"); else if (v === st.sel) b.classList.add("wrong"); }); break;
    case "fill":
      if (isAS()) {
        right = st.chip === s.asAnswer;
        $$("[data-chip]", scr).forEach((c) => { c.disabled = true; if (+c.dataset.chip === s.asAnswer) c.classList.add("right"); else if (+c.dataset.chip === st.chip) c.classList.add("wrong"); });
        const c = $(".as [data-fillchip]", scr); c.textContent = s.asOptions[s.asAnswer]; c.classList.add("right");
      } else {
        const inp = $(".en input", scr); right = inp.value.trim().toLowerCase() === s.answer.slice(1).toLowerCase();
        inp.disabled = true; if (!right) inp.value = s.answer.slice(1);
        $(".en .blank", scr).classList.add(right ? "right" : "wrong");
      }
      break;
    case "map": right = st.place === s.target; $$(".hit", scr).forEach((h) => { h.classList.remove("sel"); if (h.dataset.place === s.target) h.classList.add("right"); else if (h.dataset.place === st.place) h.classList.add("wrong"); }); break;
    case "unscramble": { const lg = isAS() ? "as" : "en"; right = st[lg].every((k, i) => s.word[lg][k] === s.word[lg][i]); $(`.word-slots[data-lang="${lg}"]`, scr).classList.add(right ? "right" : "wrong"); $$(".tile", scr).forEach((t) => (t.disabled = true)); break; }
    case "spot": {
      const lg = isAS() ? "as" : "en", w = s.wrong[lg]; right = st.tok === w;
      $$(`.tok[data-lang="${lg}"]`, scr).forEach((t) => { t.disabled = true; t.classList.remove("sel"); if (+t.dataset.tok === w) t.classList.add("wrong"); else if (+t.dataset.tok === st.tok) t.classList.add("sel"); });
      $(`.tok[data-lang="${lg}"][data-tok="${w}"]`, scr).insertAdjacentHTML("afterend", ` <span class="fix">${s.fix[lg]}</span>`);
      break;
    }
    case "order": right = st.placed.every((k, i) => k === i); $$(".oslot", scr).forEach((o, i) => o.classList.add(st.placed[i] === i ? "right" : "wrong")); $$(".tile", scr).forEach((t) => (t.disabled = true)); break;
    case "timeline":
      right = s.items.every((x, k) => st.placed[k] === x.slot);
      $$(".tslot", scr).forEach((sl) => { const k = +sl.dataset.slot; const items = Object.entries(st.placed).filter(([, v]) => v === k).map(([i]) => +i); if (items.length) sl.classList.add(items.every((i) => s.items[i].slot === k) ? "right" : "wrong"); });
      $$(".tile", scr).forEach((t) => (t.disabled = true));
      break;
    case "match": right = st.misses === 0; break;
  }
  feedback(right);
}
function answerHTML(s) {
  if (s.answerText) return T(s.answerText);
  switch (s.type) {
    case "mcq": case "odd": case "whoami": case "inline": return T(s.options[s.answer]);
    case "tf": return T(s.answer ? B("True", "শুদ্ধ") : B("False", "অশুদ্ধ"));
    case "order": return s.items.map((x, i) => `${N(i + 1)}. ${T(x)}`).join("<br>");
    case "timeline": return T(B("See the explanation below", "তলৰ ব্যাখ্যা চোৱা"));
  }
  return "";
}
function feedback(right) {
  const it = step(), s = it.s, slips = s.type === "match" && !right;
  let gain = 0;
  if (!it.retry) U.asked++;
  if (right) { if (!it.retry) U.ok++; gain = it.retry ? 5 : s.type === "whoami" ? whoXP() : ["order", "timeline"].includes(s.type) ? 20 : 10; SFX.good(); }
  else { if (slips) gain = 5; SFX.bad(); }
  U.xp += gain;
  // mistakes bank: wrong answers are kept for "Practise your mistakes"; a correct answer clears them
  const b = bank();
  if (right && b.includes(it.ref) && (U.practice || !it.retry)) b.splice(b.indexOf(it.ref), 1);   // the quick retry inside the same unit does not clear it
  if (!right && !b.includes(it.ref)) b.push(it.ref);
  if (!right && !it.retry) { U.mistakes.push({ s }); if (!slips) U.queue.push({ s, ref: it.ref, retry: true }); }
  if (!it.retry) U.done = Math.min(U.total, U.done + 1);
  $("#progress").style.width = `${(U.done / U.total) * 100}%`;
  $("#fb-badge").textContent = right || slips ? "✓" : "✕";
  $("#fb-title").innerHTML = right ? T(PRAISE[Math.floor(Math.random() * PRAISE.length)])
    : slips ? T(B(`All matched, ${U.st.misses} slip${U.st.misses > 1 ? "s" : ""}`, `সকলো মিলিল, ${asNum(U.st.misses)}টা ভুল`)) : T(B("Not quite", "হোৱা নাই"));
  $("#fb-xp").innerHTML = gain ? `+${N(gain)} XP` : "";
  $("#fb-ans").innerHTML = right || slips ? "" : `<small>${T(B("Correct answer", "শুদ্ধ উত্তৰ"))}</small>${answerHTML(s)}`;
  $("#fb-why").innerHTML = T(s.why);
  $("#foot").className = `foot ${right ? "fb-good" : "fb-bad"}`;
  U.phase = "feedback";
  saveAll(); refresh();
  $("#action").focus({ preventScroll: true });
}
function next() {
  if (step().s.type === "story") U.done = Math.min(U.total, U.done + 1);
  U.pos++;
  if (U.pos >= U.queue.length) return finishUnit();
  renderStep(true);
}

/* ---------- unit complete ---------- */
function finishUnit() {
  const u = U.unit, wasDone = !!P.done[u.id];
  if (!U.practice) P.done[u.id] = true;
  G.xp += U.xp;
  AXOM.bumpStreak();
  saveAll();
  SFX.done();
  const secs = Math.round((Date.now() - U.start) / 1000), time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const allDone = ALL.every((x) => P.done[x.id]);
  const promptOf = (s) => s.q || s.s || (s.before ? B(`${s.before.en} ___ ${s.after.en}`, `${s.before.as} ___ ${s.after.as}`) : s.clues ? s.clues[0] : B("", ""));
  const title = U.practice ? B("Practice complete!", "অনুশীলন সম্পূৰ্ণ!") : u === L.test && allDone ? B("Lesson complete!", "পাঠ সম্পূৰ্ণ!") : B("Unit complete!", "অধ্যায় সম্পূৰ্ণ!");
  $("#done").innerHTML = `
    <svg class="done-art" viewBox="0 0 180 150" aria-hidden="true"><path d="M10 40c14 2 20 10 34 13 30 6 62 6 92 0 14-3 20-11 34-13" fill="none" stroke="var(--terra)" stroke-width="5" stroke-linecap="round"/><path d="M30 52v70M150 52v70M22 124h136" stroke="var(--terra)" stroke-width="5" stroke-linecap="round"/><circle cx="90" cy="92" r="30" fill="var(--gold)"/><path d="M76 92l10 10 18-20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h1>${T(title)}</h1>
    <p class="sub">${T(u.title)}${wasDone && !U.practice ? " · " + T(B("practice", "অনুশীলন")) : ""}</p>
    <div class="stats">
      <div class="stat" style="--c:var(--gold)"><div class="h">XP</div><div class="v">+${N(U.xp)}</div></div>
      <div class="stat" style="--c:var(--good)"><div class="h">${T(B("Correct", "শুদ্ধ"))}</div><div class="v">${N(`${U.ok}/${U.asked}`)}</div></div>
      <div class="stat" style="--c:var(--terra)"><div class="h">${T(B("Streak", "ধাৰা"))}</div><div class="v">${N(G.streak.n)}🔥</div></div>
    </div>
    ${U.mistakes.length ? `<div class="card mistakes"><h3>${T(B("Revise these", "এইবোৰ আকৌ চোৱা"))}</h3><ul>${U.mistakes.map((m) => `<li><span class="q">${T(promptOf(m.s))}</span>${answerHTML(m.s)}</li>`).join("")}</ul></div>` : ""}
    ${u.learned && u.learned.length ? `<div class="card learned"><h3>${T(B("You learned", "তুমি শিকিলা"))}</h3><ul>${u.learned.map((l) => `<li>${T(l)}</li>`).join("")}</ul></div>` : ""}
    <p class="sub" style="font-size:13px;margin-top:4px">${T(B(`Time: ${time}`, `সময়: ${asNum(time)}`))}</p>`;
  showView("v-done");
  const c = $("#confetti");
  c.innerHTML = Array.from({ length: 18 }, (_, k) => `<i style="left:${(k * 37) % 100}%;animation-delay:${(k % 9) * 0.12}s"></i>`).join("");
  c.classList.add("on"); setTimeout(() => c.classList.remove("on"), 3200);
}

/* ---------- events ---------- */
function refreshSlotsHint() {
  $$("#screen .tslot").forEach((sl) => { const has = !!sl.querySelector(".tile"); sl.childNodes.forEach((n) => { if (n.nodeType === 1 && !n.classList.contains("tile")) n.style.display = has ? "none" : ""; }); });
}
document.addEventListener("click", (e) => {
  const g = (sel) => e.target.closest(sel);
  let b;
  if (g("#sound")) { G.sound = !G.sound; saveAll(); topStats(); if (G.sound) SFX.tap(); return; }
  if (g("#practise")) return startPractice();
  if ((b = g("[data-node]"))) { const k = +b.dataset.node; pop = pop === k ? null : k; SFX.tap(); return renderPath(); }
  if ((b = g("[data-start]"))) return startUnit(+b.dataset.start);
  if ($("#v-path").classList.contains("on") && pop != null && !g(".pop")) { pop = null; return renderPath(); }
  if (g("#done-btn")) { showView("v-path"); renderPath(); return; }
  if (g("#exit")) return openSheet();
  if (g("[data-link]") && U) { const s0 = step().s; if (s0.link) return openLinkSheet(s0.link); }
  if (g("[data-keep]")) return closeSheet();
  if (g("[data-leave]")) { closeSheet(); showView("v-path"); renderPath(); return; }
  if (!$("#v-play").classList.contains("on") || !U || U.phase !== "answer") return;

  const s = step().s, st = U.st, scr = $("#screen");
  if (g("#more")) { revealClue(s); SFX.tap(); return refresh(); }
  if ((b = g("[data-opt]")) && !b.disabled) {
    st.sel = +b.dataset.opt; $$("[data-opt]", scr).forEach((o) => o.classList.toggle("sel", o === b)); SFX.tap();
    if (s.type === "inline") $("[data-fillchip]", scr).innerHTML = T(s.options[st.sel]);
    return refresh();
  }
  if ((b = g("[data-tf]")) && !b.disabled) { st.sel = b.dataset.tf === "1"; return check(); }
  if ((b = g("[data-chip]")) && !b.disabled) { st.chip = +b.dataset.chip; $$("[data-chip]", scr).forEach((c) => c.classList.toggle("sel", c === b)); $(".as [data-fillchip]", scr).textContent = s.asOptions[st.chip]; SFX.tap(); return refresh(); }
  if ((b = g(".hit"))) { st.place = b.dataset.place; $$(".hit", scr).forEach((h) => h.classList.toggle("sel", h === b)); SFX.tap(); return refresh(); }
  if ((b = g("[data-letter]")) && !b.disabled) {
    const lg = b.dataset.lang, box = b.closest(".word-slots");
    if (box) { const slots = $$(".wslot", box), k = slots.indexOf(b.closest(".wslot")); st[lg].splice(k).forEach((li) => $(`.letters [data-letter="${li}"][data-lang="${lg}"]`, scr).classList.remove("used")); slots.slice(k).forEach((sl) => (sl.innerHTML = "")); }
    else { const slot = $$(`.word-slots[data-lang="${lg}"] .wslot`, scr)[st[lg].length]; if (!slot) return; slot.innerHTML = `<button class="tile" data-letter="${b.dataset.letter}" data-lang="${lg}">${b.textContent}</button>`; b.classList.add("used"); st[lg].push(+b.dataset.letter); }
    SFX.tap(); return refresh();
  }
  if ((b = g("[data-tok]")) && !b.disabled) { st.tok = +b.dataset.tok; $$(".tok", scr).forEach((t) => t.classList.toggle("sel", t === b)); SFX.tap(); return refresh(); }
  if ((b = g("[data-step]")) && !b.disabled) {
    if (b.closest(".bank")) { const slot = $$(".oslot", scr)[st.placed.length]; if (!slot) return; slot.insertAdjacentHTML("beforeend", `<button class="tile" data-step="${b.dataset.step}">${b.innerHTML}</button>`); b.classList.add("used"); st.placed.push(+b.dataset.step); }
    else { const slots = $$(".oslot", scr), k = slots.indexOf(b.closest(".oslot")); st.placed.splice(k).forEach((i) => $(`.bank [data-step="${i}"]`, scr).classList.remove("used")); slots.slice(k).forEach((o) => { const x = o.querySelector(".tile"); if (x) x.remove(); }); }
    SFX.tap(); return refresh();
  }
  if ((b = g("[data-pair]")) && !b.disabled) {
    const side = b.closest(".col").dataset.side;
    $$(`.col[data-side="${side}"] .tile`, scr).forEach((x) => x.classList.toggle("sel", x === b));
    st[side] = b;
    if (st.left && st.right) {
      const Lt = st.left, Rt = st.right; st.left = st.right = null; Lt.classList.remove("sel"); Rt.classList.remove("sel");
      if (Lt.dataset.pair === Rt.dataset.pair) { Lt.classList.add("done"); Rt.classList.add("done"); Lt.disabled = Rt.disabled = true; SFX.pair(); if (++st.matched === s.pairs.length) return check(); }
      else { st.misses++; SFX.bad(); [Lt, Rt].forEach((x) => { x.classList.remove("no"); void x.offsetWidth; x.classList.add("no"); setTimeout(() => x.classList.remove("no"), 450); }); }
    } else SFX.tap();
    return refresh();
  }
  if ((b = g("[data-item]")) && !b.disabled) {
    if (b.closest(".tslot")) { const k = b.dataset.item; delete st.placed[+k]; b.remove(); $(`.tbank [data-item="${k}"]`, scr).classList.remove("used"); refreshSlotsHint(); return refresh(); }
    st.armed = +b.dataset.item; $$(".tbank .tile", scr).forEach((x) => x.classList.toggle("sel", x === b)); $$(".tslot", scr).forEach((sl) => sl.classList.add("armed")); SFX.tap(); return refresh();
  }
  if ((b = g(".tslot")) && st.armed != null) {
    const k = st.armed, src = $(`.tbank [data-item="${k}"]`, scr);
    st.placed[k] = +b.dataset.slot; st.armed = null;
    b.insertAdjacentHTML("beforeend", `<button class="tile" data-item="${k}">${src.innerHTML}</button>`);
    src.classList.remove("sel"); src.classList.add("used"); $$(".tslot", scr).forEach((sl) => sl.classList.remove("armed"));
    refreshSlotsHint(); SFX.tap(); return refresh();
  }
});
$("#action").addEventListener("click", () => { if (U.phase === "feedback" || step().s.type === "story") return next(); if (ready()) check(); });
document.addEventListener("input", (e) => { if (!$("#v-play").classList.contains("on") || step().s.type !== "fill") return; e.target.value = e.target.value.replace(/[^a-zA-Z]/g, ""); refresh(); });
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && $("#v-play").classList.contains("on") && !$("#action").disabled && !$("#sheet-root").innerHTML) { e.preventDefault(); $("#action").click(); } });
langBox.addEventListener("change", () => {
  G.as = isAS(); saveAll();
  if ($("#v-play").classList.contains("on") && U.phase === "answer" && ["fill", "unscramble", "spot"].includes(step().s.type)) renderStep(false);
  else if ($("#v-play").classList.contains("on")) refresh();
});
function openSheet() {
  $("#sheet-root").innerHTML = `<div class="backdrop" data-keep></div><div class="sheet"><h2>${T(B("Leave this unit?", "অধ্যায়টো এৰি যাবা নে?"))}</h2><p>${T(B("Your progress in this unit will be lost.", "এই অধ্যায়ৰ অগ্ৰগতি হেৰাব।"))}</p>
    <button class="btn" data-keep>${T(B("Keep learning", "শিকি থাকোঁ"))}</button><button class="link" data-leave>${T(B("Leave", "এৰি যাওঁ"))}</button></div>`;
}
function closeSheet() { $("#sheet-root").innerHTML = ""; }

if (/[?&]debug\b/.test(location.search)) window.__L = { LESSON: L, run: () => U, render: renderStep, G, P, audioState: AXOM._audioState };   // test hook only
/* ---------- download this lesson for offline use ---------- */
function lessonFiles() {
  const files = new Set([L.portrait]);
  ALL.forEach((u) => u.steps.forEach((s) => { if (s.img) files.add(s.img); if (s.type === "picture") s.options.forEach((o) => files.add(o)); }));
  const urls = [`content/lessons/${L.id}.json`];
  files.forEach((f) => { urls.push(img(f), img(f, 480)); });
  return urls.map((u) => new URL(u, location.href).href);
}
async function setupOffline() {
  const btn = $("#offline");
  if (!("caches" in window)) { btn.remove(); return; }
  const urls = lessonFiles();
  const show = (state, a, b) => {
    btn.disabled = state !== "idle";
    btn.innerHTML = state === "saved" ? `${AXOM.ICON.check}${T(B("Available offline", "অফলাইনত উপলব্ধ"))}`
      : state === "busy" ? `${AXOM.ICON.download}${T(B(`Downloading ${a}/${b}`, `ডাউনলোড হৈছে ${asNum(a)}/${asNum(b)}`))}`
      : `${AXOM.ICON.download}${T(B("Download for offline", "অফলাইনৰ বাবে ডাউনলোড"))}`;
  };
  show((await AXOM.isOffline(urls)) ? "saved" : "idle");
  btn.addEventListener("click", async () => {
    try { show("busy", 0, urls.length); await AXOM.saveOffline(urls, (a, b) => show("busy", a, b)); show("saved"); }
    catch (e) { show("idle"); console.warn(e); }
  });
}

showView("v-path");
renderPath();
setupOffline();
}   // end boot

load();
})();
