// How each engine's output scales with distinct style volume.
//
// The arena app emits ~500 rule blocks. A real application is an order of
// magnitude past that — the production Bamboo build this was calibrated against
// carries 11,100. Fixed overhead (preflight, the token block, layer scaffolding)
// is a large share of 500 blocks and a rounding error at 11,000, so a margin
// measured on the arena app does not automatically survive the trip.
//
// This generates N distinct style definitions per engine, builds, and measures
// the emitted stylesheet. Values are deliberately all-distinct, so nothing
// dedupes and what is left is each engine's true marginal cost per rule: the
// class name, the selector, and the declaration syntax around it.
//
// That makes this a worst case, not a typical one. Real code reuses values and
// the atomic engines collapse those; the point here is the slope, not the total.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { ENGINES } from "./engines.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const COUNTS = [0, 50, 200, 800];

/** Properties every engine accepts in a style object, in camelCase. */
const DECLS = [
  (n) => `  paddingTop: "${100 + n}px",`,
  (n) => `  paddingBottom: "${200 + n}px",`,
  (n) => `  marginTop: "${300 + n}px",`,
  (n) => `  borderTopWidth: "${(n % 900) + 1000}px",`,
  (n) => `  fontSize: "${(n % 700) + 2000}px",`,
  (n) => `  letterSpacing: "${(n % 500) + 3000}px",`,
];

const styleBody = (i) => DECLS.map((d) => d(i)).join("\n");

/* -----------------------------------------------------------------------------
 * Per-engine generation
 *
 * Bamboo and Panda extract from any source file matching `include`, so a
 * generated module is picked up whether or not anything imports it. StyleX
 * transforms modules in the bundle graph, so its generated module has to be
 * imported and its styles referenced or the build drops them.
 * -----------------------------------------------------------------------------*/

const generated = {
  bamboo: (n) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const scaleStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  css({\n${styleBody(i)}\n  }),`).join("\n") +
    `\n];\n`,
  panda: (n) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const scaleStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  css({\n${styleBody(i)}\n  }),`).join("\n") +
    `\n];\n`,
  stylex: (n) =>
    `import * as stylex from "@stylexjs/stylex";\n\n` +
    `const s = stylex.create({\n` +
    Array.from({ length: n }, (_, i) => `  k${i}: {\n${styleBody(i)}\n  },`).join("\n") +
    `\n});\n\n` +
    `export const scaleStyles = [\n` +
    Array.from({ length: n }, (_, i) => `  stylex.props(s.k${i}),`).join("\n") +
    `\n];\n`,
};

const MODULE = "app/__scale.ts";

/** StyleX needs the generated module reachable from the graph; the other two do
 *  not, but importing it everywhere keeps the three apps doing the same thing. */
const anchorFile = "app/ui.ts";
const anchorLine = `\nexport { scaleStyles } from "./__scale";\n`;

const apply = (engine, dir, n) => {
  const modulePath = join(dir, MODULE);
  const anchorPath = join(dir, anchorFile);
  const anchorOriginal = readFileSync(anchorPath, "utf8");

  if (n === 0) {
    return () => {
      rmSync(modulePath, { force: true });
      writeFileSync(anchorPath, anchorOriginal);
    };
  }

  writeFileSync(modulePath, generated[engine](n));
  writeFileSync(anchorPath, anchorOriginal + anchorLine);

  return () => {
    rmSync(modulePath, { force: true });
    writeFileSync(anchorPath, anchorOriginal);
  };
};

/* -----------------------------------------------------------------------------
 * Measuring
 * -----------------------------------------------------------------------------*/

const measure = (dir) => {
  const assets = join(dir, "build/client/assets");
  if (!existsSync(assets)) return null;
  const buf = readdirSync(assets)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(assets, f)))
    .sort((a, b) => b.length - a.length)[0];
  if (!buf) return null;
  const text = buf.toString("utf8");
  return {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf).length,
    blocks: (text.match(/\{/g) || []).length,
  };
};

const build = (dir) => execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "pipe", encoding: "utf8" });

/* -----------------------------------------------------------------------------
 * Run
 * -----------------------------------------------------------------------------*/

const results = {};

for (const { name } of ENGINES) {
  const dir = join(ROOT, "apps", name);
  results[name] = [];

  for (const n of COUNTS) {
    const restore = apply(name, dir, n);
    try {
      build(dir);
      results[name].push({ n, ...measure(dir) });
      process.stderr.write(`  ${name} n=${n} ok\n`);
    } catch (error) {
      results[name].push({ n, failed: String(error.stderr || error.message).slice(0, 300) });
      process.stderr.write(`  ${name} n=${n} FAILED\n`);
    } finally {
      restore();
    }
  }

  build(dir);
}

/* -----------------------------------------------------------------------------
 * Report
 * -----------------------------------------------------------------------------*/

const pad = (s, w) => String(s).padStart(w);

console.log("\n================ STYLE VOLUME SCALING ================\n");
console.log(`  ${DECLS.length} all-distinct declarations per style definition. Worst case by`);
console.log("  construction: nothing dedupes, so this is marginal cost per rule.\n");

for (const [name, rows] of Object.entries(results)) {
  console.log(`${name}:`);
  console.log("    styles      raw     gzip   brotli   blocks");
  for (const r of rows) {
    if (r.failed) {
      console.log(`  ${pad(r.n, 8)}   BUILD FAILED — ${r.failed.split("\n")[0]}`);
      continue;
    }
    console.log(
      `  ${pad(r.n, 8)}   ${pad(r.raw, 6)}   ${pad(r.gzip, 6)}   ${pad(r.brotli, 6)}   ${pad(r.blocks, 6)}`,
    );
  }

  const ok = rows.filter((r) => !r.failed);
  const base = ok.find((r) => r.n === 0);
  const top = ok[ok.length - 1];
  if (base && top && top.n > 0) {
    const decls = top.n * DECLS.length;
    console.log(
      `    → ${((top.raw - base.raw) / decls).toFixed(1)} B raw / ` +
        `${((top.brotli - base.brotli) / decls).toFixed(1)} B brotli per declaration ` +
        `(${decls} declarations at n=${top.n})`,
    );
  }
  console.log("");
}

// The comparison that matters: do the margins measured on the arena app hold?
const at = (name, n) => results[name]?.find((r) => r.n === n && !r.failed);
const names = Object.keys(results);
console.log("--- margin vs reference, at each volume ---");
console.log("    styles   " + names.map((n) => n.padStart(10)).join(""));
for (const n of COUNTS) {
  const row = names.map((name) => {
    const r = at(name, n);
    const ref = at(names[0], n);
    if (!r || !ref) return "—".padStart(10);
    const pct = ((r.brotli - ref.brotli) / ref.brotli) * 100;
    return (name === names[0] ? "ref" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`).padStart(10);
  });
  console.log(`  ${pad(n, 8)}   ${row.join("")}`);
}
console.log("\n  Brotli of the downloaded stylesheet, relative to the reference engine.");
