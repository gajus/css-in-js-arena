// Measures wall-clock from "style source saved" to "the browser has repainted
// with the new value", against a running dev server.
//
//   node hmr.mjs bamboo 4001
//   node hmr.mjs stylex 4002
//
// The edit is a plain style-object change to the shared `pageTitle` primitive —
// app source in both apps, and the most common dev-loop edit there is.
// (Bamboo does not hot-reload `cva` recipe edits at all; see cva-hmr.mjs.)
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const app = process.argv[2];
const port = Number(process.argv[3]);
const RUNS = Number(process.argv[4] ?? 5);
const ROOT = new URL("../", import.meta.url).pathname;

const TARGET = {
  bamboo: {
    file: `${ROOT}apps/bamboo/app/ui.ts`,
    from: `export const pageTitle = css({ fontSize: "25px"`,
    to: `export const pageTitle = css({ fontSize: "40px"`,
  },
  panda: {
    file: `${ROOT}apps/panda/app/ui.ts`,
    from: `export const pageTitle = css({ fontSize: "25px"`,
    to: `export const pageTitle = css({ fontSize: "40px"`,
  },
  stylex: {
    file: `${ROOT}apps/stylex/app/ui.ts`,
    from: `pageTitle: { fontSize: 25,`,
    to: `pageTitle: { fontSize: 40,`,
  },
}[app];

const original = readFileSync(TARGET.file, "utf8");
if (!original.includes(TARGET.from)) {
  console.error(`anchor not found in ${TARGET.file}`);
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });

const readSize = () =>
  page.evaluate(() => {
    const el = document.querySelector("h1");
    return el ? getComputedStyle(el).fontSize : null;
  });

const before = await readSize();
const times = [];

for (let i = 0; i < RUNS; i++) {
  const forward = i % 2 === 0;
  const next = forward ? original.replace(TARGET.from, TARGET.to) : original;
  const previous = await readSize();

  const t0 = performance.now();
  writeFileSync(TARGET.file, next);

  let waited = 0;
  while (waited < 20000) {
    const now = await readSize();
    if (now && now !== previous) break;
    await new Promise((r) => setTimeout(r, 10));
    waited = performance.now() - t0;
  }
  times.push(Math.round(performance.now() - t0));
  await new Promise((r) => setTimeout(r, 500));
}

writeFileSync(TARGET.file, original);
await browser.close();

const sorted = [...times].sort((a, b) => a - b);
console.log(
  `${app.padEnd(8)} css() edit → repaint: median ${sorted[Math.floor(sorted.length / 2)]} ms   runs: ${times.join(", ")} ms   (h1 was ${before})`,
);
