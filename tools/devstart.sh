#!/usr/bin/env bash
# Dev-server cold start: wall clock from `npm run dev` to a fully rendered
# SSR response. `react-router dev` relaunches itself with different
# NODE_OPTIONS, so the whole process group has to be torn down by pattern.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ENGINES=$(node -e "console.log(require('$HERE/engines.json').engines.map(e=>e.name).join(' '))")
RUNS=${RUNS:-3}
ms() { python3 -c 'import time;print(int(time.time()*1000))'; }
median() { sort -n | awk '{a[NR]=$1} END{print (NR%2)? a[(NR+1)/2] : int((a[NR/2]+a[NR/2+1])/2)}'; }

cleanup() {
  local port=$1
  pkill -f "react-router dev --port $port" 2>/dev/null
  sleep 0.5
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null
  local n=0
  while lsof -ti:"$port" >/dev/null 2>&1 && [ $n -lt 40 ]; do sleep 0.25; n=$((n+1)); done
  return 0
}

for app in $ENGINES; do
  port=$(node -e "const e=require('$HERE/engines.json').engines.find(x=>x.name==='$app'); console.log(e.devPort)")
  cd "$ROOT/apps/$app"
  times=()
  for i in $(seq 1 "$RUNS"); do
    cleanup "$port"
    rm -rf node_modules/.vite
    s=$(ms)
    npm run dev -- --port "$port" >"/tmp/dev-$app.log" 2>&1 &
    ok=0
    for _ in $(seq 1 900); do
      if curl -s --max-time 20 "http://localhost:$port/" 2>/dev/null | grep -q "Recent activity"; then ok=1; break; fi
      sleep 0.1
    done
    e=$(ms)
    if [ $ok -eq 1 ]; then times+=($((e - s))); else echo "  $app run $i: TIMED OUT"; fi
    cleanup "$port"
    sleep 0.5
  done
  if [ ${#times[@]} -gt 0 ]; then
    printf "  %-8s dev cold start: median %6s ms   runs: %s\n" "$app" "$(printf '%s\n' "${times[@]}" | median)" "${times[*]}"
  else
    printf "  %-8s dev cold start: ALL RUNS FAILED\n" "$app"
  fi
done
