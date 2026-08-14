// How much of the single shipped stylesheet does one route actually need?
// Quantifies the headroom for route-level CSS splitting.
//
//   node route-coverage.mjs <app-dir> <port>
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { brotliCompressSync } from "node:zlib";

const APP = process.argv[2] ?? "../apps/bamboo";
const PORT = process.argv[3] ?? 3001;
const ROUTES = [["dashboard", "/"], ["projects", "/projects"], ["settings", "/settings"], ["pricing", "/pricing"], ["docs", "/docs"], ["lab", "/lab"]];

const assets = `${APP}/build/client/assets`;
const css = readFileSync(`${assets}/${readdirSync(assets).find((f) => f.endsWith(".css"))}`, "utf8");

// utilities layer only — reset/tokens/base are needed everywhere
function layer(name) {
  const i = css.indexOf(`@layer ${name}`);
  if (i < 0) return "";
  let d = 0;
  const start = css.indexOf("{", i);
  for (let j = start; j < css.length; j++) {
    if (css[j] === "{") d++;
    else if (css[j] === "}" && --d === 0) return css.slice(start + 1, j);
  }
  return "";
}
const utilities = layer("utilities");

// split the layer into top-level rules, keeping @media/@supports wrappers whole
function rules(src) {
  const out = [];
  let d = 0;
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === "{") d++;
    else if (src[i] === "}" && --d === 0) {
      out.push(src.slice(start, i + 1));
      start = i + 1;
    }
  }
  return out.map((r) => r.trim()).filter(Boolean);
}
const allRules = rules(utilities);

const classesIn = (html) =>
  new Set(
    (html.match(/class="([^"]*)"/g) || [])
      .flatMap((m) => m.slice(7, -1).split(/\s+/))
      .filter(Boolean),
  );

// a rule is "used" if any class it defines appears in the document
const ruleClasses = allRules.map((r) => {
  const names = new Set();
  for (let i = 0; i < r.length; i++) {
    if (r[i] !== ".") continue;
    if (i > 0 && /[\w\\-]/.test(r[i - 1])) continue;
    let j = i + 1;
    let name = "";
    while (j < r.length) {
      const c = r[j];
      if (c === "\\") { name += r[j + 1]; j += 2; continue; }
      if (/[\s{},>+~:[\]()#."']/.test(c)) break;
      name += c;
      j++;
    }
    if (name.length > 1) names.add(name);
    i = j - 1;
  }
  return names;
});

const n = (x) => x.toLocaleString("en-US");
const totalBr = brotliCompressSync(utilities).length;
console.log(`\nutilities layer: ${n(utilities.length)} B raw · ${n(totalBr)} B brotli · ${allRules.length} rules\n`);
console.log(`  ${"route".padEnd(12)} ${"rules used".padStart(11)} ${"raw kept".padStart(10)} ${"brotli".padStart(9)}   ${"share".padStart(6)}`);

const union = new Set();
for (const [name, path] of ROUTES) {
  const html = execSync(`curl -s --max-time 20 http://127.0.0.1:${PORT}${path}`, { maxBuffer: 60e6 }).toString();
  const used = classesIn(html);
  used.forEach((c) => union.add(c));
  const kept = allRules.filter((_, i) => [...ruleClasses[i]].some((c) => used.has(c)));
  const keptCss = kept.join("");
  const br = brotliCompressSync(keptCss).length;
  console.log(
    `  ${name.padEnd(12)} ${String(kept.length).padStart(11)} ${n(keptCss.length).padStart(10)} ${n(br).padStart(9)}   ${((br / totalBr) * 100).toFixed(0).padStart(5)}%`,
  );
}

const everUsed = allRules.filter((_, i) => [...ruleClasses[i]].some((c) => union.has(c)));
console.log(
  `\n  ${"all 5 routes".padEnd(12)} ${String(everUsed.length).padStart(11)} ${n(everUsed.join("").length).padStart(10)} ${n(brotliCompressSync(everUsed.join("")).length).padStart(9)}`,
);
const dead = allRules.length - everUsed.length;
if (dead > 0) console.log(`  ${dead} rule(s) no route references — hover/focus/responsive states not in the served markup.`);
console.log("");
