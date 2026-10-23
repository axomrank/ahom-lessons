/* =========================================================
   Course home: all kings of a course, with lesson status.
   Reads content/courses/<course>.json and content/manifest.json.
   ========================================================= */
(() => {
"use strict";
const { B, T, N, asNum, G, ICON } = window.AXOM;
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const UNLOCK_ALL = params.has("all");
const ROOF = '<svg class="roof" viewBox="0 0 320 26" preserveAspectRatio="none"><path d="M0 4c22 2 30 10 52 13 44 6 172 6 216 0 22-3 30-11 52-13" fill="none" stroke="#fff" stroke-width="2"/><path d="M60 17v7M100 19v6M140 20v5M180 20v5M220 19v6M260 17v7" stroke="#fff" stroke-width="1.6"/></svg>';

document.body.insertAdjacentHTML("afterbegin", `
<input type="checkbox" id="as" aria-label="Show in Assamese">
<div class="stage"><div class="device">
  <div class="view on" id="v-home">
    <div class="p-top">
      <label class="lang" for="as"><span class="en">অ</span><span class="as">EN</span></label>
      <button class="chip-top hidden" id="install">${ICON.download}${T(B("Install app", "এপ ইনষ্টল"))}</button>
      <span class="spacer"></span>
      <span class="fire" id="fire"></span>
      <span class="gem" id="gem"></span>
      <button class="icon-btn hidden" id="account" aria-label="Account"></button>
    </div>
    <div class="p-scroll"><div id="course"></div></div>
  </div>
  <div class="toast" id="toast"></div>
  <div id="sheet-root"></div>
</div></div>`);
AXOM.initLang();

function toast(html) { const t = $("#toast"); t.innerHTML = html; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200); }
function stats() {
  const s = AXOM.streakNow();
  $("#fire").innerHTML = ICON.fire + N(s); $("#fire").classList.toggle("on", s > 0);
  $("#gem").innerHTML = ICON.gem + N(G.xp);
}

async function render() {
  const [course, manifest] = await Promise.all([AXOM.getJSON("content/courses/ahom-kings.json"), AXOM.getJSON("content/manifest.json")]);
  const info = manifest.lessons;
  const doneTest = (id) => !!AXOM.getLesson(id).done.test;
  const byNo = Object.fromEntries(course.kings.filter((k) => k.lesson && info[k.lesson]).map((k) => [k.n, k.lesson]));
  function status(k) {
    const id = byNo[k.n];
    if (!id) return { s: "soon" };
    const done = Object.keys(AXOM.getLesson(id).done).length, steps = info[id].steps;
    if (doneTest(id)) return { s: "done", id, done, steps };
    const prev = byNo[k.n - 1];
    const open = UNLOCK_ALL || k.n === 1 || (prev && doneTest(prev));
    return { s: open ? "open" : "locked", id, done, steps };
  }
  const LABEL = { done: B("Review", "পুনৰীক্ষণ"), open: B("Start", "আৰম্ভ"), locked: B("Locked", "বন্ধ"), soon: B("Soon", "সোনকালে") };
  const card = (k) => {
    const st = status(k), started = st.s === "open" && st.done > 0;
    const miss = st.id ? (G.mistakes[st.id] || []).length : 0;
    const link = st.s === "open" || st.s === "done";
    const tag = link ? "a" : "div";
    return `<${tag} class="king ${st.s}" ${link ? `href="lesson.html?id=${st.id}"` : `data-why="${st.s}"`}>
      <span class="face"><img src="${AXOM.media(k.face)}" alt="" loading="lazy"></span><span class="n">${N(k.n)}</span>
      <span class="who"><b>${T(k.name)}</b><span class="sub2">${N(k.reign)}${k.alt ? ` · ${k.alt}` : ""}</span>
        ${started ? `<span class="bar2"><i style="width:${(st.done / st.steps) * 100}%"></i></span>` : ""}</span>
      <span class="state">${started ? T(B("Continue", "আগবাঢ়া")) : T(LABEL[st.s])}</span>
      ${miss ? `<span class="badge">${T(B(`${miss} to revise`, `${asNum(miss)}টা ভুল`))}</span>` : ""}
    </${tag}>`;
  };
  $("#course").innerHTML = `
    <section class="c-hero">${ROOF}
      <div class="eyebrow">${T(course.eyebrow)}</div><h1>${T(course.title)}</h1><p>${T(course.subtitle)}</p>
    </section>
    ${course.eras.map((e) => `<div class="era">${T(e.title)}</div><div class="kings">${course.kings.filter((k) => k.n >= e.from && k.n <= e.to).map(card).join("")}</div>`).join("")}
    <div class="p-foot">${T(B("Bilingual · English / অসমীয়া · Written and checked by people, no AI content. Portraits are artistic reconstructions.", "দ্বিভাষিক · English / অসমীয়া · মানুহে লিখা আৰু পৰীক্ষা কৰা, AI বিষয়বস্তু নাই। প্ৰতিকৃতিবোৰ শিল্পীৰ কল্পনা।"))}</div>`;
}

document.addEventListener("click", (e) => {
  const k = e.target.closest("[data-why]");
  if (k) toast(k.dataset.why === "locked" ? T(B("Finish the lesson before this one first", "আগৰ পাঠটো আগতে শেষ কৰা")) : T(B("This lesson is being written", "এই পাঠটো লিখি থকা হৈছে")));
  if (e.target.closest("[data-close]")) $("#sheet-root").innerHTML = "";
});

/* ---------- install the web app (Android/desktop Chrome, Edge) ---------- */
let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvent = e; $("#install").classList.remove("hidden"); });
$("#install").addEventListener("click", async () => { if (!installEvent) return; installEvent.prompt(); await installEvent.userChoice; installEvent = null; $("#install").classList.add("hidden"); });

/* ---------- account (only when Firebase is configured in app/config.js) ---------- */
const auth = AXOM.auth;
function accountButton(user) {
  const b = $("#account");
  b.classList.remove("hidden");
  b.innerHTML = user && user.photo ? `<img class="avatar" src="${user.photo}" alt="">` : ICON.user;
  b.classList.toggle("signed-in", !!user);
}
if ((window.AXOM_CONFIG || {}).firebase) {
  accountButton(null);
  auth.onChange.push((user) => { accountButton(user); stats(); render(); });
  $("#account").addEventListener("click", async () => {
    if (!auth.signIn) return toast(T(B("Connecting…", "সংযোগ হৈ আছে…")));
    if (auth.user) {
      $("#sheet-root").innerHTML = `<div class="backdrop" data-close></div><div class="sheet left"><div class="grab"></div><h2>${auth.user.name || T(B("Signed in", "চাইন ইন কৰা হৈছে"))}</h2>
        <p class="note">${T(B("Your progress, XP, streak and mistakes are saved to your account and sync across devices.", "তোমাৰ অগ্ৰগতি, XP, ধাৰা আৰু ভুলবোৰ একাউণ্টত সাঁচি থোৱা হয় আৰু সকলো ডিভাইচত মিলে।"))}</p>
        <button class="btn" id="signout">${T(B("Sign out", "চাইন আউট"))}</button><button class="link" data-close>${T(B("Close", "বন্ধ কৰা"))}</button></div>`;
      $("#signout").onclick = async () => { await auth.signOut(); $("#sheet-root").innerHTML = ""; toast(T(B("Signed out", "চাইন আউট হ'ল"))); };
    } else {
      try { await auth.signIn(); toast(T(B("Signed in. Progress will sync.", "চাইন ইন হ'ল। অগ্ৰগতি মিলাই থোৱা হ'ব।"))); }
      catch (err) { toast(T(B("Sign-in did not finish", "চাইন ইন সম্পূৰ্ণ নহ'ল"))); console.warn(err); }
    }
  });
}

stats();
render().catch((e) => { $("#course").innerHTML = `<div class="load-error"><h2>${T(B("Could not load the course", "পাঠ্যক্ৰম খুলিব পৰা নগ'ল"))}</h2><p>${T(B("Check your internet connection and try again.", "ইণ্টাৰনেট সংযোগ পৰীক্ষা কৰি আকৌ চেষ্টা কৰা।"))}</p></div>`; console.warn(e); });
})();
