/* =========================================================
   Course home: Lessons (eras, checkpoints, daily review), dynasty Timeline,
   Family (succession), and Profile (stats, activity, weak lessons).
   Reads content/courses/ahom-kings.json and content/manifest.json.
   ========================================================= */
(() => {
"use strict";
const { B, T, N, asNum, G, ICON } = window.AXOM;
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const UNLOCK_ALL = params.has("all");
const UI = Object.assign({ tab: "lessons", open: {} }, AXOM.store.get("axom:ui", {}));
const saveUI = () => AXOM.store.set("axom:ui", UI);
const ROOF = '<svg class="roof" viewBox="0 0 320 26" preserveAspectRatio="none"><path d="M0 4c22 2 30 10 52 13 44 6 172 6 216 0 22-3 30-11 52-13" fill="none" stroke="#fff" stroke-width="2"/><path d="M60 17v7M100 19v6M140 20v5M180 20v5M220 19v6M260 17v7" stroke="#fff" stroke-width="1.6"/></svg>';
const STAR = { A: "★★★", B: "★★", C: "★" };
const TABS = [["lessons", B("Lessons", "পাঠ")], ["timeline", B("Timeline", "সময়ৰেখা")], ["family", B("Family", "বংশ")], ["profile", B("Profile", "প্ৰফাইল")]];

document.body.insertAdjacentHTML("afterbegin", `
<input type="checkbox" id="as" aria-label="Show in Assamese">
<div class="stage"><div class="device home-page">
  <div class="view on" id="v-home">
    <div class="p-top">
      <label class="lang" for="as"><span class="en">অ</span><span class="as">EN</span></label>
      <button class="chip-top hidden" id="install">${ICON.download}${T(B("Install", "ইনষ্টল"))}</button>
      <span class="spacer"></span>
      <span class="fire" id="fire"></span>
      <span class="gem" id="gem"></span>
      <button class="icon-btn hidden" id="account" aria-label="Account"></button>
      <button class="icon-btn" id="settings" aria-label="Settings">${ICON.gear}</button>
    </div>
    <div class="p-scroll" id="scroll"><div id="course"></div></div>
    <a class="continue-bar hidden" id="continue"></a>
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
const years = (reign) => { const m = String(reign).match(/\d{4}/g) || []; return [+m[0], +(m[1] || m[0])]; };

let course, info;
async function render() {
  if (!course) [course, info] = await Promise.all([AXOM.getJSON("content/courses/ahom-kings.json"), AXOM.getJSON("content/manifest.json").then((m) => m.lessons)]);
  const byNo = Object.fromEntries(course.kings.filter((k) => k.lesson && info[k.lesson]).map((k) => [k.n, k.lesson]));
  const doneTest = (id) => !!AXOM.getLesson(id).done.test;
  const status = (k) => {
    const id = byNo[k.n];
    if (!id) return { s: "soon" };
    const done = Object.keys(AXOM.getLesson(id).done).length, steps = info[id].steps;
    if (doneTest(id)) return { s: "done", id, done, steps };
    const prevIds = Object.keys(byNo).map(Number).filter((n) => n < k.n);
    const prev = prevIds.length ? byNo[Math.max(...prevIds)] : null;
    return { s: UNLOCK_ALL || !prev || doneTest(prev) ? "open" : "locked", id, done, steps };
  };
  const tabs = `<div class="tabs home-tabs" role="tablist">${TABS.map(([k, t]) => `<button class="tab ${UI.tab === k ? "on" : ""}" data-tab="${k}">${T(t)}</button>`).join("")}</div>`;
  const hero = `<section class="c-hero">${ROOF}<div class="eyebrow">${T(course.eyebrow)}</div><h1>${T(course.title)}</h1><p>${T(course.subtitle)}</p></section>`;
  const body = { lessons: lessonsTab, timeline: timelineTab, family: familyTab, profile: profileTab }[UI.tab](status, byNo);
  $("#course").innerHTML = hero + tabs + body + `<div class="p-foot">${T(B("Bilingual · English / অসমীয়া · Written and checked by people, no AI content. Portraits are artistic reconstructions.", "দ্বিভাষিক · English / অসমীয়া · মানুহে লিখা আৰু পৰীক্ষা কৰা, AI বিষয়বস্তু নাই। প্ৰতিকৃতিবোৰ শিল্পীৰ কল্পনা।"))}</div>`;
  // sticky Continue: the next open lesson that is not finished
  const next = course.kings.map((k) => ({ k, st: status(k) })).find((x) => x.st.s === "open");
  const c = $("#continue");
  if (next && UI.tab === "lessons") { c.href = `lesson.html?id=${next.st.id}`; c.innerHTML = `<span>${T(B("Continue", "আগবাঢ়া"))}</span><b>${T(B(`Lesson ${next.k.n} · ${next.k.name.en.split(" (")[0]}`, `পাঠ ${asNum(next.k.n)} · ${next.k.name.as}`))}</b>`; c.classList.remove("hidden"); }
  else c.classList.add("hidden");
}

/* ---------- Lessons tab ---------- */
function lessonsTab(status) {
  const due = AXOM.reviewQueue().length;
  const review = due ? `<a class="review-card" href="lesson.html?review=1"><span class="ic">${ICON.repeat}</span><span><b>${T(B("Daily review", "দৈনিক পুনৰীক্ষণ"))}</b><span class="s">${T(B(`${due} question${due > 1 ? "s" : ""} due · keeps facts fresh for the exam`, `${asNum(due)}টা প্ৰশ্ন বাকী · পৰীক্ষাৰ বাবে তথ্য সতেজ ৰাখে`))}</span></span><span class="go">›</span></a>` : "";
  const curEra = (course.eras.find((e) => course.kings.some((k) => k.n >= e.from && k.n <= e.to && status(k).s === "open")) || course.eras[0]).id;
  return review + course.eras.map((e) => {
    const kings = course.kings.filter((k) => k.n >= e.from && k.n <= e.to);
    const sts = kings.map(status), avail = sts.filter((x) => x.s !== "soon"), done = sts.filter((x) => x.s === "done").length;
    const open = UI.open[e.id] ?? e.id === curEra;
    const cpDone = !!G.checkpoints[e.id], cpOpen = avail.length && avail.every((x) => x.s === "done");
    const checkpoint = avail.length ? `<div class="cp-card ${cpDone ? "done" : cpOpen ? "open" : ""}">
        <span class="ic">${cpDone ? ICON.check : "🏁"}</span>
        <span><b>${T(B("Era checkpoint", "যুগৰ পৰীক্ষা"))}</b><span class="s">${cpDone ? T(B("Passed", "উত্তীৰ্ণ")) : cpOpen ? T(B("15 exam-style questions · pass mark 80%", "পৰীক্ষাৰ ধৰণৰ ১৫টা প্ৰশ্ন · উত্তীৰ্ণ নম্বৰ ৮০%")) : T(B("Opens when this era's lessons are done", "এই যুগৰ পাঠবোৰ শেষ হ'লে খোল খাব"))}</span></span>
        ${cpOpen || cpDone ? `<a class="cp-go" href="lesson.html?checkpoint=${e.id}">${cpDone ? T(B("Retake", "আকৌ")) : T(B("Start", "আৰম্ভ"))}</a>` : `<a class="cp-skip" href="lesson.html?checkpoint=${e.id}&testout=1">${T(B("Test out", "পৰীক্ষা দি আগবাঢ়া"))}</a>`}
      </div>` : "";
    return `<section class="era-sec ${open ? "open" : ""}">
      <button class="era-head" data-era="${e.id}"><span class="t">${T(e.title)}</span><span class="p">${T(B(`${done}/${kings.length} lessons`, `${asNum(kings.length)}টাৰ ${asNum(done)}টা পাঠ`))}</span><span class="chev">${ICON.chevron}</span>
        <span class="era-bar"><i style="width:${(done / kings.length) * 100}%"></i></span></button>
      <div class="kings">${open ? kings.map((k, i) => card(k, sts[i])).join("") + checkpoint : ""}</div>
    </section>`;
  }).join("");
}
const LABEL = { done: B("Review", "পুনৰীক্ষণ"), open: B("Start", "আৰম্ভ"), locked: B("Jump here", "ইয়ালৈ জঁপিওৱা"), soon: B("Soon", "সোনকালে") };
function card(k, st) {
  const started = st.s === "open" && st.done > 0, miss = st.id ? (G.mistakes[st.id] || []).length : 0;
  // a locked lesson can be reached by passing a test on the lessons before it
  const href = st.s === "open" || st.s === "done" ? `lesson.html?id=${st.id}` : st.s === "locked" ? `lesson.html?jump=${st.id}` : "", tag = href ? "a" : "div";
  return `<${tag} class="king ${st.s} tier-${k.tier}" ${href ? `href="${href}"` : `data-why="${st.s}"`}>
    <span class="face"><img src="${AXOM.media(k.face)}" alt="" loading="lazy"></span><span class="n">${N(k.n)}</span>
    <span class="who"><b>${T(k.name)}</b><span class="sub2">${N(k.reign)} · <span class="stars" title="Exam importance">${STAR[k.tier]}</span></span>
      ${started ? `<span class="bar2"><i style="width:${(st.done / st.steps) * 100}%"></i></span>` : ""}</span>
    <span class="state">${started ? T(B("Continue", "আগবাঢ়া")) : T(LABEL[st.s])}</span>
    ${miss ? `<span class="badge">${T(B(`${miss} to revise`, `${asNum(miss)}টা ভুল`))}</span>` : ""}
  </${tag}>`;
}

/* ---------- Timeline tab: every reign as a bar ---------- */
function timelineTab(status) {
  const spans = course.kings.map((k) => [k, ...years(k.reign)]);
  const longest = Math.max(...spans.map(([, a, b]) => b - a || 1));
  let prevEnd = null, html = "";
  course.eras.forEach((e) => {
    html += `<div class="era">${T(e.title)}</div><div class="tl-list">`;
    spans.filter(([k]) => k.n >= e.from && k.n <= e.to).forEach(([k, a, b]) => {
      if (prevEnd && a > prevEnd) html += `<div class="tl-gap">${T(B(`${prevEnd}–${a} · no king (interregnum)`, `${asNum(prevEnd)}–${asNum(a)} · ৰজা নাছিল`))}</div>`;
      prevEnd = Math.max(prevEnd || 0, b);
      const st = status(k), link = st.s === "open" || st.s === "done", tag = link ? "a" : "div";
      html += `<${tag} class="tl-row tier-${k.tier}" ${link ? `href="lesson.html?id=${st.id}"` : ""}><span class="y">${N(a)}</span><span class="nm">${T(k.name)}</span>
        <span class="tl-bar"><i style="width:${Math.max(3, ((b - a || 1) / longest) * 100)}%"></i></span><span class="len">${N(b - a || 1)}${T(B("y", "ব"))}</span></${tag}>`;
    });
    html += `</div>`;
  });
  return `<p class="tab-intro">${T(B("Bar length shows how long each king ruled. Gaps mark periods with no king.", "দণ্ডৰ দৈৰ্ঘ্যই ৰাজত্বকালৰ দৈৰ্ঘ্য দেখুৱায়। খালী ঠাইবোৰ ৰজা নথকা সময়।"))}</p>` + html;
}

/* ---------- Family tab: succession and relations ---------- */
function familyTab() {
  const byId = Object.fromEntries(course.kings.map((k) => [k.id, k]));
  let prev = null;
  const rows = course.kings.map((k) => {
    const r = k.rel || {}, linked = prev && r.of === prev.id && (r.type === "son" || r.type === "brother");
    const line = !prev ? "" : linked ? (r.type === "son" ? "son" : "brother") : "break";
    prev = k;
    return `<div class="fam-row ${line}"><span class="fam-face"><img src="${AXOM.media(k.face)}" alt="" loading="lazy"></span>
      <span class="fam-txt"><b>${N(k.n)}. ${T(k.name)}</b><span class="rel rel-${r.type || "other"}">${T(r.t || B("", ""))}</span></span></div>`;
  }).join("");
  return `<p class="tab-intro">${T(B("A solid line: son of the king above. A dashed line: brother. A gap: the throne passed outside the direct line.", "সৰল ৰেখা: ওপৰৰ ৰজাৰ পুত্ৰ। ডেচ ৰেখা: ভাই। খালী: সিংহাসন পোনপটীয়া বংশৰ বাহিৰলৈ গ'ল।"))}</p><div class="fam">${rows}</div>
    <p class="tab-intro small">${T(B("Relations follow the AHOM project catalogue; some early details differ between chronicles.", "সম্পৰ্কবোৰ AHOM প্ৰকল্পৰ তালিকা অনুসৰি; আগৰ কিছুমান তথ্য বুৰঞ্জী অনুসৰি বেলেগ।"))}</p>`;
}

/* ---------- Profile tab ---------- */
function profileTab(status, byNo) {
  const lessonIds = Object.values(byNo);
  const finished = lessonIds.filter((id) => AXOM.getLesson(id).done.test).length;
  const tot = Object.values(G.stats).reduce((a, s) => ({ a: a.a + s.a, o: a.o + s.o }), { a: 0, o: 0 });
  const acc = tot.a ? Math.round((tot.o / tot.a) * 100) : 0;
  const days = [...Array(35).keys()].reverse().map((i) => AXOM.iso(-i));
  const cal = days.map((d) => { const xp = G.days[d] || 0; return `<i class="${xp ? (xp >= 60 ? "l3" : xp >= 30 ? "l2" : "l1") : ""}" title="${d}: ${xp} XP"></i>`; }).join("");
  const nameOf = (id) => (course.kings.find((k) => k.lesson === id) || { name: B(id, id) }).name;
  const perLesson = Object.entries(G.stats).filter(([id]) => info[id]).map(([id, s]) => ({ id, pct: Math.round((s.o / s.a) * 100), a: s.a })).sort((x, y) => x.pct - y.pct);
  const weak = perLesson.filter((x) => x.a >= 5 && x.pct < 80).slice(0, 3);
  const user = AXOM.auth.user;
  return `<div class="pf-stats">
      <div class="stat" style="--c:var(--gold)"><div class="h">XP</div><div class="v">${N(G.xp)}</div></div>
      <div class="stat" style="--c:var(--terra)"><div class="h">${T(B("Streak", "ধাৰা"))}</div><div class="v">${N(AXOM.streakNow())}🔥</div></div>
      <div class="stat" style="--c:var(--good)"><div class="h">${T(B("Accuracy", "শুদ্ধতা"))}</div><div class="v">${tot.a ? N(acc) + "%" : "–"}</div></div>
    </div>
    <div class="card"><h3>${T(B("Lessons finished", "সম্পূৰ্ণ পাঠ"))}</h3><p class="big-num">${N(finished)} <span>/ ${N(course.kings.length)}</span></p></div>
    <div class="card"><h3>${T(B("Last 5 weeks", "শেহতীয়া ৫ সপ্তাহ"))}</h3><div class="cal">${cal}</div></div>
    ${perLesson.length ? `<div class="card"><h3>${T(B("Accuracy by lesson", "পাঠ অনুসৰি শুদ্ধতা"))}</h3>${perLesson.map((x) => `<a class="acc-row" href="lesson.html?id=${x.id}"><span>${T(nameOf(x.id))}</span><span class="acc-bar"><i style="width:${x.pct}%" class="${x.pct < 60 ? "low" : x.pct < 80 ? "mid" : ""}"></i></span><b>${N(x.pct)}%</b></a>`).join("")}</div>` : ""}
    ${weak.length ? `<div class="card"><h3>${T(B("Revise next", "পিছত পুনৰ চোৱা"))}</h3>${weak.map((x) => `<a class="acc-row" href="lesson.html?id=${x.id}"><span>${T(nameOf(x.id))}</span><span class="note">${N(x.pct)}%</span><b>›</b></a>`).join("")}</div>` : ""}
    <div class="card"><h3>${T(B("Account", "একাউণ্ট"))}</h3><p class="note">${user ? T(B(`Signed in as ${user.name || "you"}. Progress syncs across devices.`, `${user.name || "তুমি"} হিচাপে চাইন ইন। অগ্ৰগতি সকলো ডিভাইচত মিলে।`)) : T(B("Not signed in. Progress is saved on this device only.", "চাইন ইন কৰা নাই। অগ্ৰগতি কেৱল এই ডিভাইচত সাঁচি থোৱা হয়।"))}</p></div>`;
}

/* ---------- events ---------- */
document.addEventListener("click", (e) => {
  let b;
  if ((b = e.target.closest("[data-tab]"))) { UI.tab = b.dataset.tab; saveUI(); render(); $("#scroll").scrollTop = 0; return; }
  if ((b = e.target.closest("[data-era]"))) { const id = b.dataset.era, sec = b.closest(".era-sec"); UI.open[id] = !sec.classList.contains("open"); saveUI(); render(); return; }
  if (e.target.closest("#settings")) return AXOM.openSettings(settingsExtra());
  if (e.target.closest("[data-why]")) toast(T(B("This lesson is being written", "এই পাঠটো লিখি থকা হৈছে")));
  if (e.target.closest("[data-close]")) $("#sheet-root").innerHTML = "";
  if (e.target.closest("#reset")) {
    if (!confirm("Reset all progress on this device?")) return;
    Object.keys(localStorage).filter((k) => k.startsWith("axom:")).forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
});
function settingsExtra() {
  return `<div class="setting"><span>${T(B("Progress", "অগ্ৰগতি"))}</span><button class="link danger" id="reset">${T(B("Reset on this device", "এই ডিভাইচত মচা"))}</button></div>`;
}
$("#as").addEventListener("change", () => render());
AXOM.onSave(() => stats());

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
        <p class="note">${T(B("Your progress, XP, streak, reviews and mistakes are saved to your account and sync across devices.", "তোমাৰ অগ্ৰগতি, XP, ধাৰা, পুনৰীক্ষণ আৰু ভুলবোৰ একাউণ্টত সাঁচি থোৱা হয় আৰু সকলো ডিভাইচত মিলে।"))}</p>
        <button class="btn" id="signout">${T(B("Sign out", "চাইন আউট"))}</button><button class="link" data-close>${T(B("Close", "বন্ধ কৰা"))}</button></div>`;
      $("#signout").onclick = async () => { await auth.signOut(); $("#sheet-root").innerHTML = ""; toast(T(B("Signed out", "চাইন আউট হ'ল"))); };
    } else {
      try { await auth.signIn(); toast(T(B("Signed in. Progress will sync.", "চাইন ইন হ'ল। অগ্ৰগতি মিলাই থোৱা হ'ব।"))); }
      catch (err) { toast(T(B("Sign-in did not finish", "চাইন ইন সম্পূৰ্ণ নহ'ল"))); console.warn(err); }
    }
  });
}

/* When a new app version takes over, reload the course home once so it shows the update.
   (Lesson pages never reload by themselves, so a unit in progress is never lost.) */
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

stats();
render().catch((e) => { $("#course").innerHTML = `<div class="load-error"><h2>${T(B("Could not load the course", "পাঠ্যক্ৰম খুলিব পৰা নগ'ল"))}</h2><p>${T(B("Check your internet connection and try again.", "ইণ্টাৰনেট সংযোগ পৰীক্ষা কৰি আকৌ চেষ্টা কৰা।"))}</p></div>`; console.warn(e); });
})();
