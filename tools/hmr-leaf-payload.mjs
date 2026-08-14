// What does the dev server refetch after editing a LEAF module (a route file
// nothing else imports)? hmr-payload.mjs covers the shared-module case; this is
// the other half, and the one developers hit most often.
//
//   node hmr-leaf-payload.mjs bamboo 4001
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const app = process.argv[2];
const port = Number(process.argv[3]);
const ROOT = new URL("../", import.meta.url).pathname;

const C = {
  bamboo: {
    file: `${ROOT}apps/bamboo/app/routes/dashboard.tsx`,
    from: `  kpiValue: css({\n    fontSize: "23px",`,
    to: `  kpiValue: css({\n    fontSize: "31px",`,
  },
  panda: {
    file: `${ROOT}apps/panda/app/routes/dashboard.tsx`,
    from: `  kpiValue: css({\n    fontSize: "23px",`,
    to: `  kpiValue: css({\n    fontSize: "31px",`,
  },
  stylex: {
    file: `${ROOT}apps/stylex/app/routes/dashboard.tsx`,
    from: `  kpiValue: {\n    fontSize: 23,`,
    to: `  kpiValue: {\n    fontSize: 31,`,
  },
}[app];

const original = readFileSync(C.file, "utf8");
if (!original.includes(C.from)) {
  console.error(`anchor not found in ${C.file}`);
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const reqs = [];
let recording = false;
page.on("response", async (res) => {
  if (!recording) return;
  let len = 0;
  try { len = (await res.body()).length; } catch {}
  reqs.push({ url: res.url().replace(`http://localhost:${port}`, ""), len });
});

const read = () => page.evaluate(() => {
  const el = document.querySelector("article span + span");
  return el ? getComputedStyle(el).fontSize : null;
});

const before = await read();
recording = true;
writeFileSync(C.file, original.replace(C.from, C.to));

const t0 = performance.now();
let waited = 0;
while (waited < 15000) {
  const now = await read();
  if (now && now !== before) break;
  await new Promise((r) => setTimeout(r, 5));
  waited = performance.now() - t0;
}
await page.waitForTimeout(700);
recording = false;
writeFileSync(C.file, original);

const n = (x) => x.toLocaleString("en-US");
const total = reqs.reduce((a, r) => a + r.len, 0);
console.log(`\n=== ${app}: one edit to a LEAF route module ===`);
console.log(`  applied in           ${Math.round(waited)} ms`);
console.log(`  responses refetched  ${reqs.length}`);
console.log(`  bytes transferred    ${n(total)}`);
const seen = new Map();
for (const r of reqs.filter((r) => /\/app\/|\.css/.test(r.url))) {
  const k = r.url.split("?")[0];
  const e = seen.get(k) ?? { n: 0, b: 0 };
  e.n++; e.b += r.len; seen.set(k, e);
}
for (const [k, v] of [...seen].sort((a, b) => b[1].b - a[1].b)) {
  console.log(`    ${String(v.n).padStart(2)}× ${n(v.b).padStart(8)} B  ${k}`);
}

await browser.close();
