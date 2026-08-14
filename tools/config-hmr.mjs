// Regression check: does editing bamboo.config.ts reach the running dev server?
//
// Before 1.39.0 nothing told Vite the config mattered, so a token edit did
// nothing until an unrelated source change happened to touch the graph.
// 1.39.0 (ae53479) declares the config through Vite's own config-file list, so
// the change triggers a full dev-server restart.
//
// Usage: start the bamboo dev server on :4001, then `node config-hmr.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ROOT = new URL("../", import.meta.url).pathname;
const FILE = `${ROOT}apps/bamboo/bamboo.config.ts`;
const PORT = Number(process.argv[2] ?? 4001);

const FROM = `          accent: { value: { base: "#4f46e5", _osDark: "#818cf8" } },`;
const TO = `          accent: { value: { base: "#0d9488", _osDark: "#818cf8" } },`;

const original = readFileSync(FILE, "utf8");
if (!original.includes(FROM)) {
  console.error("anchor not found in bamboo.config.ts");
  process.exit(1);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext()).newPage();

// A dev-server restart drops the socket, so reload rather than trusting HMR.
async function accent({ reload = true } = {}) {
  try {
    if (reload) await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle", timeout: 10000 });
    return await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--colors-accent").trim(),
    );
  } catch {
    return "(server restarting)";
  }
}

console.log("accent before :", await accent());

const t0 = performance.now();
writeFileSync(FILE, original.replace(FROM, TO));

let applied = false;
while (performance.now() - t0 < 45000) {
  const now = await accent();
  if (now.includes("0d9488")) {
    applied = true;
    break;
  }
  await wait(500);
}
const ms = Math.round(performance.now() - t0);
console.log("accent after  :", applied ? "#0d9488" : await accent());

writeFileSync(FILE, original);
await wait(4000);
console.log("accent restored:", await accent());
await browser.close();

console.log(
  applied
    ? `\nPASS  config edit reached the dev server in ${ms} ms`
    : `\nFAIL  no effect after ${ms} ms`,
);
process.exit(applied ? 0 : 1);
