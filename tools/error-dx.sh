#!/usr/bin/env bash
# Error DX probe: introduce a realistic mistake, see what the toolchain says.
# Restores the file after each case.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/bamboo"
FILE="$APP/app/ui.ts"

probe() {
  local name=$1 from=$2 to=$3
  cd "$APP"
  cp "$FILE" /tmp/edx.bak
  if ! grep -qF "$from" "$FILE"; then echo "  [$name] anchor missing — skipped"; return; fi
  perl -0pi -e "s/\Q$from\E/$to/" "$FILE"

  echo "──────────────────────────────────────────────────────────────"
  echo "CASE: $name"
  echo "  edit: $from"
  echo "     → $to"

  local tsc
  tsc=$(npm run typecheck 2>&1 | grep "error TS" | head -1)
  if [ -n "$tsc" ]; then
    echo "  tsc:   ${tsc:0:200}"
  else
    echo "  tsc:   (clean)"
  fi

  if npm run build >/tmp/edx.log 2>&1; then
    echo "  build: SUCCEEDS"
  else
    echo "  build: FAILS"
  fi
  grep -iE "bamboo|error|warn|unknown|invalid|retired|did you mean" /tmp/edx.log \
    | grep -v "errorBoundaries" | head -4 | sed 's/^/         /'

  cp /tmp/edx.bak "$FILE"
}

probe "unknown condition (_hovr)" \
  'bg: { base: "transparent", _hover: "surface2" },
        color: { base: "muted", _hover: "text" },' \
  'bg: { base: "transparent", _hovr: "surface2" },
        color: { base: "muted", _hover: "text" },'

probe "unknown token in token() ref" \
  'token(colors.accent) 55%, #22d3ee))' \
  'token(colors.nope) 55%, #22d3ee))'

probe "misspelled condition key on a real prop" \
  'color: { base: "muted", _hover: "text" },
        fontWeight: 500,' \
  'color: { base: "muted", _hoverr: "text" },
        fontWeight: 500,'

probe "undeclared cva variant value at call site" \
  'defaultVariants: { tone: "secondary" },' \
  'defaultVariants: { tone: "tertiary" },'

cd "$APP" && npm run build >/dev/null 2>&1
echo "──────────────────────────────────────────────────────────────"
echo "restored"
