// Regression check: does Bamboo hot-reload a `cva` recipe edit?
//
// Broken in 1.38.0 — the compiler inlines a recipe's class string into the
// calling module, and Vite only soft-invalidates a static importer, so the
// stale class survived in the cached transform. Fixed in 1.39.0 (72abce3),
// which tracks compile-time dependencies and hard-invalidates the consumers.
//
// Usage: start the bamboo dev server on :4001, then `node cva-hmr.mjs`.
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const FILE = `${ROOT}apps/bamboo/app/ui.ts`;
const PORT = Number(process.argv[2] ?? 4001);

const EDITS = {
  "plain css()": {
    from: `export const pageTitle = css({ fontSize: "25px"`,
    to: `export const pageTitle = css({ fontSize: "40px"`,
    read: /<h1 class="([^"]*)"/,
    expect: "fs_40px",
  },
  "cva() variant": {
    from: `      true: { bg: "accentSoft", color: "accent", fontWeight: 600 },
      false: {
        bg: { base: "transparent", _hover: "surface2" },`,
    to: `      true: { bg: "accentSoft", color: "#0d9488", fontWeight: 600 },
      false: {
        bg: { base: "transparent", _hover: "surface2" },`,
    read: /<a [^>]*aria-current="page"[^>]*class="([^"]*)"/,
    expect: "c_#0d9488",
  },
};

const original = readFileSync(FILE, "utf8");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const classesFor = async (re) =>
  (await (await fetch(`http://localhost:${PORT}/`)).text()).match(re)?.[1] ?? "(not found)";

let failures = 0;

for (const [name, edit] of Object.entries(EDITS)) {
  if (!original.includes(edit.from)) {
    console.log(`${name.padEnd(14)} SKIP — anchor not found`);
    continue;
  }
  const before = await classesFor(edit.read);

  const t0 = performance.now();
  writeFileSync(FILE, original.replace(edit.from, edit.to));

  let applied = false;
  while (performance.now() - t0 < 15000) {
    if ((await classesFor(edit.read)).includes(edit.expect)) {
      applied = true;
      break;
    }
    await wait(100);
  }
  const ms = Math.round(performance.now() - t0);

  writeFileSync(FILE, original);
  await wait(2500);

  if (applied) {
    console.log(`${name.padEnd(14)} PASS  applied in ${ms} ms`);
  } else {
    failures++;
    console.log(`${name.padEnd(14)} FAIL  not applied after ${ms} ms`);
    console.log(`${" ".repeat(14)}       before: ${before}`);
    console.log(`${" ".repeat(14)}       after : ${await classesFor(edit.read)}`);
  }
}

writeFileSync(FILE, original);
console.log(failures ? `\n${failures} regression(s)` : "\nboth edit kinds hot-reload");
process.exit(failures ? 1 : 0);
