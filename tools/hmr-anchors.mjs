// Which file, and which exact string, each engine's HMR probes edit.
//
// Single source of truth for hmr-trace.mjs and hmr-phases.mjs, so the two
// cannot describe different edits while claiming to describe the same one.
// Adding an engine means one entry here, not one per tool.
//
//   file   absolute path to edit
//   from   the exact substring to replace (must appear verbatim, once)
//   mk     given a font-size, the replacement text
//   base   the value `from` carries, i.e. the committed state
//   first  the first probe value to write
//   sel    a selector for an element the edit visibly changes
const ROOT = new URL("..", import.meta.url).pathname;

export const CASES = {
  bamboo: {
    leaf: {
      file: `${ROOT}apps/bamboo/app/routes/dashboard.tsx`,
      from: `  kpiValue: css({\n    fontSize: "23px",`,
      mk: (v) => `  kpiValue: css({\n    fontSize: "${v}px",`,
      base: 23, first: 31, sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/bamboo/app/ui.ts`,
      from: `export const pageTitle = css({ fontSize: "25px"`,
      mk: (v) => `export const pageTitle = css({ fontSize: "${v}px"`,
      base: 25, first: 41, sel: "h1",
    },
  },
  panda: {
    leaf: {
      file: `${ROOT}apps/panda/app/routes/dashboard.tsx`,
      from: `  kpiValue: css({\n    fontSize: "23px",`,
      mk: (v) => `  kpiValue: css({\n    fontSize: "${v}px",`,
      base: 23, first: 31, sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/panda/app/ui.ts`,
      from: `export const pageTitle = css({ fontSize: "25px"`,
      mk: (v) => `export const pageTitle = css({ fontSize: "${v}px"`,
      base: 25, first: 41, sel: "h1",
    },
  },
  stylex: {
    leaf: {
      file: `${ROOT}apps/stylex/app/routes/dashboard.tsx`,
      from: `  kpiValue: {\n    fontSize: 23,`,
      mk: (v) => `  kpiValue: {\n    fontSize: ${v},`,
      base: 23, first: 31, sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/stylex/app/ui.ts`,
      from: `pageTitle: { fontSize: 25,`,
      mk: (v) => `pageTitle: { fontSize: ${v},`,
      base: 25, first: 41, sel: "h1",
    },
  },
};
