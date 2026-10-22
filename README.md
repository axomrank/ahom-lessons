# Ahom Kings · learn Assam's history one reign at a time

Short, game-like lessons on the Ahom kingdom (1228–1838) for students preparing for ADRE, Assam TET, APSC and Assam Police SI. One lesson per Swargadeo, split into short units, in English and Assamese.

**Live:** https://axomrank.github.io/ahom-lessons/

## What is where

| Path | What it holds |
| --- | --- |
| `index.html` | Course home: all 41 Ahom kings, with locked, open and finished lessons |
| `lessons/NN-name.html` | One lesson per king. Content only, in a `window.LESSON` object |
| `lessons/images/` | Paintings used in the lessons (modern artistic reconstructions) |
| `assets/engine.js`, `assets/engine.css` | The shared lesson engine and styles |
| `assets/faces/` | King portraits for the course home |

## Adding a lesson

1. Copy `lessons/02-suteuphaa.html` to `lessons/NN-name.html` and write a new `LESSON` object (units, steps, a map spec, and a lesson test).
2. Add it to `LESSONS` in `index.html`.

Exercise types: story, mcq, tf, inline, fill, match, order, unscramble, odd, picture, whoami, spot, timeline, map.
Add `?all` to a lesson or the course home to unlock everything for review.

Progress, XP, streak and the "practise your mistakes" list are saved in the browser (localStorage) on each device.
