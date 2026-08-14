// What does the dev server actually make the browser refetch after editing one
// shared style module? Counts requests and bytes, which is the fan-out cost.
//
//   node hmr-payload.mjs bamboo 4001
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const app = process.argv[2];
const port = Number(process.argv[3]);
const ROOT = new URL("../", import.meta.url).pathname;

const C = {
  bamboo: {
    file: `${ROOT}apps/bamboo/app/ui.ts`,
    from: `export const pageTitle = css({ fontSize: "25px"`,
    to: `export const pageTitle = css({ fontSize: "41px"`,
  },
  panda: {
    file: `${ROOT}apps/panda/app/ui.ts`,
    from: `export const pageTitle = css({ fontSize: "25px"`,
    to: `export const pageTitle = css({ fontSize: "41px"`,
  },
  stylex: {
    file: `${ROOT}apps/stylex/app/ui.ts`,
    from: `pageTitle: { fontSize: 25,`,
    to: `pageTitle: { fontSize: 41,`,
  },
}[app];

const original = readFileSync(C.file, "utf8");
if (!original.includes(C.from)) { console.error("anchor not found"); process.exit(1); }

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const reqs = [];
let recording = false;
page.on("response", async (res) => {
  if (!recording) return;
  const u = res.url();
  let len = 0;
  try { len = (await res.body()).length; } catch {}
  reqs.push({ url: u.replace(`http://localhost:${port}`, ""), len });
});

const read = () => page.evaluate(() => {
  const el = document.querySelector("h1");
  return el ? getComputedStyle(el).fontSize : null;
});

const before = await read();
recording = true;
writeFileSync(C.file, original.replace(C.from, C.to));

let waited = 0;
const t0 = performance.now();
while (waited < 15000) {
  const now = await read();
  if (now && now !== before) break;
  await new Promise((r) => setTimeout(r, 5));
  waited = performance.now() - t0;
}
await page.waitForTimeout(700);
recording = false;
writeFileSync(C.file, original);

const totalBytes = reqs.reduce((a, r) => a + r.len, 0);
const n = (x) => x.toLocaleString("en-US");
console.log(`\n=== ${app}: one edit to a shared style module ===`);
console.log(`  applied in           ${Math.round(waited)} ms`);
console.log(`  responses refetched  ${reqs.length}`);
console.log(`  bytes transferred    ${n(totalBytes)}`);
const groups = new Map();
for (const r of reqs) {
  const k = /\.css|bamboo\.css|stylex\.css/.test(r.url) ? "stylesheet"
    : /\/app\/routes\//.test(r.url) ? "route module"
    : /\/app\//.test(r.url) ? "app module"
    : "other";
  const e = groups.get(k) ?? { n: 0, b: 0 };
  e.n++; e.b += r.len; groups.set(k, e);
}
for (const [k, v] of [...groups].sort((a, b) => b[1].b - a[1].b)) {
  console.log(`    ${String(v.n).padStart(3)} × ${k.padEnd(13)} ${n(v.b).padStart(9)} B`);
}
console.log("  modules:");
for (const r of reqs.filter((r) => /\/app\//.test(r.url)).slice(0, 14)) {
  console.log(`    ${n(r.len).padStart(8)} B  ${r.url.split("?")[0]}`);
}

await browser.close();
