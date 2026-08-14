// Structural anatomy of an emitted stylesheet: where the bytes actually go.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";

const ROOT = new URL("../", import.meta.url).pathname;
const APPS = ["bamboo", "stylex"];

// Flatten into (atRuleChain, selector, body) triples.
function parse(css) {
  const out = [];
  const walk = (text, chain) => {
    let depth = 0, start = 0, selEnd = -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "{") { if (depth === 0) selEnd = i; depth++; }
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const head = text.slice(start, selEnd).trim();
          const body = text.slice(selEnd + 1, i);
          if (head.startsWith("@") && /[{]/.test(body)) walk(body, [...chain, head]);
          else out.push({ chain, head, body, bytes: i - start + 1 });
          start = i + 1;
        }
      }
    }
  };
  walk(css, []);
  return out;
}

const decls = (body) =>
  body.split(";").map((d) => d.trim()).filter(Boolean).filter((d) => !d.startsWith("--") || true);

const n = (x) => x.toLocaleString("en-US");

for (const app of APPS) {
  const dir = join(ROOT, "apps", app, "build/client/assets");
  const file = readdirSync(dir).find((f) => /^root-.*\.css$/.test(f));
  const css = readFileSync(join(dir, file), "utf8");
  const rules = parse(css);

  let selBytes = 0, bodyBytes = 0, declCount = 0;
  const declSeen = new Map();   // declaration text -> times emitted
  const propSeen = new Map();
  let multiDecl = 0;

  for (const r of rules) {
    selBytes += r.head.length;
    bodyBytes += r.body.length;
    const ds = decls(r.body);
    declCount += ds.length;
    if (ds.length > 1) multiDecl++;
    for (const d of ds) {
      declSeen.set(d, (declSeen.get(d) ?? 0) + 1);
      const p = d.split(":")[0].trim();
      propSeen.set(p, (propSeen.get(p) ?? 0) + 1);
    }
  }

  const dupDecls = [...declSeen.entries()].filter(([, c]) => c > 1);
  const dupCost = dupDecls.reduce((a, [d, c]) => a + d.length * (c - 1), 0);

  console.log(`\n================ ${app.toUpperCase()} — ${file} ================`);
  console.log(`  total                ${n(css.length)} B raw · ${n(gzipSync(css, { level: 9 }).length)} gzip · ${n(brotliCompressSync(Buffer.from(css)).length)} brotli`);
  console.log(`  rules                ${n(rules.length)}`);
  console.log(`  declarations         ${n(declCount)}  (${(declCount / rules.length).toFixed(2)} per rule; ${multiDecl} rules have >1)`);
  console.log(`  selector bytes       ${n(selBytes)}  (${((selBytes / css.length) * 100).toFixed(1)}% of sheet, ${(selBytes / rules.length).toFixed(1)} B/rule)`);
  console.log(`  declaration bytes    ${n(bodyBytes)}  (${((bodyBytes / css.length) * 100).toFixed(1)}%)`);
  console.log(`  distinct declarations ${n(declSeen.size)}; repeated ${n(dupDecls.length)} costing ${n(dupCost)} B`);

  const layers = new Set(rules.flatMap((r) => r.chain.filter((c) => c.startsWith("@layer"))));
  console.log(`  layers               ${[...layers].join(", ") || "none"}`);

  // at-rule chains and how much each costs
  const byChain = new Map();
  for (const r of rules) {
    const k = r.chain.filter((c) => !c.startsWith("@layer")).join(" › ") || "(top level)";
    const e = byChain.get(k) ?? { rules: 0, bytes: 0 };
    e.rules++; e.bytes += r.bytes;
    byChain.set(k, e);
  }
  console.log("  at-rule buckets:");
  for (const [k, v] of [...byChain.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 6)) {
    console.log(`    ${String(v.rules).padStart(4)} rules ${String(n(v.bytes)).padStart(7)} B  ${k.slice(0, 70)}`);
  }

  console.log("  most-repeated declarations:");
  for (const [d, c] of dupDecls.sort((a, b) => b[1] * b[0].length - a[1] * a[0].length).slice(0, 5)) {
    console.log(`    ×${String(c).padStart(3)}  ${d.slice(0, 58)}`);
  }
}
console.log("");
