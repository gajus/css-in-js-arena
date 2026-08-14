# CSS-in-JS Arena

A benchmark harness for **compile-time CSS engines**. Each engine gets its own React Router 8 app
under `apps/`, and every app renders the *same* six-page admin console — identical markup,
identical design, identical data. The apps are verified pixel-identical before anything is measured,
so the numbers isolate the engine and nothing else.

| Engine | Integration | Version |
| --- | --- | --- |
| [Bamboo CSS](https://bamboocss.com) | `@bamboocss/vite` | 1.45.3 |
| [StyleX](https://stylexjs.com) | `@stylexjs/unplugin` | 0.19.0 |
| [Panda CSS](https://panda-css.com) | `@pandacss/postcss` | 1.12.0 |

Measured 2026-08-18 at the versions above · macOS, Node 24.10, Vite 8.2.1

| Engine | Shipped bytes | Build & dev | Authoring | Correctness & maintenance | Rows won 🏆 |
| --- | --- | --- | --- | --- | --- |
| **Bamboo** 🏆 | **8** / 10 🏆 | **3** / 6 🏆 | **7** / 8 🏆 | **4** / 4 🏆 | **22** / 28 🏆 |
| StyleX | 3 / 10 | 1 / 6 | 2 / 8 | 1 / 4 | 7 / 28 |
| Panda | 2 / 10 | 2 / 6 | 6 / 8 | 1 / 4 | 11 / 28 |

Rows won per category, out of the scored rows in each. They are not equally weighted and two are
unscored, so the tally is a scanning aid rather than the judgement — and **the byte margins do not
survive scale**, as the next section shows.

---

## Full results

| Axis | Bamboo 🏆 | StyleX | Panda | Margin |
| --- | --- | --- | --- | --- |
| **Shipped bytes** | | | | |
| Full first load | **104,911 B** 🏆 | 106,117 B | 112,840 B | −1.1% / −7.0% |
| CSS, brotli | **6,802 B** 🏆 | 7,008 B | 9,518 B | −2.9% / −29% |
| CSS, gzip | **7,876 B** 🏆 | 8,176 B | 11,524 B | −3.7% / −32% |
| CSS, raw | **37,227 B** 🏆 | 40,430 B | 54,007 B | −7.9% / −31% |
| CSS rules emitted | 525 | 467 | 532 | not a quality axis |
| Client JS, brotli | **92,569 B** 🏆 | 93,583 B | 97,778 B | −1.1% / −5.3% |
| SSR HTML, gzip (mean of 6) | 5,540 B | 5,526 B | 5,544 B | tie — spread 0.3% |
| Class attribute bytes, raw | 93,036 B | **70,843 B** 🏆 | 92,738 B | −24% |
| — on the selector-heavy route | **11,728 B** 🏆 | **11,754 B** 🏆 | **11,685 B** 🏆 | tie — spread 0.6% |
| Unreachable CSS shipped | **0 B** 🏆 | 344 B | n/a — runtime | only engine at zero |
| Orphan file in `include`, imported by nothing | +7,200 B | **+0 B** 🏆 | +7,200 B | only StyleX scopes to the bundle graph |
| Stylesheets emitted | **1** 🏆 | 2 | **1** 🏆 | StyleX emits an unreferenced duplicate |
| **Build & dev** | | | | |
| Production build, cold | **1,564 ms** 🏆 | 2,336 ms | 1,611 ms | −2.9% / −33% |
| Production build, warm | **1,591 ms** 🏆 | 2,293 ms | 1,704 ms | −6.6% / −31% |
| Dev server cold start | 1,725 ms | 1,434 ms | **1,300 ms** 🏆 | −9.3% / −25% |
| HMR — edit a shared style module | 213 ms | **103 ms** 🏆 | 183 ms | −44% / −52% |
| HMR — edit a component file | 189 ms | 229 ms | **118 ms** 🏆 | −38% / −48% |
| HMR payload, one shared edit | **336 KB · 9** 🏆 | 356 KB · 10 | 402 KB · 9 | −5.5% / −16% |
| **Authoring** | | | | |
| Total lines written | **3,921** 🏆 | 4,090 | **3,930** 🏆 | Bamboo ≡ Panda (0.2%); StyleX +4.3% |
| Structural & relational selectors | **one rule on the container** 🏆 | class per cell, `last` in JS | **one rule on the container** 🏆 | StyleX styles only its own element |
| Next-sibling selector (`+`) | **yes** 🏆 | `~` only, via `when` + a marker | **yes** 🏆 | StyleX has no adjacency form |
| Variant recipes | **`cva`, typed matrix** 🏆 | compose per call site | **`cva`, typed matrix** 🏆 | StyleX has no equivalent |
| Light/dark theming | **2 values per token** 🏆 | 3 values per token | 4 values per token | half of Panda's |
| Dynamic values | inline `style` | **custom property** 🏆 | inline `style` | others break the cascade |
| Register an `@property` | **`global.vars`** 🏆 | **`stylex.types.*`** 🏆 | **`globalVars`** 🏆 | all three; not via `globalCss` |
| Animate a registered property | **yes** 🏆 | declaration dropped | **yes** 🏆 | StyleX emits neither the keyframe nor the rule |
| **Correctness & maintenance** | | | | |
| Mistyped token name | **build fails** 🏆 | TS error, build succeeds | not caught at all | only engine that fails the build |
| Mistyped property name | **caught** (TS2561) 🏆 | ships `pading-block` | **caught** (TS2561) 🏆 | StyleX ships it |
| Delete a page → CSS shrinks | **−20.1%** 🏆 | −8.4% | −13.5% | reclaims the most |
| Class names folded to literals | **522 / 522** 🏆 | **453 / 458** 🏆 | 25 / 529 | Panda computes the rest in the browser, from a 14.7 KB runtime chunk |
| | | | | |
| **Rows won** 🏆 | **22** | **7** | **11** | of 28 scored |

---

## Where the main table doesn't generalise

Everything above is one app in one configuration. Two things move the answer: how many styles the app
has, and whether it ships more than light and dark.

### Style volume

The main table describes an app of 549 rule blocks. Real applications run an order of magnitude past
that, where fixed overhead stops mattering and marginal cost per rule becomes everything.

`tools/scale.mjs` generates *N* style definitions with all-distinct values and measures the emitted
stylesheet, isolating each engine's true cost per rule.

**Downloaded stylesheet, brotli, relative to Bamboo:**

| Style definitions | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 — the app as it ships | ref | +3.0% | +39.9% |
| 50 | ref | +18.0% | +35.4% |
| 200 | ref | +50.2% | +28.0% |
| 800 | ref | **+102.9%** | **+16.3%** |

Both challengers move, in opposite directions. **The ranking at the arena's size is not the ranking
at production size.**

| | Marginal cost per declaration | Gap to Bamboo at n=0 | at n=800 |
| --- | --- | --- | --- |
| Bamboo | 40.3 B raw · 2.0 B brotli | ref | ref |
| Panda | 40.3 B raw · 2.0 B brotli | +16,903 B | +16,903 B |
| StyleX | 65.8 B raw · 5.5 B brotli | +4,222 B | +126,621 B |

**Panda's marginal cost is identical to Bamboo's, to the byte.** Its whole penalty is a fixed
16,903 B of scaffolding — the same constant at 0 styles and at 800 — so "Panda ships 40% more CSS" is
a statement about a small app, not about Panda. StyleX is the reverse: almost pure slope, growing 30×
across the same range, because every rule carries `:not(#\#)` specificity padding that repeats per
declaration and compresses poorly.

### Theming

Brand themes are a different question from light/dark, and the arena app ships none — so this is
measured separately. `tools/theming.mjs` injects *N* themes through each engine's own multi-theme API
(Bamboo `theme.variants`, Panda `themes`, StyleX `createTheme`), each overriding the same 18 colours
with a light and a dark value.

**Stylesheet the browser downloads, brotli:**

| Brand themes | Bamboo | StyleX | Panda |
| --- | --- | --- | --- |
| 0 | 6,802 B | 7,008 B | 9,518 B |
| 2 | 6,802 B | 7,427 B | 9,518 B |
| 8 | 6,802 B | 8,350 B | 9,518 B |
| **added per theme** | **0 B** 🏆 | +168 B | **0 B** 🏆 |

**Theme payload, fetched only when a theme is selected:**

| Axis | Bamboo | StyleX | Panda | Margin |
| --- | --- | --- | --- | --- |
| Bytes per theme | **1,374 B** 🏆 | n/a — in the stylesheet | 2,805 B | −51% |
| Themes in the critical path | **none** 🏆 | all of them | **none** 🏆 | StyleX has no lazy option |

Two mechanisms, not three. Bamboo and Panda emit each theme as its own artifact, imported on demand,
so first load is flat however many exist. StyleX's `createTheme` compiles into the linked stylesheet,
so every visitor pays for every theme — at eight, its CSS is **19% larger** than at zero. Between the
two lazy engines the gap is the same encoding difference as the light/dark row: Bamboo writes `base`
and `_osDark` and lets `light-dark()` resolve the rest, Panda writes four values. That is **2.04× the
bytes per theme**.

This reverses for a site that ships one fixed brand theme and never switches: a lazy artifact is then
a second request for bytes the stylesheet would have carried anyway.

---

## What's measured

### Ground rules

- **One reference app.** `apps/bamboo` is the reference; every other is diffed against it, so all
  match each other transitively — element for element, then pixel for pixel.
- **Shared source is byte-identical.** `data.ts`, `icons.tsx` and `chart-utils.ts` are the same bytes
  in every app.
- **Same baseline reset.** Engines that ship one use theirs; engines that do not vendor Bamboo's
  `preflight` verbatim, so nobody gets a typography head start.
- **Default configuration only.** Each engine is measured as it ships. Opt-in settings are reported
  separately, never folded into the main table.

### Pages

Every app renders these six routes identically:

| Route | What it exercises |
| --- | --- |
| `/` | KPI grid, SVG bar chart + sparklines, activity feed, responsive 2-col dashboard |
| `/projects` | Data table, status badges, progress bars, toolbar, pagination |
| `/settings` | Sticky section nav, 2-col form grid, validation states, toggle switches, radio cards, danger zone, sticky save bar |
| `/pricing` | Featured pricing cards, billing toggle, comparison table, `<details>` FAQ |
| `/docs` | 3-column docs layout, prose typography, code block, callouts, table, TOC |
| `/lab` | Structural + relational selectors, keyframe motion, container queries |

All six are responsive across three breakpoints and support system dark mode plus an explicit
light/dark toggle.

---

## Reproducing this

Every number here comes from one contiguous measurement session on one machine. The harness, the
parity gate and the exact commands are in **[`RUNNING.md`](./RUNNING.md)**.

---

## FAQ

<details>
<summary><strong>Why is CSS minification disabled?</strong></summary>

`build.cssMinify: false` in all three apps. Vite's default runs Lightning CSS over the emitted
stylesheet and rewrites it — most visibly downlevelling `light-dark()` into a 54-variable polyfill
under the `baseline-widely-available` target. That measures the downleveller rather than the engine,
and penalises only engines emitting modern CSS. With it off, every stylesheet measured here is
exactly what its engine wrote.

StyleX still shows some Lightning CSS output because `@stylexjs/unplugin` depends on it directly —
that is part of its product, not the harness.

</details>
