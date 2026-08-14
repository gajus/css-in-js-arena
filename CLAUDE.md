# CLAUDE.md

Benchmark harness comparing **compile-time CSS engines**. One app per engine under `apps/`, all
rendering the same six-page console; `tools/` holds the parity and measurement harness.

Three documents, three audiences — keep them apart. `README.md` is for a reader deciding which engine
to use: results, methodology and caveats, no operational detail. `RUNNING.md` is for someone
reproducing the numbers: ports, commands, probe hygiene. This file is for the agent. Setup steps do
not belong in `README.md`; when the harness changes, `RUNNING.md` is what needs updating.

`README.md` runs answer-first: intro, engines, summary table, verdict, then `## Full results` (the
detail table), `## Where the main table doesn't generalise` (the scale and theming scenarios, which
exist because the main table is one app in one configuration), `## What's measured` (ground rules and
the page inventory), `## Reproducing this`, `## FAQ`. Methodology asides that answer an anticipated
question go in the FAQ, one `<details>` per question, not inline next to the tables. The verdict is
stated once, at the top — do not add a second summary after the detail table.

**`README.md` captures one point in time, never a trend.** No release-over-release narrative, no
"this used to be", no "an earlier revision said". A version bump rewrites the affected cells and the
prose around them; it does not append to a history. Findings about *how a version behaved* are
interesting during a run and go in the reply to the user — not into the document. If a number needs a
caveat, state the caveat as a present fact.

`apps/bamboo` is the **reference app**. Every other app is diffed against it, so all apps match each
other transitively.

## The one rule

**Every comparison run must end by updating the results tables in `README.md`.**

That table is the deliverable — the repo exists to keep it current. A run that produces numbers and
does not write them back is incomplete. When updating it:

- Replace the whole table, do not patch individual cells — partial updates mix numbers from
  different runs and silently drift.
- **Versions are stated once**, in the engine table at the top. Update them there and nowhere else:
  the stamp below it carries only the date and platform, and every other table labels its
  columns `Bamboo` / `StyleX` / `Panda` with no version. The one exception is the release-history
  prose, where a version number *is* the subject (`1.44.0 → 1.45.0`) — those stay.
- Every number must come from **one contiguous measurement session** on the same machine with
  nothing else heavy running. Never stitch a build time from one run into a byte count from another.
- One column per engine, plus a `Margin` column explaining the gap.
- Mark every winning cell with `🏆` and bold. Ties under ~2% spread get a trophy on each tied engine,
  or none at all if the axis is not a quality signal — say so in `Margin` (`tie — spread 0.3%`,
  `not a quality axis`).
- Put `🏆` on the overall winner's column header, and end the table with a `**🏆 Rows won**` tally
  row plus the count of scored rows. Recount it from the rendered table, do not carry it over.
- Keep the **summary table** (top of the document, under the stamp) in sync: one row per engine,
  one column per category (`Shipped bytes`, `Build & dev`, `Authoring`, `Correctness & maintenance`)
  plus the total, each as `won / scored`. Recount it from the rendered detail table too — the two
  disagreeing is the single easiest way for this file to start lying. Both counts have been wrong
  before, so verify by script rather than by eye.
- Say in the verdict that the tally is a scanning aid, not the judgement — axes are not equally
  weighted and some are unscored.

## Running the comparison

Run in this order. Steps 1–3 gate the rest: **if parity fails, the numbers are meaningless** and the
divergence has to be fixed before measuring anything.

### 1. Build every app

```bash
for d in apps/*; do (cd "$d" && npm run build && npm run typecheck); done
```

Every app must build with **0 engine warnings and 0 type errors**. For Bamboo specifically, a
`🎋 warn [utility]` line means a token does not resolve and the browser will drop the declaration —
a real bug even when screenshots look fine. Since 1.43.0 a misspelled token in a token category
fails the build outright.

### 2. Serve every app

Each on its assigned port (`300N` by engine index):

```bash
cd apps/bamboo && PORT=3001 npm start &
cd apps/stylex && PORT=3002 npm start &
cd apps/panda  && PORT=3003 npm start &
```

### 3. Verify parity — gate

```bash
cd tools
for r in / /projects /settings /pricing /docs /lab; do
  for c in stylex panda; do node layout-diff.mjs "$r" 2 "$c"; done
done
node compare.mjs
```

Note the fourth argument: `layout-diff.mjs` defaults to `stylex`, so a loop without it never
geometry-checks Panda at all.

`layout-diff.mjs` freezes animations before it probes. `getBoundingClientRect()` reports the
*transformed* box, so `/lab`'s spinner and pulsing dot otherwise make the geometry depend on which
frame each app was caught on, and the gate fails at random with a different delta each run. Keep that
style tag — `compare.mjs` gets the same protection from Playwright's `animations: "disabled"`.

Expected: **no geometry differences > 1px** on every route, and every combination `MATCH` with worst
case ≈0.047%. The residual is the footer credit line, which differs on purpose. Anything larger is a
real divergence — fix it, do not record numbers around it.

### 4. Measure — servers running

```bash
node bytes.mjs        # CSS/JS/HTML the browser downloads, raw + gzip + brotli
node unused.mjs       # class rules that can never apply
```

### 5. Measure — servers stopped

Kill the servers first; CPU contention skews timings.

```bash
lsof -ti:3001,3002,3003 | xargs kill
RUNS=5 ./timings.sh   # production build, cold and warm
RUNS=3 ./devstart.sh  # dev server cold start
./deadcode.sh         # delete a page, see what happens to the CSS
./typesafety.sh       # token-name and property-name typos
node authoring.mjs    # lines of styling code
node theming.mjs      # cost of N brand themes — reported separately, not in the main table
node scale.mjs        # marginal cost per rule at 0/50/200/800 styles — reported separately
```

### 6. Measure HMR — one dev server at a time

Run these **sequentially**, never concurrently.

```bash
cd apps/bamboo && npm run dev -- --port 4001 &
cd tools && node hmr-fanout.mjs bamboo 4001 5   # shared style module vs component file
node hmr-payload.mjs bamboo 4001                # what the browser refetches
# kill it, then repeat for the next engine on 4002, 4003, …
```

Note: the dev server binds IPv6 `localhost` only. `127.0.0.1` refuses the connection — the
production server does not have this problem.

### 7. Write the table back into README.md

Non-optional. See "The one rule" above.

## Adding an engine

Do the app first, get it to parity, then teach the tools about it.

### The app

1. `apps/<engine>/` — copy the closest existing app and swap the styling layer. Keep the component
   tree, prop order and element nesting identical; `layout-diff.mjs` compares in lockstep.
2. Copy `app/data.ts`, `app/icons.tsx`, `app/chart-utils.ts` **byte-identical** from the reference.
3. Baseline reset: if the engine ships one, use it. If not, vendor Bamboo's `preflight` output
   verbatim into `app/reset.css`, as `apps/stylex` does.
4. Ports: next free `300N` / `400N`.
5. Reproduce the design from the reference app's tokens — same hex values, same scale.
6. Footer credit reads `Built with <Engine>`; this is the one intentional pixel difference.

### The tools

Three categories, all under `tools/`:

- **Add a row to the port table in `RUNNING.md`** — it is the only place ports are documented for
  humans now, so a new engine is invisible without it.
- **Add a row to `tools/engines.json`** — name, `port`, `devPort`. That is the single source of
  truth. `bytes.mjs`, `unused.mjs`, `authoring.mjs`, `compare.mjs` and `layout-diff.mjs` read it via
  `engines.mjs`; the shell scripts read the JSON directly. Nothing else needs the list.
- **Add a per-engine edit anchor** — `hmr.mjs`, `hmr-fanout.mjs`, `hmr-payload.mjs` each keep a map
  of "which file and which exact string to edit" to trigger a style change. Needs one entry per
  engine, pointing at an equivalent shared style module and component file.
- **Add a per-engine style generator** — `scale.mjs` writes N distinct style definitions in that
  engine's syntax and needs an entry in its `generated` map. Bamboo and Panda extract from any file
  matching `include`; StyleX only sees modules in the bundle graph, so its generated module has to be
  imported and its styles referenced or the measurement silently reads zero.
- **Add a per-engine theme injector** — `theming.mjs` writes N brand themes into each engine's own
  multi-theme API and rebuilds. Needs an entry in its `targets` map (which file to edit) and a
  generator emitting that engine's theme syntax. If the engine has no multi-theme API, say so in the
  report rather than approximating one by hand — the absence is the finding.
- **Add a per-engine probe** — `typesafety.sh` introduces a token typo and a property typo in that
  engine's own syntax, then restores. Needs a probe pair per engine.

`authoring.mjs` also needs a `styling` entry naming that engine's style-definition files, and its
`CALL` regex may need the engine's style-authoring function added.

Watch for metrics an engine invalidates rather than merely scores badly on. `unused.mjs` can only
judge reachability when the engine folds class names to literals; for an engine that resolves them
at runtime it reports `n/a` instead of a false number. Prefer that over a misleading figure.

### Then

Run the full comparison and update the README table with a new column.

## Scope of the documents

`README.md` reports **only what this repo's own eval measures**. Never put figures, filenames or
findings from an external or customer codebase in it, or in `RUNNING.md` — including as background,
calibration or a sanity check. Comparisons against real applications may inform what to build and
what to be sceptical of; they are conversation, not repo content.

Two habits that survived from such comparisons and are worth keeping, stated as our own reasoning:

- **Scale.** The arena is ~550 rule blocks. Any per-engine constant that looks decisive at that size
  is worth re-checking with `scale.mjs` before it goes in the verdict — a fixed overhead reads as a
  large percentage on a small app and vanishes on a big one.
- **The happy path hides failure modes.** Every app here is required to build at 0 warnings, which is
  a property of the fixtures, not evidence that the engines are warning-free.
- **An absence is not a limitation.** If a capability seems missing, check the engine's API before
  writing it into the table — the `@property` row was wrong for exactly that reason.

## Keeping the comparison honest

- **CSS minification is disabled** (`build.cssMinify: false`) in every app's `vite.config.ts`. Vite's
  default runs Lightning CSS over the emitted stylesheet, which rewrites it — under the default
  `baseline-widely-available` target it downlevels `light-dark()` into a 54-variable polyfill. That
  measures the downleveller, not the engine, and it only penalises engines that emit modern CSS.
  Keep it off so each stylesheet is what its engine wrote. An engine that bundles Lightning CSS
  itself (StyleX, Panda) is a different matter — that is its product and stays.
- Measure every engine in the **default configuration** it ships. Opt-in settings (`hash`,
  `strictValues`, `pruneCss` and their equivalents) get measured and reported separately, never
  folded into the main table.
- If one engine gains a capability another lacks, add a row rather than dropping the axis — the
  asymmetries are the interesting part.
- When an engine's own defaults change between versions, re-measure everything. Output has been
  byte-stable across several Bamboo releases, but validation defaults have not.

## Probe hygiene

`typesafety.sh`, `theming.mjs` and the ad-hoc probes deliberately introduce typos, inject themes and
flip config flags. They restore afterwards, but always confirm before finishing:

```bash
git status                                        # clean apart from README.md
grep -rnw "acent\|padingBlock" apps/*/app/ui.ts   # must return nothing (-w: "adjacent" is not a hit)
grep -rn "tools/theming.mjs" apps/*/app/          # generated themes must be gone
ls apps/*/app/__scale.ts 2>/dev/null                # scale.mjs module must be gone
find apps/*/styled-system/themes -type f          # no leftover theme artifacts
```

Run `npm run build` in each app afterwards too. The probes leave the last mutated build on disk, so
an interrupted run can leave `build/` holding a stylesheet that no committed config produces.
