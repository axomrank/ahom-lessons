#!/usr/bin/env bash
# Publish firestore.rules to the Firebase project, using gcloud (no Firebase CLI needed).
# Usage: scripts/deploy_rules.sh            (project defaults to axomrank-ahom)
set -euo pipefail
cd "$(dirname "$0")/.."
P="${1:-axomrank-ahom}"
GCLOUD="$(command -v gcloud || echo "$HOME/google-cloud-sdk/bin/gcloud")"
TOKEN="$("$GCLOUD" auth print-access-token)"
H=(-H "Authorization: Bearer $TOKEN" -H "x-goog-user-project: $P" -H "Content-Type: application/json")
BODY="$(python3 -c 'import json; print(json.dumps({"source": {"files": [{"name": "firestore.rules", "content": open("firestore.rules").read()}]}}))')"
RULESET="$(curl -sf -X POST "${H[@]}" "https://firebaserules.googleapis.com/v1/projects/$P/rulesets" -d "$BODY" | python3 -c 'import sys, json; print(json.load(sys.stdin)["name"])')"
curl -sf -X PATCH "${H[@]}" "https://firebaserules.googleapis.com/v1/projects/$P/releases/cloud.firestore" \
  -d "{\"release\": {\"name\": \"projects/$P/releases/cloud.firestore\", \"rulesetName\": \"$RULESET\"}}" >/dev/null
echo "Published $RULESET"
