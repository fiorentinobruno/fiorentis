#!/usr/bin/env bash
# Bumps the shared static-asset cache-busting timestamp (?v=...) across all HTML pages.
# Run this after changing any static file (JS/CSS) so browsers pick up the new version.
set -euo pipefail

cd "$(dirname "$0")/static"

OLD=$(grep -oE 'v=[0-9]+' index.html | head -1 | cut -d= -f2)
NEW=$(date +%s)

if [ "$OLD" = "$NEW" ]; then
  NEW=$((OLD + 1))
fi

grep -rl "v=$OLD" *.html | xargs sed -i '' "s/v=$OLD/v=$NEW/g"
echo "Bumped v=$OLD -> v=$NEW"
