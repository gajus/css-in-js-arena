#!/usr/bin/env bash
# Maintainability probe: delete the Docs page from both apps, rebuild, and see
# what happens to the shipped CSS. Restores everything afterwards.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ENGINES=$(node -e "console.log(require('$HERE/engines.json').engines.map(e=>e.name).join(' '))")

csssize() {
  local app=$1 f
  f=$(ls "$ROOT/apps/$app/build/client/assets/"root-*.css | head -1)
  printf "%s %s" "$(wc -c < "$f" | tr -d ' ')" "$(gzip -9 -c "$f" | wc -c | tr -d ' ')"
}

echo "=== CSS after deleting one of five pages (Docs) ==="
for app in $ENGINES; do
  cd "$ROOT/apps/$app"
  before=($(csssize "$app"))

  cp app/routes/docs.tsx /tmp/docs-$app.bak
  cp app/routes.ts /tmp/routes-$app.bak
  # replace the route with a stub and drop it from the route table
  printf 'export default function Page() { return <p>gone</p>; }\n' > app/routes/docs.tsx
  npm run build >/dev/null 2>&1

  after=($(csssize "$app"))

  cp /tmp/docs-$app.bak app/routes/docs.tsx
  cp /tmp/routes-$app.bak app/routes.ts
  npm run build >/dev/null 2>&1

  raw_delta=$(( ${after[0]} - ${before[0]} ))
  gz_delta=$(( ${after[1]} - ${before[1]} ))
  pct=$(python3 -c "print(f'{100*$raw_delta/${before[0]}:.1f}')")
  printf "  %-8s raw %6s B -> %6s B  (%+d B, %s%%)   gzip %5s B -> %5s B (%+d B)\n" \
    "$app" "${before[0]}" "${after[0]}" "$raw_delta" "$pct" "${before[1]}" "${after[1]}" "$gz_delta"
done
