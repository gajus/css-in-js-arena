# CSS-in-JS Arena

Benchmark harness for **compile-time CSS engines**. Each engine gets its own React Router 8 app under
`apps/`, all rendering the same six-page admin console: identical markup, design and data, verified
pixel-identical before anything is measured.

| Engine | Integration | Version |
| --- | --- | --- |
| [Bamboo CSS](https://bamboocss.com) | `@bamboocss/vite` | 1.55.0 |
| [StyleX](https://stylexjs.com) | `@stylexjs/unplugin` | 0.19.0 |
| [Panda CSS](https://panda-css.com) | `@pandacss/postcss` | 1.12.0 |

Measured 2026-09-03 · macOS, Node 24.10, Vite 8.2.1

| Engine | Shipped bytes | Build & dev | Authoring | Correctness & maintenance | Rows won 🏆 |
| --- | --- | --- | --- | --- | --- |
| **Bamboo** 🏆 | 5 / 10 | **4** / 8 🏆 | **7** / 8 🏆 | **4** / 4 🏆 | **20** / 30 🏆 |
| StyleX | **8** / 10 🏆 | 1 / 8 | 2 / 8 | 1 / 4 | 12 / 30 |
| Panda | 2 / 10 | 3 / 8 | 6 / 8 | 1 / 4 | 12 / 30 |

Axes are not equally weighted and two are unscored, so the tally is a scanning aid, not the
judgement. **StyleX ships the smallest stylesheet, Bamboo ties it on full first load, and Bamboo's
small-app build margin survives scale only against StyleX.**

---

## Full results

| Axis | Bamboo 🏆 | StyleX | Panda |
| --- | --- | --- | --- |
| **Shipped bytes** | | | |
| Full first load | **105,610 B** 🏆 | **106,117 B** 🏆 | 112,840 B |
| CSS, brotli | 7,357 B | **7,008 B** 🏆 | 9,518 B |
| CSS, gzip | 8,650 B | **8,176 B** 🏆 | 11,524 B |
| CSS, raw | 43,420 B | **40,430 B** 🏆 | 54,007 B |
| CSS rules emitted *(not a quality axis)* | 463 | 467 | 532 |
| Client JS, brotli | **92,712 B** 🏆 | **93,583 B** 🏆 | 97,778 B |
| SSR HTML, gzip, mean of 6 *(tie, spread 0.3%)* | 5,541 B | 5,526 B | 5,544 B |
| Class attribute bytes, raw | 93,036 B | **70,843 B** 🏆 | 92,738 B |
| Class attribute bytes, selector-heavy route | **11,728 B** 🏆 | **11,754 B** 🏆 | **11,685 B** 🏆 |
| Unreachable CSS shipped | **0 B** 🏆 | 344 B | n/a (runtime) |
| Orphan file in `include` (50 styles), imported by nothing | +2 B | **+0 B** 🏆 | +13,200 B |
| Stylesheets emitted | **1** 🏆 | 2 (one unreferenced) | **1** 🏆 |
| **Build & dev** | | | |
| Production build, cold | **1,480 ms** 🏆 | 2,688 ms | 1,831 ms |
| Production build, warm | **1,503 ms** 🏆 | 2,667 ms | 1,881 ms |
| Dev server cold start | 1,684 ms | 1,672 ms | **1,506 ms** 🏆 |
| Shared edit → server reacts | **45 ms** 🏆 (multimodal) | 50 ms | 51 ms |
| Shared edit → correct paint | 188 ms | 197 ms | **172 ms** 🏆 |
| Component edit → server reacts | 93 ms (bimodal) | **43 ms** 🏆 (bimodal) | 53 ms |
| Component edit → correct paint | 206 ms | 291 ms | **189 ms** 🏆 |
| HMR payload, one shared edit | **342 KB · 9** 🏆 | 356 KB · 10 | 402 KB · 9 |
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
| Delete a page → CSS shrinks | **−22.0%** 🏆 | −8.4% | −13.5% |
| Class names folded to literals | **522 / 522** 🏆 | **453 / 458** 🏆 | 25 / 529 (rest computed in browser, 14.7 KB runtime chunk) |
| | | | |
| **Rows won**, of 30 scored 🏆 | **20** | **12** | **12** |

---

## Where the main table doesn't generalise

One app, one configuration. Three things move the answer: style count, file count, theme count.

### Style volume

The arena is 570 rule blocks. `tools/scale.mjs` generates *N* all-distinct style definitions and
measures the emitted stylesheet.

**Downloaded stylesheet, brotli, relative to Bamboo:**

| Style definitions | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | ref | −4.7% | +29.4% |
| 50 | ref | +9.8% | +26.0% |
| 200 | ref | +42.1% | +21.0% |
| 800 | ref | **+96.0%** | **+12.3%** |

| | Marginal cost per declaration | Gap to Bamboo at n=0 | at n=800 |
| --- | --- | --- | --- |
| Bamboo | 44.0 B raw · 2.0 B brotli | ref | ref |
| Panda | 40.3 B raw · 2.0 B brotli | +10,587 B | −7,013 B |
| StyleX | 65.8 B raw · 5.5 B brotli | −2,990 B | +101,809 B |

**The baseline ranking does not survive added style volume.** StyleX starts 349 B brotli below Bamboo
but crosses before 50 generated definitions. Bamboo and Panda both add 2.0 B brotli per declaration,
so Panda's compressed penalty stays close to 2.1 KB even though its lower raw slope crosses Bamboo by
800 definitions. StyleX is almost pure slope: every rule carries `:not(#\#)` specificity padding
that repeats per declaration and compresses badly.

### Dev loop and app size

`tools/dev-scale.mjs` adds *N* generated source files and re-measures. Every module carries identical
declarations, so they fold to the same classes: the first generated module changes Bamboo from
43,420 to 43,604 B, then the stylesheet stays flat while only file count grows.

**Edit → HMR broadcast, ms:**

| Extra source files | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | 21 | 48 | 52 |
| 25 | 48 | 50 | 50 |
| 100 | 121 | 52 | 53 |
| 400 | 122 | 52 | 52 |

**There is no sustained per-edit growth with file count.** StyleX and Panda stay near 50 ms throughout
the 400-file sweep. Bamboo moves through its low and high latency modes, reaching 121–122 ms at 100
files; the wider `0,400,800,1600` sweep reads 74, 122, 122, 124 ms. Seven-run medians can select a
different mode, but the flat 400→1,600 segment is not a file-count slope. Whole-inventory work is not
flat:

| | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Production build, 0 → 400 files | 1,432 → 1,910 ms | 2,499 → 3,025 ms | 1,862 → 2,005 ms |
| — per added file | 1.20 ms | 1.32 ms | 0.36 ms |
| Dev server cold start, 0 → 400 files | 1,687 → 2,343 ms | 1,572 → 2,378 ms | 1,457 → 1,693 ms |
| — per added file | 1.64 ms | 2.02 ms | 0.59 ms |

Read the milliseconds, not a percentage: the app is 13 source files, so 400 more is 32× the inventory
and any per-file constant reads as a large percentage off that base. Carried out to 1,600 extra files
(`COUNTS=0,400,800,1600`), the build result is:

| Extra source files | 0 | 400 | 800 | 1,600 | per added file |
| --- | --- | --- | --- | --- | --- |
| Bamboo | 1,484 ms | 1,840 ms | 2,253 ms | 3,096 ms | 1.01 ms |
| StyleX | 2,426 ms | 3,021 ms | 3,514 ms | 4,371 ms | 1.22 ms |
| Panda | 1,892 ms | 2,115 ms | 2,321 ms | 2,889 ms | 0.62 ms |

**This is where the main table's build rows stop generalising, but only against Panda.** Bamboo stays
ahead of StyleX at 1,600 files by 1.3 s and also has the lower measured slope. Panda crosses Bamboo
between 800 and 1,600 extra files, around the 1,000-file point. The main table's build win over Panda
is a property of a small app; the win over StyleX survives the measured range.

Run the same sweep with `ORPHANED=1` and the generated modules remain inside `include` but outside the
bundle graph:

| Orphaned source files | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 2,185 ms | 2,579 ms | 2,095 ms |
| 400 | 1,659 ms | 2,559 ms | 2,135 ms |
| 800 | 1,837 ms | 2,525 ms | 2,562 ms |
| 1,600 | 2,039 ms | 2,666 ms | 3,321 ms |
| CSS emitted, 0 → 1,600 | +2 B | **+0 B** | +168 B |

The zero-file build samples are noisy enough to invert Bamboo's endpoint slope. Over the monotonic
400→1,600 segment, Bamboo adds 0.32 ms per orphaned file, StyleX 0.09 ms and Panda 0.99 ms. Output does
not grow per file: StyleX emits nothing, Bamboo adds a fixed 2 B once any matching orphan exists, and
Panda adds one fixed 168 B rule set because every generated module contains the same declarations.

### Theming

The arena ships no brand themes. `tools/theming.mjs` injects *N* through each engine's own multi-theme
API (Bamboo `theme.variants`, Panda `themes`, StyleX `createTheme`), each overriding the same 18
colours light and dark.

**Stylesheet the browser downloads, brotli:**

| Brand themes | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 7,357 B | 7,008 B | 9,518 B |
| 2 | 7,357 B | 7,427 B | 9,518 B |
| 8 | 7,357 B | 8,350 B | 9,518 B |
| **added per theme** | **0 B** 🏆 | +168 B | **0 B** 🏆 |

**Theme payload, fetched only when a theme is selected:**

| Axis | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Bytes per theme | **1,374 B** 🏆 | n/a (in the stylesheet) | 2,805 B |
| Themes in the critical path | **none** 🏆 | all of them | **none** 🏆 |

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

Panda extracts from source text, so it ships all 13,200 B whether or not the bundle reaches the file.
StyleX scopes to the bundle graph and emits nothing. Bamboo does not ship the orphaned definitions,
but the matching file changes its stylesheet by a fixed 2 B. The magnitudes are properties of the
fixture; the finding is what remains when the module is unreachable.

</details>

<details>
<summary><strong>Why is the HMR edit four rows instead of one?</strong></summary>

Because one number measured the wrong event. The old probe polled `getComputedStyle` until it
differed from the previous value. `tools/hmr-trace.mjs` shows two faults:

**It fires on a flash.** The first value seen is an inherited fallback, `15px`. On the shared edit the
written value arrives ~49 ms later for Bamboo and ~38 ms later for StyleX; Panda's lands in the same
frame.

**It is not the same event across engines.** An edit produces two signals, the CSS going live and the
JS module re-executing, and the poll catches whichever is first. On the shared edit Bamboo and Panda
end on JS while StyleX ends on CSS; on the component edit Panda and StyleX end on CSS.

Because that head start differs per engine — 49 ms for Bamboo, 38 ms for StyleX, none for Panda — the
flash is not a stable proxy for the ranking. Correct paint on the shared edit spans 25 ms, Panda at
172 ms to StyleX at 197 ms; polling the first changed value would compare different phases and report
a different spread.

Of the four rows only **server reacts** (write to HMR broadcast) is attributable to the engine alone.
Everything later includes Vite's protocol, React Fast Refresh and the socket round trip. **Correct
paint** is end to end.

Bamboo's shared server reaction is marked multimodal because its samples span 10–30 ms, intermediate
values and a 110–180 ms group. Its component edit and StyleX's component edit are bimodal around their
low and high clusters. Small samples select a cluster and invent trends, which is why the main-table
rows pool 28 runs.

`HMR payload` counts bytes, not milliseconds, and reproduces exactly.

</details>
