# CSS-in-JS Arena

Benchmark harness for **compile-time CSS engines**. Each engine gets its own React Router 8 app under
`apps/`, all rendering the same six-page admin console: identical markup, design and data, verified
pixel-identical before anything is measured.

| Engine | Integration | Version |
| --- | --- | --- |
| [Bamboo CSS](https://bamboocss.com) | `@bamboocss/vite` | 1.60.1 |
| [StyleX](https://stylexjs.com) | `@stylexjs/unplugin` | 0.19.1 |
| [Panda CSS](https://panda-css.com) | `@pandacss/vite` | 2.5.0 |

Measured 2026-11-03 · macOS, Node 26.12, Vite 8.3.5

| Engine | Shipped bytes | Build & dev | Authoring | Correctness & maintenance | Rows won 🏆 |
| --- | --- | --- | --- | --- | --- |
| **Bamboo** 🏆 | **8** / 11 🏆 | 3 / 8 | **7** / 8 🏆 | **4** / 4 🏆 | **22** / 31 🏆 |
| StyleX | 5 / 11 | 2 / 8 | 3 / 8 | 1 / 4 | 11 / 31 |
| Panda | 1 / 11 | **4** / 8 🏆 | 6 / 8 | 1 / 4 | 12 / 31 |

Axes are not equally weighted and one is unscored, so the tally is a scanning aid, not the judgement.
**StyleX ships the smallest compressed stylesheet and Bamboo ties it on full first load, Panda builds
fastest at every app size measured, and the stylesheet ranking inverts past about 140 added style
definitions, where Panda's becomes the smallest.**

---

## Full results

| Axis | Bamboo 🏆 | StyleX | Panda |
| --- | --- | --- | --- |
| **Shipped bytes** | | | |
| Full first load | **116,477 B** 🏆 | **116,761 B** 🏆 | 125,394 B |
| CSS, brotli | 7,787 B | **6,993 B** 🏆 | 10,220 B |
| CSS, gzip | 8,917 B | **8,171 B** 🏆 | 12,610 B |
| CSS, raw | **37,630 B** 🏆 | 40,374 B | 60,607 B |
| CSS rules emitted *(not a quality axis)* | 465 | 469 | 535 |
| Client JS, brotli | **103,329 B** 🏆 | **104,251 B** 🏆 | 109,648 B |
| SSR HTML, gzip, mean of 6 | **5,361 B** 🏆 | 5,517 B | 5,526 B |
| Class attribute bytes, raw | **55,509 B** 🏆 | 70,843 B | 92,256 B |
| Class attribute bytes, selector-heavy route | **6,774 B** 🏆 | 11,754 B | 11,678 B |
| Unreachable CSS shipped | **0 B** 🏆 | 344 B | n/a (runtime) |
| Orphan file in `include` (50 styles), imported by nothing | +2 B | **+0 B** 🏆 | +13,500 B |
| Stylesheets emitted | **1** 🏆 | 2 (one unreferenced) | **1** 🏆 |
| **Build & dev** | | | |
| Production build, cold | 1,040 ms | 1,539 ms | **637 ms** 🏆 |
| Production build, warm | 1,038 ms | 1,538 ms | **641 ms** 🏆 |
| Dev server cold start | 1,134 ms | 1,057 ms | **824 ms** 🏆 |
| Shared edit → server reacts | 53 ms | **51 ms** 🏆 | 69 ms (multimodal) |
| Shared edit → correct paint | 177 ms | 202 ms | **82 ms** 🏆 |
| Component edit → server reacts | **52 ms** 🏆 | **51 ms** 🏆 | 61 ms (bimodal) |
| Component edit → correct paint | **105 ms** 🏆 | 242 ms | 158 ms |
| HMR payload, one shared edit | **343 KB · 9** 🏆 | 355 KB · 10 | 538 KB · 11 |
| **Authoring** | | | |
| Total lines written | **3,921** 🏆 | 4,090 | **3,933** 🏆 |
| Structural & relational selectors | **one rule on the container** 🏆 | class per cell, `last` in JS | **one rule on the container** 🏆 |
| Next-sibling selector (`+`) | **yes** 🏆 | `~` only, via `when` + a marker | **yes** 🏆 |
| Variant recipes | **`cva`, typed matrix** 🏆 | compose per call site | **`cva`, typed matrix** 🏆 |
| Light/dark theming | **2 values per token** 🏆 | 3 values per token | 4 values per token |
| Dynamic values | inline `style` | **custom property** 🏆 (survives the cascade) | inline `style` |
| Register an `@property` (not via `globalCss`) | **`global.vars`** 🏆 | **`stylex.types.*`** 🏆 | **`globalVars`** 🏆 |
| Animate a registered property | **yes** 🏆 | **yes** 🏆 (`animation` shorthand dropped silently) | **yes** 🏆 |
| **Correctness & maintenance** | | | |
| Mistyped token name | **build fails** 🏆 | TS error, build succeeds | not caught at all |
| Mistyped property name | **caught** (TS2561) 🏆 | ships `pading-block` | **caught** (TS2561) 🏆 |
| Delete a page → CSS shrinks | **−19.7%** 🏆 | −8.3% | −12.5% |
| Class names folded to literals | **520 / 523** 🏆 | **453 / 458** 🏆 | 144 / 851 (rest computed in browser, 19.3 KB runtime chunk) |
| | | | |
| **Rows won**, of 31 scored 🏆 | **22** | **11** | **12** |

---

## Where the main table doesn't generalise

One app, one configuration. Three things move the answer: style count, file count, theme count.

### Style volume

The arena is 662 rule blocks. `tools/scale.mjs` generates *N* all-distinct style definitions and
measures the emitted stylesheet.

**Downloaded stylesheet, brotli, relative to Bamboo:**

| Style definitions | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | ref | −10.2% | +31.2% |
| 50 | ref | −6.2% | +15.4% |
| 200 | ref | +3.2% | −7.3% |
| 800 | ref | **+16.6%** | **−31.8%** |

| | Marginal cost per declaration | Brotli gap to Bamboo at n=0 | at n=800 |
| --- | --- | --- | --- |
| Bamboo | 41.0 B raw · 4.3 B brotli | ref | ref |
| Panda | 41.2 B raw · 1.9 B brotli | +2,433 B | −9,041 B |
| StyleX | 65.8 B raw · 5.5 B brotli | −794 B | +4,737 B |

**The baseline ranking inverts with added style volume.** All three stylesheets cross between 50 and
200 generated definitions, near 140 by linear interpolation, and past that the order at n=0 reverses:
Panda's is the smallest and StyleX's the largest. Bamboo and Panda write almost the same raw bytes per
declaration, but Bamboo's production class names are hashes, and a hash compresses worse than a
readable name that repeats the declaration it stands for: 4.3 B brotli per declaration against
Panda's 1.9 B. StyleX has the steepest slope: every rule carries `:not(#\#)` specificity padding that
repeats per declaration and compresses badly.

### Dev loop and app size

`tools/dev-scale.mjs` adds *N* generated source files and re-measures. Every module carries identical
declarations, so they fold to the same classes: the first generated module changes Bamboo from
37,630 to 37,806 B, then the stylesheet stays flat while only file count grows.

**Edit → HMR broadcast, ms:**

| Extra source files | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 (as shipped) | 52 | 50 | 55 |
| 25 | 52 | 54 | 108 |
| 100 | 49 | 54 | 85 |
| 400 | 50 | 52 | 122 |

**There is no sustained per-edit growth with file count.** Bamboo and StyleX stay near 50 ms throughout
the 400-file sweep. Panda moves through its low and high latency modes, reading 85–122 ms from 25
files up; the wider `0,400,800,1600` sweep reads 52, 98, 77, 48 ms. Seven-run medians select whichever
mode dominates the sample, and a 48 ms reading at four times the files is not a file-count slope.
Whole-inventory work is not flat:

| | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Production build, 0 → 400 files | 1,014 → 1,523 ms | 1,512 → 1,950 ms | 622 → 773 ms |
| — per added file | 1.27 ms | 1.10 ms | 0.38 ms |
| Dev server cold start, 0 → 400 files | 1,121 → 1,586 ms | 1,044 → 1,643 ms | 751 → 1,012 ms |
| — per added file | 1.16 ms | 1.50 ms | 0.65 ms |

Read the milliseconds, not a percentage: the app is 13 source files, so 400 more is 32× the inventory
and any per-file constant reads as a large percentage off that base. Carried out to 1,600 extra files
(`COUNTS=0,400,800,1600`), the build result is:

| Extra source files | 0 | 400 | 800 | 1,600 | per added file |
| --- | --- | --- | --- | --- | --- |
| Bamboo | 1,022 ms | 1,565 ms | 2,063 ms | 3,134 ms | 1.32 ms |
| StyleX | 1,497 ms | 1,936 ms | 2,311 ms | 3,042 ms | 0.97 ms |
| Panda | 620 ms | 783 ms | 984 ms | 1,242 ms | 0.39 ms |

**This is where the main table's build rows stop generalising, but only between Bamboo and StyleX.**
Panda stays fastest across the measured range and also has the lowest slope. StyleX crosses Bamboo
between 800 and 1,600 extra files, around the 1,400-file point. The main table's build win is Panda's
at every size measured; Bamboo's margin over StyleX is a property of a smaller app.

Run the same sweep with `ORPHANED=1` and the generated modules remain inside `include` but outside the
bundle graph:

| Orphaned source files | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 945 ms | 1,433 ms | 573 ms |
| 400 | 1,008 ms | 1,425 ms | 609 ms |
| 800 | 1,113 ms | 1,427 ms | 623 ms |
| 1,600 | 1,224 ms | 1,421 ms | 673 ms |
| CSS emitted, 0 → 1,600 | +2 B | **+0 B** | +172 B |

Over 0→1,600, Bamboo adds 0.17 ms per orphaned file, Panda 0.06 ms, and StyleX nothing measurable: its
four readings sit within 12 ms of each other. Output does not grow per file: StyleX emits nothing,
Bamboo adds a fixed 2 B once any matching orphan exists, and Panda adds one fixed 172 B rule set
because every generated module contains the same declarations.

### Theming

The arena ships no brand themes. `tools/theming.mjs` injects *N* through each engine's own multi-theme
API (Bamboo `theme.variants`, Panda `themes`, StyleX `createTheme`), each overriding the same 18
colours light and dark.

**Stylesheet the browser downloads, brotli:**

| Brand themes | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 7,787 B | 6,993 B | 10,220 B |
| 2 | 7,787 B | 7,418 B | 10,220 B |
| 8 | 7,787 B | 8,340 B | 10,220 B |
| **added per theme** | **0 B** 🏆 | +168 B | **0 B** 🏆 |

**Theme payload, fetched only when a theme is selected:**

| Axis | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| Bytes per theme | **1,374 B** 🏆 | n/a (in the stylesheet) | 2,643 B |
| Themes in the critical path | **none** 🏆 | all of them | **none** 🏆 |

Two mechanisms, not three. Bamboo and Panda emit each theme as its own artifact loaded on demand, so
first load is flat however many exist. StyleX's `createTheme` compiles into the linked stylesheet, so
every visitor pays for every theme: at eight, its CSS is **19% larger** than at zero and larger than
Bamboo's, which it undercuts at four or fewer. Between the lazy two it is the light/dark encoding again, Bamboo
writing `base` and `_osDark` and letting `light-dark()` resolve the rest against Panda's four values,
**1.92× the bytes per theme**. For a site with one fixed brand theme this reverses: a lazy artifact is a
second request for bytes the stylesheet would have carried anyway.

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

Panda extracts from source text, so it ships all 13,500 B whether or not the bundle reaches the file.
StyleX scopes to the bundle graph and emits nothing. Bamboo does not ship the orphaned definitions,
but the matching file changes its stylesheet by a fixed 2 B. The magnitudes are properties of the
fixture; the finding is what remains when the module is unreachable.

</details>

<details>
<summary><strong>Why is the HMR edit four rows instead of one?</strong></summary>

Because one number measured the wrong event. The old probe polled `getComputedStyle` until it
differed from the previous value. `tools/hmr-trace.mjs` shows two faults:

**It fires on a flash.** The first value seen is an inherited fallback, `15px`. On the shared edit the
written value arrives ~42 ms later for Bamboo and ~74 ms later for StyleX; Panda's lands in the same
frame.

**It is not the same event across engines.** An edit produces two signals, the CSS going live and the
JS module re-executing, and the poll catches whichever is first. On the shared edit Bamboo ends on JS
while StyleX and Panda end on CSS; on the component edit Bamboo and Panda end on JS and StyleX on CSS.

Because that head start differs per engine — 42 ms for Bamboo, 74 ms for StyleX, none for Panda — the
flash is not a stable proxy for the ranking. Correct paint on the shared edit spans 120 ms, Panda at
82 ms to StyleX at 202 ms; polling the first changed value would compare different phases and report
a different spread.

Of the four rows only **server reacts** (write to HMR broadcast) is attributable to the engine alone.
Everything later includes Vite's protocol, React Fast Refresh and the socket round trip. **Correct
paint** is end to end.

Panda's shared server reaction is marked multimodal because its samples split into an 11–31 ms group,
a 97–130 ms group and six values between. Its component edit is bimodal around 15–25 ms and 75–122 ms.
Bamboo's and StyleX's samples cluster near 50 ms on both edits. Small samples select a cluster and
invent trends, which is why the main-table rows pool 28 runs.

`HMR payload` counts bytes, not milliseconds, and is deterministic once the dev server has settled.

</details>
