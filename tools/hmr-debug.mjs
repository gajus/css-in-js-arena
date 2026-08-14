// Distinguishes "HMR did not apply" from "dev styling is broken entirely".
//   node hmr-debug.mjs bamboo 4001
//   node hmr-debug.mjs stylex 4002
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const app = process.argv[2];
const port = Number(process.argv[3]);
const ROOT = new URL("../", import.meta.url).pathname;

const TARGET = {
  bamboo: {
    file: `${ROOT}apps/bamboo/app/ui.ts`,
    from: `      true: { bg: "accentSoft", color: "accent", fontWeight: 600 },
      false: {
        bg: { base: "transparent", _hover: "surface2" },`,
    to: `      true: { bg: "accentSoft", color: "#0d9488", fontWeight: 600 },
      false: {
        bg: { base: "transparent", _hover: "surface2" },`,
  },
  stylex: {
    file: `${ROOT}apps/stylex/app/root.tsx`,
    from: `  navLinkActive: {
    backgroundColor: { default: t.accentSoft, ":hover": t.accentSoft },
    color: { default: t.accent, ":hover": t.accent },`,
    to: `  navLinkActive: {
    backgroundColor: { default: t.accentSoft, ":hover": t.accentSoft },
    color: { default: "#0d9488", ":hover": "#0d9488" },`,
  },
}[app];

const original = readFileSync(TARGET.file, "utf8");
if (!original.includes(TARGET.from)) {
  console.error(`anchor not found in ${TARGET.file}`);
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await (await browser.newContext()).newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("  [browser error]", m.text().slice(0, 150));
});

await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
const read = () =>
  page.evaluate(() => {
    const el = document.querySelector('a[aria-current="page"]');
    return el ? getComputedStyle(el).color : "NO ELEMENT";
  });

console.log("1. initial active-link colour :", await read());
console.log(
  "2. stylesheets on page        :",
  await page.evaluate(() =>
    [...document.styleSheets].map((s) => (s.href ? s.href.split("/").pop() : "inline")).join(", "),
  ),
);

writeFileSync(TARGET.file, original.replace(TARGET.from, TARGET.to));
console.log("3. source written, waiting 10s for HMR…");
await new Promise((r) => setTimeout(r, 10000));
console.log("4. colour after HMR wait      :", await read());

await page.reload({ waitUntil: "networkidle" });
console.log("5. colour after hard reload   :", await read());

writeFileSync(TARGET.file, original);
await new Promise((r) => setTimeout(r, 3000));
await page.reload({ waitUntil: "networkidle" });
console.log("6. colour after revert        :", await read());

await browser.close();
