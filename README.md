# Ahom Kings · learn Assam's history one reign at a time

Short, game-like lessons on the Ahom kingdom (1228–1838) for students preparing for ADRE, Assam TET, APSC and Assam Police SI. One lesson per Swargadeo, split into short units, in English and Assamese. It works offline and can be installed from the browser.

**Live:** https://ahom-lessons.pages.dev (also https://axomrank.github.io/ahom-lessons/)

## Layout

```
index.html               course home (all 41 kings)
lesson.html              lesson player: ?id=sukaphaa · ?review=1 (daily review) · ?checkpoint=<era>[&testout=1] · ?jump=<lesson>
sw.js                    offline support (version stamped by scripts/build.py)
manifest.webmanifest     install as an app
app/
  config.js              the only file to edit when connecting services (R2, Firebase)
  common.js              shared core: text helpers, progress, streak, sound, media, offline, sync merge
  engine.js              lesson player: 14 exercise types, maps, guidebook, name cards, review, checkpoints
  home.js                course home: Lessons (eras, stars, checkpoints), Timeline, Family, Profile
  sync.js                Firebase sign-in + progress sync (loaded only when configured)
  app.css                all styles
content/
  manifest.json          generated: lesson list, versions, step counts
  courses/ahom-kings.json  course outline: eras, kings (tier A/B/C, relation to the king before, lesson)
  lessons/<id>.json      one lesson: sources, guide, map, units → steps (every text { en, as }, every step a permanent id)
  entities.json          shared names: places, rivers, people, offices, terms (with meaning, position, lessons)
  maps/assam.json        base map: real districts and rivers (from the KMZ via scripts/import_kmz.py)
  questions/ahom.json    exam-style question bank, used in era checkpoints
  media/<id>/…webp       lesson images, each with a small @480 copy; media/shared/ for images used by several
                         lessons; media/faces/ for portraits
icons/                   app icons
scripts/
  build.py               check all content + write manifest + stamp the service worker
  import_kmz.py          rebuild content/maps/assam.json from a KMZ of districts and rivers
  deploy_cloudflare.sh   deploy to Cloudflare Pages
  deploy_rules.sh        publish firestore.rules (gcloud)
  autoplay.js            dev tool: plays a lesson automatically to test it
_headers, _redirects     Cloudflare Pages caching and redirects
firestore.rules          Firestore security rules (owner-only)
```

## Adding a lesson

1. Write `content/lessons/<id>.json` (copy `suteuphaa.json` as a model), including its `sources`. Give every step a new, unique `id` and never change an id once it is published, because saved progress, review and mistakes refer to it.
   - Unit count follows the king's tier: A = 6–8 units, B = 3–5, C = 1–2.
   - Mark names in text as `[[id]]` or `[[id|shown text]]`; add new names to `content/entities.json`. Learners can tap them.
   - `map`: a `box` [west, south, east, north], the rivers, ridges and places to `show`, and optional `routes`, `texts`, `labels`. Positions are [lat, lon].
2. Put its full-size images (WebP, about 1080 px) in `content/media/<id>/` (or `shared/`). The build script makes the small `@480` copies.
3. Set `"lesson": "<id>"` on the king in `content/courses/ahom-kings.json`, and add exam questions for its era to `content/questions/ahom.json`.
4. Run `python3 scripts/build.py`, then deploy (`git push` for GitHub Pages, or `scripts/deploy_cloudflare.sh`).

Exercise types: story, mcq, tf, inline, fill, match, order, unscramble, odd, picture, whoami, spot, timeline, map.
Add `?all` to the course home or a lesson to unlock everything for review.

Services and deployment: see [SETUP.md](SETUP.md).
