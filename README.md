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

1. Write `content/lessons/<id>.json` (`suteuphaa.json` and `subinphaa.json` are the models), including its `sources`. Give every step a new, unique `id` and never change an id once it is published, because saved progress, review and mistakes refer to it.
   - Unit count follows the king's tier: A = 6–8 units, B = 4–6, C = 2–3. One unit per story beat of the reign.
   - Mark names in text as `[[id]]` or `[[id|shown text]]`; add new names to `content/entities.json`. Learners can tap them.
   - `map`: a `box` [west, south, east, north], the rivers, ridges and places to `show`, and optional `routes`, `texts`, `labels`. Positions are [lat, lon].
2. Put its full-size images (WebP, about 1080 px) in `content/media/<id>/` (or `shared/`). The build script makes the small `@480` copies.
3. Set `"lesson": "<id>"` on the king in `content/courses/ahom-kings.json`, and add exam questions for its era to `content/questions/ahom.json`.
4. Run `python3 scripts/build.py`, then deploy (`git push` for GitHub Pages, or `scripts/deploy_cloudflare.sh`).

## Lesson design: never boring

The app must feel like a game, not a textbook: short units, a story first, a different kind of exercise every time, instant feedback with the reason, and visible progress on one path through the whole course. Anything repetitive or dull is a bug.

- **Units:** one story beat each: 2–3 short story cards (with a painting, map or art), then 5–7 exercises.
- **Exercise mix:** prefer whoami, map, timeline, picture, tf, unscramble, spot, fill, match, order, odd. Use plain `mcq` rarely (at most one exam-style "consider the statements" question in a lesson test). Pick the type that fits the fact: place → map, date → timeline, person → whoami, scene → picture, trap → tf or spot.
- **Every unit:** 4 `learned` points; links (`link`) to earlier units or lessons where the story really connects.

Exercise types: story, mcq, tf, inline, fill, match, order, unscramble, odd, picture, whoami, spot, timeline, map.

## Learning loop (in `app/engine.js`, not in the lesson data)

- In a unit or lesson test, a missed question comes back **once** at the end. Matching exercises do not repeat.
- Test-outs, "Jump here" tests and era checkpoints never repeat questions; the 80% pass mark counts first attempts.
- Missed questions are saved to the lesson's mistakes list ("Practise your mistakes") and to the daily review (1, 3, 7, 15, 30 days).
- Passing a lesson test (80%+) opens Unit 1 of the next lesson. A locked lesson keeps its units locked; its last circle is "Jump here".
- Every lesson page shows the whole course as one path, scrolled to the open lesson.

Add `?all` to the course home or a lesson to unlock everything for review.

Services and deployment: see [SETUP.md](SETUP.md).

## Story cards: the one design

Every story card is built the same way, by the engine, so a lesson author only writes text and picks a picture.

**Layout, top to bottom**
1. **Kicker**: "STORY", with one progress dot per paragraph on the right.
2. **Hero**: an AHOM painting (or the lesson map, or line art). If the card mentions a year, the first year appears as a terra stamp on the painting.
3. **Title**: at most 6 words, a hook rather than a label ("Blood on the forehead", not "Phuleswari's Durga Puja").
4. **Lede**: the first paragraph, larger. It must make sense alone.
5. **Beats**: each further paragraph appears on the next tap, with a left rule, so the reader never faces a wall of text. Continue reveals the next beat before moving on.

**Word limits (the build fails if broken)**
- At most 3 paragraphs, 35 words per paragraph, 55 words per card (counted in English).
- One idea per paragraph; if a card needs more, split it into two cards.

**Emphasis: three kinds, never mixed**
- `<mark>` = **the key fact** to remember. A gold highlighter sweeps across it as the beat appears. At most 3 per card.
- `[[entity]]` = **a name you can tap** for its meaning. Shown with a dotted underline, never highlighted.
- **Years** are styled automatically (bold terra), so do not mark a year only to make it stand out.
- `<b>` = plain bold, for lists of names and the letters of a memory trick. On "Remember …" cards each `<b>` letter becomes a round terra badge.
