# Running the benchmark

Everything needed to reproduce the numbers in [`README.md`](./README.md) yourself. If you only want
the results, you do not need this file.

Each engine gets a port pair by its index in `tools/engines.json` — `300N` for the production server,
`400N` for the dev server:

| Engine | Package | Prod port | Dev port |
| --- | --- | --- | --- |
| Bamboo CSS | `@bamboocss/vite` | 3001 | 4001 |
| StyleX | `@stylexjs/unplugin` | 3002 | 4002 |
| Panda CSS | `@pandacss/postcss` | 3003 | 4003 |

`tools/engines.json` is the single source of truth for that list. Adding an engine is a checklist —
see [`CLAUDE.md`](./CLAUDE.md).

## Install

```bash
for d in apps/* tools; do (cd "$d" && npm install); done
```

## Build

Every app must build with **0 engine warnings and 0 type errors** before anything is measured:

```bash
for d in apps/*; do (cd "$d" && npm run build && npm run typecheck); done
```

For Bamboo specifically, a `🎋 warn [utility]` line means a token does not resolve — the declaration
ships as written and the browser drops it. That is a real bug even when the screenshots look fine.

## Serve

One terminal per engine, each on its assigned port:

```bash
cd apps/bamboo && PORT=3001 npm start
cd apps/stylex && PORT=3002 npm start
cd apps/panda  && PORT=3003 npm start
```

## Verify parity — the gate

**If parity fails the numbers are meaningless.** Fix the divergence before measuring anything.

```bash
cd tools
for r in / /projects /settings /pricing /docs /lab; do
  for c in stylex panda; do node layout-diff.mjs "$r" 2 "$c"; done
done
node compare.mjs
```

Expected: **no geometry differences > 1px** on every route, and every combination `MATCH` with a
worst case of ≈0.047% — that residual is the footer credit line, which differs on purpose.

Two things that are easy to get wrong:

- `layout-diff.mjs` takes the challenger as its **fourth** argument and defaults to `stylex`. A loop
  without it never geometry-checks Panda at all.
- Both tools freeze CSS animations before measuring, because `getBoundingClientRect()` reports the
  transformed box and `/lab` animates. Without that the gate fails at random.

`compare.mjs` writes screenshots and diff images to `tools/shots/`.

## Measure — servers running

```bash
cd tools
node bytes.mjs      # CSS/JS/HTML the browser downloads, raw + gzip + brotli
node unused.mjs     # class rules that can never apply
```

## Measure — servers stopped

Kill the servers first; CPU contention skews the timings.

```bash
lsof -ti:3001,3002,3003 | xargs kill

cd tools
RUNS=5 ./timings.sh   # production build, cold and warm
RUNS=7 ./devstart.sh  # dev server cold start
./deadcode.sh         # delete a page, see what happens to the CSS
./typesafety.sh       # token-name and property-name typos
node authoring.mjs    # lines of styling code
node orphan.mjs       # a module matching `include` that nothing imports
```

## Measure HMR — one dev server at a time

Run these **sequentially, never concurrently** — parallel dev servers skew every timing.

```bash
cd apps/bamboo && npm run dev -- --port 4001 &
cd tools
node hmr-fanout.mjs bamboo 4001 15   # shared style module vs component file
node hmr-payload.mjs bamboo 4001     # what the browser refetches
# kill it, then repeat for the next engine on 4002, 4003
```

The dev server binds IPv6 `localhost` only — `127.0.0.1` refuses the connection. The production
server does not have this problem.

## The separate scenarios

These are reported in their own sections of `README.md` and never folded into the main table, because
they are not the default configuration:

```bash
cd tools
node scale.mjs     # marginal cost per rule at 0 / 50 / 200 / 800 style definitions
node theming.mjs   # cost of 0 / 1 / 2 / 4 / 8 brand themes, per engine's own API
```

Both rewrite app sources, build, and restore. They take a few minutes each.

## Interpreting timings

Timing rows are the noisiest thing here and the easiest to misread:

- Build and HMR numbers move several percent with ambient machine load. If an engine you did **not**
  change moved too, that is drift, not a result.
- To attribute a delta to a specific version, A/B that version directly — same app, same machine,
  the two versions interleaved with the order reversed in the second half so a monotonic drift
  cancels. Absolute values from two such pairs are comparable only *within* a pair, never between.
  A session-over-session diff is not evidence: `README.md` records a point in time, not a trend.
- `hmr-fanout.mjs` measures edit-to-browser latency, not transform time. It cannot isolate an
  engine's own work from Vite's HMR protocol, React Fast Refresh, or the socket round trip.

## Probe hygiene

`typesafety.sh`, `scale.mjs`, `theming.mjs`, `orphan.mjs` and the ad-hoc probes deliberately
introduce typos, inject themes and flip config flags. They restore afterwards, but confirm before you
trust a result:

```bash
git status                                        # clean apart from README.md
grep -rnw "acent\|padingBlock" apps/*/app/ui.ts   # must return nothing
ls apps/*/app/__scale.ts 2>/dev/null              # generated module must be gone
ls apps/*/app/__orphan.ts 2>/dev/null             # ditto
find apps/*/styled-system/themes -type f          # no leftover theme artifacts
```

Rebuild each app afterwards too. An interrupted probe can leave `build/` holding a stylesheet that no
committed config produces.

Do not pipe a probe into `head` or any other command that closes the pipe early. The probe dies on
`SIGPIPE` before its restore step and leaves the typo in the working tree — `git checkout` the app
source if that happens.
