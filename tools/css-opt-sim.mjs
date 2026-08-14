// Simulates two candidate optimisations on the emitted stylesheet and reports
// what each is worth raw AND compressed. Compression is the number that counts:
// atomic CSS is repetitive, so raw savings often vanish under brotli.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";

const ROOT = new URL("../", import.meta.url).pathname;
const app = process.argv[2] ?? "bamboo";
const dir = join(ROOT, "apps", app, "build/client/assets");
const file = readdirSync(dir).find((f) => /^root-.*\.css$/.test(f));
const css = readFileSync(join(dir, file), "utf8");

const sizes = (s) => ({
  raw: s.length,
  gzip: gzipSync(s, { level: 9 }).length,
  brotli: brotliCompressSync(Buffer.from(s)).length,
});
const n = (x) => x.toLocaleString("en-US");
const base = sizes(css);

function parse(text) {
  const out = [];
  const walk = (t, chain) => {
    let depth = 0, start = 0, selEnd = -1;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === "{") { if (depth === 0) selEnd = i; depth++; }
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const head = t.slice(start, selEnd).trim();
          const body = t.slice(selEnd + 1, i);
          if (head.startsWith("@") && /[{]/.test(body)) walk(body, [...chain, head]);
          else out.push({ chain, head, body });
          start = i + 1;
        }
      }
    }
  };
  walk(text, []);
  return out;
}

const rules = parse(css);

// ---- A. group selectors that share an identical body within the same block ----
{
  const groups = new Map();
  for (const r of rules) {
    const k = `${r.chain.join("|")}||${r.body}`;
    (groups.get(k) ?? groups.set(k, []).get(k)).push(r.head);
  }
  let saved = 0;
  for (const [k, heads] of groups) {
    if (heads.length < 2) continue;
    const body = k.split("||")[1];
    // merging n rules into 1: drop (n-1) copies of "{body}" , add (n-1) commas
    saved += (heads.length - 1) * (body.length + 2) - (heads.length - 1);
  }
  const merged = css.length - saved;
  // build the actual merged text so compression is measured, not estimated
  let out = "";
  const emitted = new Set();
  const chainOf = new Map();
  for (const r of rules) {
    const k = `${r.chain.join("|")}||${r.body}`;
    if (emitted.has(k)) continue;
    emitted.add(k);
    const heads = groups.get(k);
    const chainKey = r.chain.join("|");
    if (!chainOf.has(chainKey)) chainOf.set(chainKey, []);
    chainOf.get(chainKey).push(`${heads.join(",")}{${r.body}}`);
  }
  for (const [chainKey, body] of chainOf) {
    const chain = chainKey ? chainKey.split("|") : [];
    out += chain.map((c) => `${c}{`).join("") + body.join("") + "}".repeat(chain.length);
  }
  const s = sizes(out);
  console.log(`\n=== A. group selectors sharing a body (${app}) ===`);
  console.log(`  before  ${n(base.raw)} raw · ${n(base.gzip)} gzip · ${n(base.brotli)} brotli`);
  console.log(`  after   ${n(s.raw)} raw · ${n(s.gzip)} gzip · ${n(s.brotli)} brotli`);
  console.log(`  saving  ${n(base.raw - s.raw)} raw (${(((base.raw - s.raw) / base.raw) * 100).toFixed(1)}%) · ` +
              `${n(base.gzip - s.gzip)} gzip (${(((base.gzip - s.gzip) / base.gzip) * 100).toFixed(1)}%) · ` +
              `${n(base.brotli - s.brotli)} brotli (${(((base.brotli - s.brotli) / base.brotli) * 100).toFixed(1)}%)`);
}

// ---- B. replace long escaped arbitrary-selector class names with short hashes ----
{
  const names = new Set();
  for (const m of css.matchAll(/\.((?:\\.|[\w-])+)/g)) names.add(m[1]);
  const long = [...names].filter((x) => x.includes("\\") && x.length > 12);
  let out = css;
  let i = 0;
  const map = new Map();
  for (const name of long.sort((a, b) => b.length - a.length)) {
    map.set(name, `b${(i++).toString(36)}`);
  }
  for (const [from, to] of map) {
    out = out.split("." + from).join("." + to);
  }
  const s = sizes(out);
  const totalLongBytes = long.reduce((a, x) => a + x.length, 0);
  console.log(`\n=== B. hash the escaped arbitrary-selector class names (${app}) ===`);
  console.log(`  escaped class names  ${long.length} distinct, ${n(totalLongBytes)} B of name text`);
  console.log(`  longest              ${long[0]?.slice(0, 72) ?? "—"}`);
  console.log(`  after   ${n(s.raw)} raw · ${n(s.gzip)} gzip · ${n(s.brotli)} brotli`);
  console.log(`  saving  ${n(base.raw - s.raw)} raw (${(((base.raw - s.raw) / base.raw) * 100).toFixed(1)}%) · ` +
              `${n(base.gzip - s.gzip)} gzip (${(((base.gzip - s.gzip) / base.gzip) * 100).toFixed(1)}%) · ` +
              `${n(base.brotli - s.brotli)} brotli (${(((base.brotli - s.brotli) / base.brotli) * 100).toFixed(1)}%)`);
}
console.log("");
