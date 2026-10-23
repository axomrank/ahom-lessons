#!/usr/bin/env bash
# Deploy the web app to Cloudflare Pages.
# One-time: run `npx wrangler login` and approve in the browser (see SETUP.md).
# Usage: scripts/deploy_cloudflare.sh            (project name defaults to ahom-lessons)
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT="${1:-ahom-lessons}"
python3 scripts/build.py
OUT="$(mktemp -d "${TMPDIR:-/home/angsuman/extra_spac/tmp}/axom-dist.XXXX")"
# Copy only the website (never docs/, plans or other folders)
cp -r index.html lesson.html sw.js manifest.webmanifest _headers _redirects app content icons lessons "$OUT/"
npx --yes wrangler@3 pages deploy "$OUT" --project-name "$PROJECT" --branch main
rm -rf "$OUT"
