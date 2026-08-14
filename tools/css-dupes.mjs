// Where does Bamboo emit the same declaration more than once, and is the
// duplication necessary (different condition) or redundant (same condition)?
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname;
const app = process.argv[2] ?? "bamboo";

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
          else out.push({ chain, head, body });
          start = i + 1;
        }
      }
    }
  };
  walk(css, []);
  return out;
}

const dir = join(ROOT, "apps", app, "build/client/assets");
const file = readdirSync(dir).find((f) => /^root-.*\.css$/.test(f));
const rules = parse(readFileSync(join(dir, file), "utf8"));

// key = declaration + full condition chain. Same key twice = redundant.
const byDeclAndCondition = new Map();
const byDeclOnly = new Map();

for (const r of rules) {
  const cond = r.chain.filter((c) => !c.startsWith("@layer")).join(" && ") || "(none)";
  const layer = r.chain.find((c) => c.startsWith("@layer")) ?? "(unlayered)";
  for (const d of r.body.split(";").map((s) => s.trim()).filter(Boolean)) {
    const k1 = `${cond}||${d}`;
    (byDeclAndCondition.get(k1) ?? byDeclAndCondition.set(k1, []).get(k1)).push({ sel: r.head, layer, cond, d });
    (byDeclOnly.get(d) ?? byDeclOnly.set(d, []).get(d)).push({ sel: r.head, layer, cond });
  }
}

const redundant = [...byDeclAndCondition.entries()].filter(([, v]) => v.length > 1);
const wastedBytes = redundant.reduce((a, [k, v]) => a + k.split("||")[1].length * (v.length - 1), 0);

console.log(`\n=== ${app}: identical declaration under an identical condition ===`);
console.log(`groups: ${redundant.length}   redundant declaration bytes: ${wastedBytes}\n`);

// classify: same layer or across layers?
let sameLayer = 0, crossLayer = 0;
for (const [, v] of redundant) {
  const layers = new Set(v.map((x) => x.layer));
  if (layers.size === 1) sameLayer++; else crossLayer++;
}
console.log(`  within one layer : ${sameLayer} groups`);
console.log(`  across layers    : ${crossLayer} groups\n`);

for (const [k, v] of redundant.sort((a, b) => b[1].length * b[0].length - a[1].length * a[0].length).slice(0, 12)) {
  const decl = k.split("||")[1];
  console.log(`  ×${v.length}  ${decl.slice(0, 60)}`);
  for (const x of v.slice(0, 4)) console.log(`        ${x.layer.padEnd(18)} ${x.sel.slice(0, 66)}`);
}

// how many declarations differ ONLY by condition (legitimate)
const condOnly = [...byDeclOnly.entries()].filter(([, v]) => v.length > 1 && new Set(v.map((x) => x.cond)).size === v.length);
console.log(`\n  legitimately repeated under different conditions: ${condOnly.length} groups`);
