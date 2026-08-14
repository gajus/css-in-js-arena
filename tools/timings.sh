#!/usr/bin/env bash
# Build + dev-server timings. Writes progress straight to stdout (unbuffered).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ENGINES=$(node -e "console.log(require('$HERE/engines.json').engines.map(e=>e.name).join(' '))")
RUNS=${RUNS:-5}

ms() { python3 -c 'import time;print(int(time.time()*1000))'; }
median() { sort -n | awk '{a[NR]=$1} END{print (NR%2)? a[(NR+1)/2] : int((a[NR/2]+a[NR/2+1])/2)}'; }

# Kill whatever is actually listening on a port, not the npm wrapper.
free_port() {
  local p=$1 pids
  pids=$(lsof -ti:"$p" 2>/dev/null)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null
  local n=0
  while lsof -ti:"$p" >/dev/null 2>&1 && [ $n -lt 40 ]; do sleep 0.25; n=$((n+1)); done
}

echo "=== PRODUCTION BUILD (median of $RUNS runs) ==="
for app in $ENGINES; do
  cd "$ROOT/apps/$app"

  cold=()
  for i in $(seq 1 "$RUNS"); do
    rm -rf build .react-router node_modules/.vite
    s=$(ms); npm run build >/dev/null 2>&1; e=$(ms)
    cold+=($((e - s)))
  done

  warm=()
  for i in $(seq 1 "$RUNS"); do
    s=$(ms); npm run build >/dev/null 2>&1; e=$(ms)
    warm+=($((e - s)))
  done

  c=$(printf '%s\n' "${cold[@]}" | median)
  w=$(printf '%s\n' "${warm[@]}" | median)
  printf "  %-8s cold %6s ms   warm %6s ms\n" "$app" "$c" "$w"
  printf "           cold runs: %s\n           warm runs: %s\n" "${cold[*]}" "${warm[*]}"
done

# Dev-server timings live in devstart.sh (the dev server binds IPv6
# localhost only, which needs different probing).
