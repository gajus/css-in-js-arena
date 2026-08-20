// What an engine emits for a file that matches its `include` glob but that
// nothing imports.
//
// Bamboo and Panda extract from source text: any file matching `include` is
// scanned, so a module left behind by a deleted feature keeps shipping its CSS.
// StyleX transforms modules in the bundle graph, so an unreferenced module is
// invisible to it and costs nothing.
//
// The fixture is deliberately the same one `scale.mjs` uses at n=50 — 50 style
// definitions of 6 all-distinct declarations each — so the number here is
// directly comparable to that table's n=50 row. The magnitude is a property of
// the fixture; the finding is which engines are at zero.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { ENGINES } from "./engines.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const COUNT = 50;
const MODULE = "app/__orphan.ts";

/** Same declaration set as scale.mjs, so the two measurements line up. */
const DECLS = [
  (n) => `  paddingTop: "${100 + n}px",`,
  (n) => `  paddingBottom: "${200 + n}px",`,
  (n) => `  marginTop: "${300 + n}px",`,
  (n) => `  borderTopWidth: "${(n % 900) + 1000}px",`,
  (n) => `  fontSize: "${(n % 700) + 2000}px",`,
  (n) => `  letterSpacing: "${(n % 500) + 3000}px",`,
];

const styleBody = (i) => DECLS.map((d) => d(i)).join("\n");

const generated = {
  bamboo: (n) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const orphanStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  css({\n${styleBody(i)}\n  }),`).join("\n") +
    `\n];\n`,
  panda: (n) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const orphanStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  css({\n${styleBody(i)}\n  }),`).join("\n") +
    `\n];\n`,
  stylex: (n) =>
    `import * as stylex from "@stylexjs/stylex";\n\n` +
    `const s = stylex.create({\n` +
    Array.from({ length: n }, (_, i) => `  k${i}: {\n${styleBody(i)}\n  },`).join("\n") +
    `\n});\n\n` +
    `export const orphanStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  stylex.props(s.k${i}),`).join("\n") +
    `\n];\n`,
};

const measure = (dir) => {
  const assets = join(dir, "build/client/assets");
  if (!existsSync(assets)) return null;
  const buf = readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(assets, f)))
    .sort((a, b) => b.length - a.length)[0];
  if (!buf) return null;
  return {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf).length,
  };
};

const build = (dir) => execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "pipe", encoding: "utf8" });

const results = {};

for (const engine of ENGINES) {
  const dir = join(ROOT, "apps", engine.name);
  const modulePath = join(dir, MODULE);

  // The module is written but never imported — that is the whole point.
  rmSync(modulePath, { force: true });
  build(dir);
  const before = measure(dir);

  writeFileSync(modulePath, generated[engine.name](COUNT));
  try {
    build(dir);
    results[engine.name] = { before, after: measure(dir) };
  } finally {
    rmSync(modulePath, { force: true });
    build(dir);
  }
  console.log(`  ${engine.name} ok`);
}

console.log(`\n================ ORPHAN MODULE ================\n`);
console.log(
  `  ${COUNT} style definitions in a file matching \`include\` that nothing imports.\n`,
);
console.log("    engine     before      after      added raw    added brotli");
for (const engine of ENGINES) {
  const r = results[engine.name];
  if (!r?.before || !r?.after) continue;
  const raw = r.after.raw - r.before.raw;
  const brotli = r.after.brotli - r.before.brotli;
  console.log(
    `    ${engine.name.padEnd(9)} ${String(r.before.raw).padStart(8)}  ${String(r.after.raw).padStart(9)}  ${(
      raw > 0 ? `+${raw}` : `${raw}`
    ).padStart(11)}  ${(brotli > 0 ? `+${brotli}` : `${brotli}`).padStart(14)}`,
  );
}
console.log();
