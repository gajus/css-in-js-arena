// Bamboo compiles a `cva` call to a lookup over precomputed class strings.
// Every variant combination gets a FULL string, so the recipe's shared base
// classes are repeated once per combination. This measures that duplication.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";

const ROOT = new URL("../", import.meta.url).pathname;
const dir = join(ROOT, "apps/bamboo/build/client/assets");

// A bamboo class string: two or more `prop_value` tokens separated by spaces.
const CLASS_STR = /`((?:[a-zA-Z][\w-]*_[^\s`]+)(?: [^\s`]+){2,})`/g;

let totalStrings = 0, totalBytes = 0;
const all = [];

for (const f of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
  const src = readFileSync(join(dir, f), "utf8");
  for (const m of src.matchAll(CLASS_STR)) {
    all.push({ file: f, s: m[1], at: m.index });
    totalStrings++;
    totalBytes += m[1].length;
  }
}

// Group strings that sit adjacent in the source — those are one recipe's table.
all.sort((a, b) => (a.file === b.file ? a.at - b.at : a.file < b.file ? -1 : 1));
const groups = [];
let cur = null;
for (const x of all) {
  if (cur && cur.file === x.file && x.at - cur.end < 8) {
    cur.items.push(x.s);
    cur.end = x.at + x.s.length;
  } else {
    cur = { file: x.file, items: [x.s], end: x.at + x.s.length };
    groups.push(cur);
  }
}

const n = (x) => x.toLocaleString("en-US");
let wasted = 0;
const multi = groups.filter((g) => g.items.length > 1);

for (const g of multi) {
  const sets = g.items.map((s) => new Set(s.split(" ")));
  const shared = [...sets[0]].filter((t) => sets.every((s) => s.has(t)));
  const sharedBytes = shared.join(" ").length;
  g.shared = shared;
  g.sharedBytes = sharedBytes;
  g.waste = sharedBytes * (g.items.length - 1);
  wasted += g.waste;
}

console.log("\n=== Bamboo: precomputed variant tables in the client bundle ===");
console.log(`  class strings found        ${n(totalStrings)} (${n(totalBytes)} B)`);
console.log(`  multi-entry variant tables ${n(multi.length)}`);
console.log(`  bytes in repeated bases    ${n(wasted)} (${((wasted / totalBytes) * 100).toFixed(1)}% of class-string bytes)`);

console.log("\n  largest offenders:");
for (const g of multi.sort((a, b) => b.waste - a.waste).slice(0, 6)) {
  console.log(`    ${String(g.items.length).padStart(2)} variants · shared base ${String(g.sharedBytes).padStart(4)} B · wastes ${String(g.waste).padStart(5)} B  (${g.file})`);
  console.log(`        base: ${g.shared.join(" ").slice(0, 92)}`);
}

// what it would compress to if bases were hoisted
let before = "", after = "";
for (const g of multi) {
  before += g.items.join("|");
  after += g.shared.join(" ") + "|" + g.items.map((s) => s.split(" ").filter((t) => !g.shared.includes(t)).join(" ")).join("|");
}
const sz = (s) => ({ raw: s.length, gz: gzipSync(s, { level: 9 }).length, br: brotliCompressSync(Buffer.from(s)).length });
const b = sz(before), a = sz(after);
console.log(`\n  hoisting the shared base out of each table:`);
console.log(`    raw    ${n(b.raw)} → ${n(a.raw)}  (−${n(b.raw - a.raw)}, −${(((b.raw - a.raw) / b.raw) * 100).toFixed(1)}%)`);
console.log(`    gzip   ${n(b.gz)} → ${n(a.gz)}  (−${n(b.gz - a.gz)}, −${(((b.gz - a.gz) / b.gz) * 100).toFixed(1)}%)`);
console.log(`    brotli ${n(b.br)} → ${n(a.br)}  (−${n(b.br - a.br)}, −${(((b.br - a.br) / b.br) * 100).toFixed(1)}%)`);
console.log("");
