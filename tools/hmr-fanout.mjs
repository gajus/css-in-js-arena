// Is the HMR gap invalidation fan-out?
//
// Hypothesis: Bamboo inlines a resolved class string into the *calling* module,
// so editing a shared style module must hard-invalidate every consumer. StyleX
// derives class names from the style definition, so consumers never change.
//
// Test: edit a style in a leaf module (imported by nobody) and in a shared
// module (imported by 5–6), and compare.
//
//   node hmr-fanout.mjs bamboo 4001
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const app = process.argv[2];
const port = Number(process.argv[3]);
const RUNS = Number(process.argv[4] ?? 5);
const ROOT = new URL("../", import.meta.url).pathname;

const CASES = {
  bamboo: {
    leaf: {
      file: `${ROOT}apps/bamboo/app/routes/dashboard.tsx`,
      from: `  kpiValue: css({\n    fontSize: "23px",`,
      to: `  kpiValue: css({\n    fontSize: "31px",`,
      sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/bamboo/app/ui.ts`,
      from: `export const pageTitle = css({ fontSize: "25px"`,
      to: `export const pageTitle = css({ fontSize: "41px"`,
      sel: "h1",
    },
  },
  panda: {
    leaf: {
      file: `${ROOT}apps/panda/app/routes/dashboard.tsx`,
      from: `  kpiValue: css({\n    fontSize: "23px",`,
      to: `  kpiValue: css({\n    fontSize: "31px",`,
      sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/panda/app/ui.ts`,
      from: `export const pageTitle = css({ fontSize: "25px"`,
      to: `export const pageTitle = css({ fontSize: "41px"`,
      sel: "h1",
    },
  },
  stylex: {
    leaf: {
      file: `${ROOT}apps/stylex/app/routes/dashboard.tsx`,
      from: `  kpiValue: {\n    fontSize: 23,`,
      to: `  kpiValue: {\n    fontSize: 31,`,
      sel: "article span + span",
    },
    shared: {
      file: `${ROOT}apps/stylex/app/ui.ts`,
      from: `pageTitle: { fontSize: 25,`,
      to: `pageTitle: { fontSize: 41,`,
      sel: "h1",
    },
  },
}[app];

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });

for (const [kind, c] of Object.entries(CASES)) {
  const original = readFileSync(c.file, "utf8");
  if (!original.includes(c.from)) {
    console.log(`${app} ${kind}: anchor not found — skipped`);
    continue;
  }
  const read = () => page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? getComputedStyle(el).fontSize : null;
  }, c.sel);

  const times = [];
  for (let i = 0; i < RUNS; i++) {
    const next = i % 2 === 0 ? original.replace(c.from, c.to) : original;
    const prev = await read();
    const t0 = performance.now();
    writeFileSync(c.file, next);
    let waited = 0;
    while (waited < 15000) {
      const now = await read();
      if (now && now !== prev) break;
      await new Promise((r) => setTimeout(r, 5));
      waited = performance.now() - t0;
    }
    times.push(Math.round(performance.now() - t0));
    await new Promise((r) => setTimeout(r, 400));
  }
  writeFileSync(c.file, original);
  await new Promise((r) => setTimeout(r, 600));

  const sorted = [...times].sort((a, b) => a - b);
  console.log(`${app.padEnd(7)} ${kind.padEnd(7)} median ${String(sorted[Math.floor(sorted.length / 2)]).padStart(5)} ms   runs: ${times.join(", ")}`);
}

await browser.close();
