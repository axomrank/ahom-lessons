#!/usr/bin/env bash
# Copy content/media/ to a Cloudflare R2 bucket, then point the app at it.
# One-time: `npx wrangler login`, create the bucket and turn on its public URL (see SETUP.md).
# Usage: scripts/upload_media_r2.sh axomrank-media
set -euo pipefail
cd "$(dirname "$0")/.."
BUCKET="${1:?usage: scripts/upload_media_r2.sh <bucket-name>}"
find content/media -type f -name '*.webp' | while read -r f; do
  key="${f#content/media/}"
  npx --yes wrangler@3 r2 object put "$BUCKET/$key" --file "$f" --content-type image/webp --cache-control "public, max-age=604800" --remote >/dev/null
  echo "uploaded $key"
done
echo "Done. Now set mediaBase in app/config.js to the bucket's public URL (ending with /)."
