#!/usr/bin/env python3
"""Check all lesson content, then write content/manifest.json and stamp sw.js.

Run before every deploy:   python3 scripts/build.py
Stops with a list of problems if a lesson has a mistake (duplicate step id,
missing image, broken link, wrong map choice, missing field...).
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
TYPES = {"story", "mcq", "tf", "inline", "fill", "match", "order", "unscramble", "odd", "picture", "whoami", "spot", "timeline", "map"}
NEED = {"mcq": ["q", "options", "answer", "why"], "tf": ["s", "answer", "why"], "inline": ["before", "after", "options", "answer", "why"],
        "fill": ["before", "after", "answer", "asOptions", "asAnswer", "why"], "match": ["pairs", "why"], "order": ["items", "why"],
        "unscramble": ["q", "word", "why"], "odd": ["q", "options", "answer", "why"], "picture": ["q", "options", "answer", "why"],
        "whoami": ["clues", "options", "answer", "why"], "spot": ["tokens", "wrong", "fix", "why"], "timeline": ["anchors", "items", "why"],
        "map": ["q", "target", "choices", "why"], "story": ["title", "text"]}
errors = []
def err(msg): errors.append(msg)

# ---------- story card standard (see README "Story cards") ----------
CARD_WORDS, PARA_WORDS, MAX_PARAS, MAX_MARKS, TITLE_WORDS = 55, 35, 3, 3, 6
def words(t):
    t = re.sub(r"\[\[[^|\]]+\|([^\]]+)\]\]", r"\1", t); t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)
    return len(re.sub(r"<[^>]+>", " ", t).split())
def story_rules(s, where):
    ps = [words(p["en"]) for p in s.get("text", [])]
    if not ps: return err(f"{where}: story has no text")
    if len(ps) > MAX_PARAS: err(f"{where}: {len(ps)} paragraphs (max {MAX_PARAS})")
    if max(ps) > PARA_WORDS: err(f"{where}: a paragraph has {max(ps)} words (max {PARA_WORDS})")
    if sum(ps) > CARD_WORDS: err(f"{where}: card has {sum(ps)} words (max {CARD_WORDS})")
    for lang in ("en", "as"):
        m = sum(p[lang].count("<mark>") for p in s["text"])
        if m > MAX_MARKS: err(f"{where}: {m} highlights in {lang} (max {MAX_MARKS}; use <b> for lists and memory letters)")
    if words(s["title"]["en"]) > TITLE_WORDS: err(f"{where}: title longer than {TITLE_WORDS} words")

# Make the small @480 copy of every image that does not have one yet.
try:
    from PIL import Image
    for dp, _, fs in os.walk("content/media"):
        for f in fs:
            if f.endswith(".webp") and "@480" not in f and not dp.endswith("faces"):
                small = os.path.join(dp, f.replace(".webp", "@480.webp"))
                if not os.path.exists(small):
                    im = Image.open(os.path.join(dp, f)).convert("RGB"); im.thumbnail((480, 480)); im.save(small, "WEBP", quality=68)
                    print("made", small)
except ImportError:
    print("note: Pillow not installed, so @480 copies are not created automatically (pip install pillow)")

def bilingual(v, where):
    if isinstance(v, dict) and set(v) >= {"en", "as"}:
        if not v["en"] or not v["as"]: err(f"{where}: empty English or Assamese text")
    elif isinstance(v, list): [bilingual(x, where) for x in v]

lessons = {}
for f in sorted(os.listdir("content/lessons")):
    if f.endswith(".json"):
        L = json.load(open(f"content/lessons/{f}", encoding="utf-8"))
        if L.get("id") + ".json" != f: err(f"{f}: id '{L.get('id')}' must match the file name")
        lessons[L["id"]] = L

all_ids = {}
for lid, L in lessons.items():
    for k in ("no", "version", "king", "reign", "portrait", "sources", "map", "units", "test"):
        if k not in L: err(f"{lid}: missing '{k}'")
    if not L.get("sources"): err(f"{lid}: list at least one source (title, url, used_for)")
    mdir = f"content/media/{lid}"
    def need_img(name, where):
        folder = "content/media" if name.startswith("shared/") else mdir
        for n in (name, name.replace(".webp", "@480.webp")):
            if not os.path.exists(f"{folder}/{n}"): err(f"{where}: missing image {folder}/{n}")
    need_img(L["portrait"], f"{lid} portrait")
    units = L["units"] + [L["test"]]
    unit_ids = {u["id"] for u in units}
    for u in units:
        for s in u["steps"]:
            where = f"{lid}/{u['id']}/{s.get('id', '?')}"
            sid = s.get("id")
            if not sid: err(f"{where}: step has no id"); continue
            if sid in all_ids: err(f"{where}: duplicate step id (also in {all_ids[sid]})")
            all_ids[sid] = lid
            if s["type"] not in TYPES: err(f"{where}: unknown type {s['type']}")
            for k in NEED.get(s["type"], []):
                if k not in s: err(f"{where}: '{s['type']}' needs '{k}'")
            if s["type"] == "story" and not (s.get("img") or s.get("map") or s.get("art")): err(f"{where}: story needs img, map or art")
            if s["type"] == "story": story_rules(s, f"{where}/{sid}")
            if s.get("img"): need_img(s["img"], where)
            if s["type"] == "picture": [need_img(o, where) for o in s["options"]]
            if s["type"] == "map" and s["target"] not in s["choices"]: err(f"{where}: map target must be one of the choices")
            if "answer" in s and isinstance(s["answer"], int) and "options" in s and not 0 <= s["answer"] < len(s["options"]): err(f"{where}: answer index out of range")
            link = s.get("link")
            if link:
                if link.get("lessonId"):
                    if link["lessonId"] not in lessons: err(f"{where}: link to unknown lesson '{link['lessonId']}'")
                elif link.get("unit") not in unit_ids: err(f"{where}: link to unknown unit '{link.get('unit')}'")
            for k in ("q", "s", "why", "title", "before", "after", "text", "options", "clues", "items"):
                if k in s: bilingual(s[k], where)
    if L.get("buildsOn") and L["buildsOn"]["id"] not in lessons: err(f"{lid}: buildsOn unknown lesson")

# shared names list, base map, question bank
ENT = json.load(open("content/entities.json", encoding="utf-8"))
BASE = json.load(open("content/maps/assam.json", encoding="utf-8"))
base_ids = set(BASE.get("rivers", {})) | set(BASE.get("ridges", {}))
for eid, e in ENT.items():
    for k in ("type", "name", "meaning"):
        if k not in e: err(f"entities: '{eid}' needs '{k}'")
    bilingual(e.get("name"), f"entities/{eid}"); bilingual(e.get("meaning"), f"entities/{eid}")
for lid, L in lessons.items():
    for m in re.finditer(r"\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]", json.dumps(L, ensure_ascii=False)):
        if m.group(1) not in ENT: err(f"{lid}: [[{m.group(1)}]] is not in content/entities.json")
    mp = L["map"]
    for k in ("box", "show"):
        if k not in mp: err(f"{lid}: map needs '{k}'")
    for i in mp.get("show", []):
        if i not in base_ids and not (i in ENT and ENT[i].get("geo")): err(f"{lid}: map shows '{i}' but it is neither in the base map nor an entity with geo")
    for rt in mp.get("routes", []):
        for ref in rt:
            if isinstance(ref, str) and not (ref in ENT and ENT[ref].get("geo")): err(f"{lid}: route point '{ref}' has no geo")
    for u in L["units"] + [L["test"]]:
        for s in u["steps"]:
            if s["type"] == "map":
                for c in s["choices"]:
                    if c not in mp.get("show", []): err(f"{lid}/{s['id']}: map choice '{c}' is not shown on the lesson map")
bank = json.load(open("content/questions/ahom.json", encoding="utf-8"))
for q in bank["questions"]:
    if q["id"] in all_ids: err(f"bank: duplicate id {q['id']}")
    all_ids[q["id"]] = "bank"
    for k in ("era", "lesson", "q", "options", "answer", "why"):
        if k not in q: err(f"bank/{q['id']}: missing '{k}'")
    if q.get("lesson") not in lessons: err(f"bank/{q['id']}: unknown lesson '{q.get('lesson')}'")
    if not 0 <= q.get("answer", -1) < len(q.get("options", [])): err(f"bank/{q['id']}: answer out of range")

course = json.load(open("content/courses/ahom-kings.json", encoding="utf-8"))
era_ids = {e["id"] for e in course["eras"]}
for q in bank["questions"]:
    if q.get("era") not in era_ids: err(f"bank/{q['id']}: unknown era '{q.get('era')}'")
for k in course["kings"]:
    if k.get("tier") not in ("A", "B", "C"): err(f"course: king {k['n']} needs tier A, B or C")
for k in course["kings"]:
    if not os.path.exists(f"content/media/{k['face']}"): err(f"course: missing face content/media/{k['face']}")
    if k.get("lesson") and k["lesson"] not in lessons: err(f"course: king {k['n']} points to missing lesson {k['lesson']}")

if errors:
    print(f"build: {len(errors)} problem(s):"); [print("  -", e) for e in errors]; sys.exit(1)

h = hashlib.sha1()
for d in ("app", "content", "icons"):
    for dp, _, fs in sorted(os.walk(d)):
        for f in sorted(fs):
            if f == "manifest.json" and dp == "content": continue
            h.update(open(os.path.join(dp, f), "rb").read())
for f in ("index.html", "lesson.html", "manifest.webmanifest", "_headers"): h.update(open(f, "rb").read())
h.update(re.sub(r'const VERSION = "[^"]*";', "", open("sw.js", encoding="utf-8").read()).encode())   # the worker itself, minus its version line
version = h.hexdigest()[:10]

manifest = {"version": version, "courses": [{"id": course["id"], "file": "content/courses/ahom-kings.json"}],
            "lessons": {lid: {"no": L["no"], "version": L["version"], "steps": len(L["units"]) + 1, "title": L["king"],
                              # unit summaries, so a lesson page can draw the whole course path without loading every lesson
                              "units": [{"id": u["id"], "t": u["title"], "i": u.get("icon", "trophy"), "ex": sum(s["type"] != "story" for s in u["steps"])}
                                        for u in L["units"] + [L["test"]]]} for lid, L in lessons.items()}}
json.dump(manifest, open("content/manifest.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
sw = open("sw.js", encoding="utf-8").read()
sw = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{version}";', sw, count=1)
open("sw.js", "w", encoding="utf-8").write(sw)
print(f"build ok: {len(lessons)} lessons, {len(all_ids)} steps, version {version}")
