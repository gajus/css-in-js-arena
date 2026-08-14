// Which bamboo selectors can an app author override with a single class?
// A plain class is (0,1,0); anything strictly above that cannot be beaten by
// one and has to be fought by duplicating the framework's own selector.
//
//   node specificity.mjs path/to/bamboo.min.css
import { readFileSync } from "node:fs";

const css = readFileSync(process.argv[2], "utf8");
const pairs = [...css.matchAll(/(^|\}|\{)([^{}@]+)\{/g)].map((m) => m[2].trim()).filter(Boolean);

// Selectors Level 4 §17: :not()/:is()/:has() take the specificity of their most
// specific argument, and each occurrence contributes independently. :where() is 0.
function spec(sel) {
  let s = ` ${sel.trim()} `;
  if (!s.trim()) return null;

  let a = 0, b = 0, c = 0;

  s = s.replace(/:where\([^()]*\)/g, " ");

  for (const m of s.matchAll(/:(?:not|is|has)\(([^()]*)\)/g)) {
    let best = { a: 0, b: 0, c: 0 };
    for (const arg of m[1].split(",")) {
      const t = spec(arg);
      if (!t) continue;
      if (t.a * 100 + t.b * 10 + t.c > best.a * 100 + best.b * 10 + best.c) best = t;
    }
    a += best.a; b += best.b; c += best.c;
  }
  s = s.replace(/:(?:not|is|has)\([^()]*\)/g, " ");

  c += (s.match(/::[a-z-]+/g) || []).length;      // pseudo-elements
  s = s.replace(/::[a-z-]+/g, " ");

  a += (s.match(/#[\w-]+/g) || []).length;        // ids
  s = s.replace(/#[\w-]+/g, " ");

  b += (s.match(/\.[\w-]+/g) || []).length;       // classes
  s = s.replace(/\.[\w-]+/g, " ");

  b += (s.match(/\[[^\]]+\]/g) || []).length;     // attributes
  s = s.replace(/\[[^\]]+\]/g, " ");

  b += (s.match(/:[a-z-]+/g) || []).length;       // pseudo-classes
  s = s.replace(/:[a-z-]+/g, " ");

  c += (s.match(/(?:^|[\s>+~])([a-z][\w-]*)/gi) || []).length; // type selectors

  return { a, b, c };
}

const rows = [];
for (const p of pairs) {
  for (const sel of p.split(",")) {
    const t = sel.trim();
    if (!t || t.includes(":root")) continue;
    const s = spec(t);
    rows.push({ sel: t, ...s, score: s.a * 100 + s.b * 10 + s.c });
  }
}

const CLASS = 10; // (0,1,0)
const above = rows.filter((r) => r.score > CLASS);
const uniq = [...new Map(above.map((r) => [r.sel, r])).values()].sort((x, y) => y.score - x.score);

console.log(`selectors parsed          : ${rows.length}`);
console.log(`strictly above one class  : ${above.length}  (${((above.length / rows.length) * 100).toFixed(0)}%)`);
console.log(`   ...distinct            : ${uniq.length}`);
console.log("\nan app class cannot override these — worst first:\n");
for (const r of uniq) console.log(`  (${r.a},${r.b},${r.c})  ${r.sel}`);
