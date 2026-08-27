# CSS-in-JS Arena

Benchmark harness for **compile-time CSS engines**. Each engine gets its own React Router 8 app under
`apps/`, all rendering the same six-page admin console: identical markup, design and data, verified
pixel-identical before anything is measured.

| Engine | Integration | Version |
| --- | --- | --- |
| [Bamboo CSS](https://bamboocss.com) | `@bamboocss/vite` | 1.51.0 |
| [StyleX](https://stylexjs.com) | `@stylexjs/unplugin` | 0.19.0 |
| [Panda CSS](https://panda-css.com) | `@pandacss/postcss` | 1.12.0 |

Measured 2026-08-27 · macOS, Node 24.10, Vite 8.2.1

| Engine | Shipped bytes | Build & dev | Authoring | Correctness & maintenance | Rows won 🏆 |
| --- | --- | --- | --- | --- | --- |
| **Bamboo** 🏆 | **9** / 10 🏆 | 3 / 8 | **7** / 8 🏆 | **4** / 4 🏆 | **23** / 30 🏆 |
| StyleX | 5 / 10 | 2 / 8 | 2 / 8 | 1 / 4 | 10 / 30 |
| Panda | 2 / 10 | **4** / 8 🏆 | 6 / 8 | 1 / 4 | 13 / 30 |

Axes are not equally weighted and two are unscored, so the tally is a scanning aid, not the
judgement. **Neither the byte nor the build margins survive scale.**

---

## Full results

| Axis | Bamboo 🏆 | StyleX | Panda |
| --- | --- | --- | --- |
| **Shipped bytes** | | | |
| Full first load | **105,097 B** 🏆 | **106,117 B** 🏆 | 112,840 B |
| CSS, brotli | **6,845 B** 🏆 | 7,008 B | 9,518 B |
| CSS, gzip | **7,905 B** 🏆 | 8,176 B | 11,524 B |
| CSS, raw | **37,326 B** 🏆 | 40,430 B | 54,007 B |
| CSS rules emitted *(not a quality axis)* | 525 | 467 | 532 |
| Client JS, brotli | **92,712 B** 🏆 | **93,583 B** 🏆 | 97,778 B |
| SSR HTML, gzip, mean of 6 *(tie, spread 0.3%)* | 5,540 B | 5,526 B | 5,544 B |
| Class attribute bytes, raw | 93,036 B | **70,843 B** 🏆 | 92,738 B |
| Class attribute bytes, selector-heavy route | **11,728 B** 🏆 | **11,754 B** 🏆 | **11,685 B** 🏆 |
| Unreachable CSS shipped | **0 B** 🏆 | 344 B | n/a (runtime) |
| Orphan file in `include` (50 styles), imported by nothing | **+0 B** 🏆 | **+0 B** 🏆 | +13,200 B |
| Stylesheets emitted | **1** 🏆 | 2 (one unreferenced) | **1** 🏆 |
| **Build & dev** | | | |
| Production build, cold | **1,358 ms** 🏆 | 2,282 ms | 1,613 ms |
| Production build, warm | **1,390 ms** 🏆 | 2,308 ms | 1,573 ms |
| Dev server cold start | 1,555 ms | 1,398 ms | **1,284 ms** 🏆 |
| Shared edit → server reacts | 98 ms (bimodal) | **51 ms** 🏆 | **52 ms** 🏆 |
| Shared edit → correct paint | 210 ms | 199 ms | **170 ms** 🏆 |
| Component edit → server reacts | 104 ms (bimodal) | **43 ms** 🏆 | 53 ms |
| Component edit → correct paint | 129 ms | 244 ms | **103 ms** 🏆 |
| HMR payload, one shared edit | **336 KB · 9** 🏆 | 356 KB · 10 | 402 KB · 9 |
| **Authoring** | | | |
| Total lines written | **3,921** 🏆 | 4,090 | **3,930** 🏆 |
| Structural & relational selectors | **one rule on the container** 🏆 | class per cell, `last` in JS | **one rule on the container** 🏆 |
| Next-sibling selector (`+`) | **yes** 🏆 | `~` only, via `when` + a marker | **yes** 🏆 |
| Variant recipes | **`cva`, typed matrix** 🏆 | compose per call site | **`cva`, typed matrix** 🏆 |
| Light/dark theming | **2 values per token** 🏆 | 3 values per token | 4 values per token |
| Dynamic values | inline `style` | **custom property** 🏆 (survives the cascade) | inline `style` |
| Register an `@property` (not via `globalCss`) | **`global.vars`** 🏆 | **`stylex.types.*`** 🏆 | **`globalVars`** 🏆 |
| Animate a registered property | **yes** 🏆 | declaration dropped, no keyframe or rule | **yes** 🏆 |
| **Correctness & maintenance** | | | |
| Mistyped token name | **build fails** 🏆 | TS error, build succeeds | not caught at all |
| Mistyped property name | **caught** (TS2561) 🏆 | ships `pading-block` | **caught** (TS2561) 🏆 |
| Delete a page → CSS shrinks | **−20.0%** 🏆 | −8.4% | −13.5% |
| Class names folded to literals | **522 / 522** 🏆 | **453 / 458** 🏆 | 25 / 529 (rest computed in browser, 14.7 KB runtime chunk) |
| | | | |
| **Rows won**, of 30 scored 🏆 | **23** | **10** | **13** |

---

## Where the main table doesn't generalise

One app, one configuration. Three things move the answer: style count, file count, theme count.

### Style volume

The arena is 570 rule blocks. `tools/scale.mjs` generates *N* all-distinct style definitions and
measures the emitted stylesheet.

**Downloaded stylesheet, brotli, relative to Bamboo:**

| Style definitions | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | ref | +2.4% | +39.1% |
| 50 | ref | +17.9% | +35.3% |
| 200 | ref | +49.2% | +27.1% |
| 800 | ref | **+101.8%** | **+15.7%** |

| | Marginal cost per declaration | Gap to Bamboo at n=0 | at n=800 |
| --- | --- | --- | --- |
| Bamboo | 40.3 B raw · 2.0 B brotli | ref | ref |
| Panda | 40.3 B raw · 2.0 B brotli | +16,681 B | +16,681 B |
| StyleX | 65.8 B raw · 5.5 B brotli | +3,104 B | +125,503 B |

**The ranking at the arena's size is not the ranking at production size.** Panda's marginal cost
equals Bamboo's to the byte; its whole penalty is a fixed 16,681 B of scaffolding, identical at 0
styles and at 800. StyleX is the reverse, almost pure slope: every rule carries `:not(#\#)`
specificity padding that repeats per declaration and compresses badly.

### Dev loop and app size

`tools/dev-scale.mjs` adds *N* generated source files and re-measures. Every module carries identical
declarations, so they fold to the same classes and the stylesheet stays flat (Bamboo 37,326 →
37,494 B). Only file count grows.

**Edit → HMR broadcast, ms:**

| Extra source files | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | 35 | 52 | 50 |
| 25 | 122 | 51 | 52 |
| 100 | 124 | 52 | 52 |
| 400 | 123 | 50 | 52 |

**Per-edit cost is flat in file count.** None of the three re-reads the source inventory to answer an
edit. StyleX and Panda hold to within 2 ms across 400 files. Bamboo's points span 35–124 ms, but each
is a 7-run median drawn from a bimodal distribution, and seven runs cannot place a median reliably
between two clusters. A second sweep puts the same sizes in different clusters — 98, 125, 123, 57 ms
against the 35, 122, 124, 123 above — which is what sampling looks like and what a slope does not.
Bamboo's gap to the other two is a fixed ~2×. Whole-inventory work is not flat:

| | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Production build, 0 → 400 files | 1,422 → 2,793 ms | 2,295 → 2,674 ms | 1,568 → 1,814 ms |
| — per added file | 3.43 ms | 0.95 ms | 0.62 ms |
| Dev server cold start, 0 → 400 files | 1,530 → 2,930 ms | 1,420 → 1,899 ms | 1,259 → 1,509 ms |
| — per added file | 3.50 ms | 1.20 ms | 0.63 ms |

**Per-added-file cost is a constant, and Bamboo's constant is the high one — 3.6× StyleX's and 5.5×
Panda's.** Read the milliseconds, not a percentage: the app is 13 source files, so 400 more is 32× the
inventory and *any* per-file constant reads as a triple-digit percentage off that base.

Nothing here is quadratic, and the constant is what decides it. Carried out to 1,600 extra files
(`COUNTS=0,400,800,1600`), each engine's cost stays linear — Bamboo's second differences over equal
400-file steps are +448 and −343 ms, changing sign, so there is no superlinear term to find:

| Extra source files | 0 | 400 | 800 | 1,600 | per added file |
| --- | --- | --- | --- | --- | --- |
| Bamboo | 1,263 ms | 2,614 ms | 3,924 ms | 7,097 ms | 3.74 ms |
| StyleX | 2,316 ms | 2,630 ms | 3,047 ms | 3,919 ms | 1.00 ms |
| Panda | 1,527 ms | 1,788 ms | 1,930 ms | 2,294 ms | 0.48 ms |

**This is where the main table's build rows stop generalising.** Bamboo is the fastest build in this
repo and the slowest by 1,600 files — 3.1× Panda, 1.8× StyleX. Those slopes put the crossover at
roughly **95 total source files against Panda and 400 against StyleX**, both of which a real
application passes early. The main table's 40% build win is a property of a 13-file app.

Most of Bamboo's constant buys nothing. Run the same sweep with `ORPHANED=1`, which generates the same
modules but leaves them unimported — inside `include`, outside the bundle graph:

| 400 files matching `include` that nothing imports | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Production build | 1,291 → 2,083 ms (**+792 ms**) | 2,139 → 2,110 ms (−29 ms) | 1,532 → 1,561 ms (+29 ms) |
| CSS emitted for them | **+0 B** | **+0 B** | +168 B |

The orphaned sweep is linear too, at **2.01 ms per file** over the same 400→1,600 range — so **54% of
Bamboo's per-file cost is spent reading files it then discards** for being outside the bundle graph,
for zero emitted bytes. StyleX never opens them and pays nothing; Panda reads them for 0.07 ms each
and keeps the result. This is the same bundle-graph scoping that wins Bamboo the orphan-file row in
the main table, seen from its cost side rather than its byte side: the file is scanned either way, and
only the output is dropped. Panda is flattest in file count as it is in rule count.

### Theming

The arena ships no brand themes. `tools/theming.mjs` injects *N* through each engine's own multi-theme
API (Bamboo `theme.variants`, Panda `themes`, StyleX `createTheme`), each overriding the same 18
colours light and dark.

**Stylesheet the browser downloads, brotli:**

| Brand themes | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 6,845 B | 7,008 B | 9,518 B |
| 2 | 6,845 B | 7,427 B | 9,518 B |
| 8 | 6,845 B | 8,350 B | 9,518 B |
| **added per theme** | **0 B** 🏆 | +168 B | **0 B** 🏆 |

**Theme payload, fetched only when a theme is selected:**

| Axis | Bamboo | StyleX | Panda | Margin |
| --- | --- | --- | --- | --- |
| Bytes per theme | **1,374 B** 🏆 | n/a (in the stylesheet) | 2,805 B | −51% |
| Themes in the critical path | **none** 🏆 | all of them | **none** 🏆 | StyleX has no lazy option |

Two mechanisms, not three. Bamboo and Panda emit each theme as its own artifact loaded on demand, so
first load is flat however many exist. StyleX's `createTheme` compiles into the linked stylesheet, so
every visitor pays for every theme: at eight, its CSS is **19% larger** than at zero. Between the lazy
two it is the light/dark encoding again, Bamboo writing `base` and `_osDark` and letting
`light-dark()` resolve the rest against Panda's four values, **2.04× the bytes per theme**. For a site
with one fixed brand theme this reverses: a lazy artifact is a second request for bytes the stylesheet
would have carried anyway.

---

## What's measured

### Ground rules

- **One reference app.** `apps/bamboo` is the reference. Every other is diffed against it element for
  element, then pixel for pixel, so all match each other transitively.
- **Shared source is byte-identical.** `data.ts`, `icons.tsx` and `chart-utils.ts` are the same bytes
  in every app.
- **Same baseline reset.** Engines shipping one use theirs. Engines that do not vendor Bamboo's
  `preflight` verbatim, so nobody gets a typography head start.
- **Default configuration only.** Opt-in settings are reported separately, never folded into the main
  table.

### Pages

| Route | What it exercises |
| --- | --- |
| `/` | KPI grid, SVG bar chart + sparklines, activity feed, responsive 2-col dashboard |
| `/projects` | Data table, status badges, progress bars, toolbar, pagination |
| `/settings` | Sticky section nav, 2-col form grid, validation states, toggle switches, radio cards, danger zone, sticky save bar |
| `/pricing` | Featured pricing cards, billing toggle, comparison table, `<details>` FAQ |
| `/docs` | 3-column docs layout, prose typography, code block, callouts, table, TOC |
| `/lab` | Structural + relational selectors, keyframe motion, container queries |

All six are responsive across three breakpoints and support system dark mode plus an explicit toggle.

---

## Reproducing this

Every number comes from one contiguous session on one machine. Harness, parity gate and exact commands
are in **[`RUNNING.md`](./RUNNING.md)**.

---

## FAQ

<details>
<summary><strong>Why is CSS minification disabled?</strong></summary>

`build.cssMinify: false` in all three apps. Vite's default runs Lightning CSS over the stylesheet and
rewrites it, most visibly downlevelling `light-dark()` into a 54-variable polyfill under the
`baseline-widely-available` target. That measures the downleveller, and penalises only engines
emitting modern CSS. Off, every stylesheet here is what its engine wrote.

StyleX still shows Lightning CSS output because `@stylexjs/unplugin` depends on it directly. That is
its product, not the harness.

</details>

<details>
<summary><strong>What does the orphan-file row measure?</strong></summary>

A module matching the engine's `include` glob that nothing imports: the file a deleted feature leaves
behind. `tools/orphan.mjs` writes one carrying 50 style definitions, rebuilds, and diffs the
stylesheet.

Panda extracts from source text, so it ships the CSS whether or not the bundle reaches the file.
Bamboo and StyleX scope to the bundle graph and emit nothing. The 13,200 B is a property of the
fixture; the finding is which engines are at zero.

</details>

<details>
<summary><strong>Why is the HMR edit four rows instead of one?</strong></summary>

Because one number measured the wrong event, in a way that changed the ranking. The old probe polled
`getComputedStyle` until it differed from the previous value. `tools/hmr-trace.mjs` shows two faults:

**It fires on a flash.** The first value seen is an inherited fallback, `15px`. On the shared edit the
written value arrives ~50 ms later for Bamboo and ~39 ms later for StyleX; Panda's lands in the same
frame.

**It is not the same event across engines.** An edit produces two signals, the CSS going live and the
JS module re-executing, and the poll catches whichever is first. StyleX lands CSS after its JS, Bamboo
and Panda before it.

Correcting both reverses the row. To correct paint the shared edit is Panda 170 ms, StyleX 199 ms,
Bamboo 210 ms — while the flash the old probe fired on lands at Bamboo 159 ms, StyleX 161 ms, Panda
170 ms, which puts the engine that is actually slowest to paint nominally first.

Of the four rows only **server reacts** (write to HMR broadcast) is attributable to the engine alone.
Everything later includes Vite's protocol, React Fast Refresh and the socket round trip. **Correct
paint** is end to end.

Bamboo's server reaction is marked bimodal because it is: on the shared edit about a third of runs
land near 25 ms and the rest near 120 ms, so the pooled median sits between two clusters rather than on
either. Small samples invent trends here, which is why the main-table rows pool 28 runs.

`HMR payload` counts bytes, not milliseconds, and reproduces exactly.

</details>
