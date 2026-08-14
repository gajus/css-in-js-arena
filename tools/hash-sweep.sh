#!/usr/bin/env bash
# What is Bamboo's `hash` option worth on this app?
#
# Bamboo names classes semantically by default (`fs_14px`, `bd-b-c_border`),
# which reads beautifully in devtools and costs bytes in both the stylesheet and
# every element's class attribute. `hash` is the only switch that shortens them.
# This rebuilds under each setting and measures what a browser downloads.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/bamboo"
CONFIG="$APP/bamboo.config.ts"
PORT=3001
OUT=/tmp/hash-sweep.jsonl

cp "$CONFIG" /tmp/bamboo.config.sweep.bak
trap 'cp /tmp/bamboo.config.sweep.bak "$CONFIG"' EXIT
: > "$OUT"

restart() {
  lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
  sleep 1
  (cd "$APP" && PORT=$PORT npm start > /tmp/hash-sweep-server.log 2>&1 &)
  for _ in $(seq 1 60); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$PORT/ 2>/dev/null)" = "200" ] && return 0
    sleep 0.5
  done
  echo "server did not come up" >&2
  return 1
}

run() {
  local label="$1" insert="$2"
  cp /tmp/bamboo.config.sweep.bak "$CONFIG"
  if [ -n "$insert" ]; then
    # insert after the `preflight: true,` line
    awk -v ins="$insert" '{print} /^  preflight: true,$/{print ins}' \
      /tmp/bamboo.config.sweep.bak > "$CONFIG"
  fi
  (cd "$APP" && npx bamboo codegen --silent >/dev/null 2>&1 && npm run build >/dev/null 2>&1)
  restart || return 1
  node "$ROOT/tools/measure-one.mjs" bamboo $PORT "$label" >> "$OUT"
  echo "  measured: $label"
}

echo "sweeping…"
run "default (no hash)"          ""
run "hash className only"        "  hash: { className: true, cssVar: false },"
run "hash className + cssVar"    "  hash: true,"

# restore and rebuild so the repo is left on the measured configuration
cp /tmp/bamboo.config.sweep.bak "$CONFIG"
(cd "$APP" && npx bamboo codegen --silent >/dev/null 2>&1 && npm run build >/dev/null 2>&1)
restart >/dev/null 2>&1

node - "$OUT" <<'EOF'
const rows = require('node:fs').readFileSync(process.argv[2], 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
const n = (x) => x.toLocaleString('en-US');
const base = rows[0];
const pad = (s, w) => String(s).padEnd(w);
const num = (s, w) => String(s).padStart(w);

console.log('\n================ WHAT `hash` IS WORTH ================\n');
console.log('  CSS the document links:\n');
console.log(`  ${pad('setting', 26)} ${num('raw', 9)} ${num('gzip', 8)} ${num('brotli', 8)}    vs default`);
for (const r of rows) {
  const d = r.css.brotli - base.css.brotli;
  const delta = r === base ? '—' : `${d > 0 ? '+' : ''}${n(d)} B brotli (${((d / base.css.brotli) * 100).toFixed(1)}%)`;
  console.log(`  ${pad(r.label, 26)} ${num(n(r.css.raw), 9)} ${num(n(r.css.gzip), 8)} ${num(n(r.css.brotli), 8)}    ${delta}`);
}

for (const route of ['dashboard', 'projects', 'docs']) {
  console.log(`\n  SSR HTML — ${route}:\n`);
  console.log(`  ${pad('setting', 26)} ${num('raw', 9)} ${num('gzip', 8)} ${num('class attrs', 12)}    vs default`);
  for (const r of rows) {
    const p = r.pages[route], b = base.pages[route];
    const d = p.gzip - b.gzip;
    const delta = r === base ? '—' : `${d > 0 ? '+' : ''}${n(d)} B gzip (${((d / b.gzip) * 100).toFixed(1)}%)`;
    console.log(`  ${pad(r.label, 26)} ${num(n(p.raw), 9)} ${num(n(p.gzip), 8)} ${num(n(p.classBytes), 12)}    ${delta}`);
  }
}

console.log('\n  First load (CSS brotli + mean HTML gzip) vs repeat navigation (HTML gzip only):\n');
for (const r of rows) {
  const mean = Math.round(['dashboard','projects','docs'].reduce((a, k) => a + r.pages[k].gzip, 0) / 3);
  const bmean = Math.round(['dashboard','projects','docs'].reduce((a, k) => a + base.pages[k].gzip, 0) / 3);
  const first = r.css.brotli + mean, bfirst = base.css.brotli + bmean;
  const d = first - bfirst, dr = mean - bmean;
  console.log(`  ${pad(r.label, 26)} first ${num(n(first), 7)} B   repeat ${num(n(mean), 6)} B    ` +
    (r === base ? '—' : `first ${d > 0 ? '+' : ''}${n(d)} B · repeat ${dr > 0 ? '+' : ''}${n(dr)} B`));
}
console.log('');
EOF
