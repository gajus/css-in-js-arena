// Simulates a hybrid class-naming strategy for Bamboo.
//
// `hash` today is all-or-nothing, and measuring it showed why the default is
// right: semantic names repeat, so they compress away, while hashes are high
// entropy and cost brotli bytes. But that argument only holds for SHORT names.
// A class that encodes a whole gradient or a nested selector is ~100 B of
// unique text that never repeats — it gets none of the compression benefit and
// pays the full raw cost, in the stylesheet and in every element that uses it.
//
// This rewrites the built CSS and the served HTML with only names longer than a
// threshold replaced by short hashes, and measures what a browser downloads.
//
//   node hybrid-naming.mjs <app-dir> <port>
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { brotliCompressSync, gzipSync } from "node:zlib";

const APP = process.argv[2] ?? "../apps/bamboo";
const PORT = process.argv[3] ?? 3001;
const ROUTES = ["/", "/projects", "/settings", "/pricing", "/docs", "/lab"];

const assets = `${APP}/build/client/assets`;
const cssFile = readdirSync(assets).find((f) => f.endsWith(".css"));
const css = readFileSync(`${assets}/${cssFile}`, "utf8");
const pages = ROUTES.map((r) =>
  execSync(`curl -s --max-time 20 http://127.0.0.1:${PORT}${r}`, { maxBuffer: 60e6 }).toString(),
);

// Collect every class name the stylesheet defines. In CSS a class name runs to
// the first unescaped delimiter, so walk it rather than regexing.
function classNames(src) {
  const found = new Set();
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== ".") continue;
    if (i > 0 && /[\w\\-]/.test(src[i - 1])) continue;
    let j = i + 1;
    let name = "";
    while (j < src.length) {
      const c = src[j];
      if (c === "\\") {
        name += c + src[j + 1];
        j += 2;
        continue;
      }
      if (/[\s{},>+~:[\]()#."']/.test(c)) break;
      name += c;
      j++;
    }
    if (name.length > 1) found.add(name);
    i = j - 1;
  }
  return [...found];
}

const names = classNames(css);
// the unescaped form is what appears in a class attribute
const unescape = (n) => n.replace(/\\(.)/g, "$1");

const short = (n, i) =>
  "b" + createHash("sha1").update(n).digest("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);

const baseline = {
  css: brotliCompressSync(css).length,
  html: Math.round(pages.reduce((a, p) => a + gzipSync(p, { level: 9 }).length, 0) / pages.length),
  cssRaw: css.length,
  htmlRaw: Math.round(pages.reduce((a, p) => a + p.length, 0) / pages.length),
};

console.log(`\nbaseline: CSS ${baseline.cssRaw.toLocaleString()} B raw / ${baseline.css.toLocaleString()} B brotli` +
  ` · mean HTML ${baseline.htmlRaw.toLocaleString()} B raw / ${baseline.html.toLocaleString()} B gzip`);
console.log(`${names.length} distinct class names defined\n`);

console.log(`  ${"threshold".padEnd(12)} ${"hashed".padStart(7)} ${"CSS raw".padStart(9)} ${"CSS br".padStart(8)} ${"HTML gz".padStart(8)} ${"first load".padStart(11)}   vs baseline`);

const THRESHOLDS = [Infinity, 60, 45, 35, 28, 22, 16, 0];
for (const t of THRESHOLDS) {
  const targets = names.filter((n) => unescape(n).length > t);
  let c = css;
  let ps = [...pages];
  // longest first so no name is a prefix of another mid-replacement
  const sorted = [...targets].sort((a, b) => b.length - a.length);
  for (const [i, n] of sorted.entries()) {
    const s = short(n, i);
    c = c.split("." + n).join("." + s);
    const plain = unescape(n);
    ps = ps.map((p) => p.split(plain).join(s));
  }
  const cssBr = brotliCompressSync(c).length;
  const htmlGz = Math.round(ps.reduce((a, p) => a + gzipSync(p, { level: 9 }).length, 0) / ps.length);
  const first = cssBr + htmlGz;
  const baseFirst = baseline.css + baseline.html;
  const d = first - baseFirst;
  const label = t === Infinity ? "none" : t === 0 ? "all" : `> ${t} chars`;
  console.log(
    `  ${label.padEnd(12)} ${String(targets.length).padStart(7)} ${c.length.toLocaleString().padStart(9)} ${cssBr.toLocaleString().padStart(8)} ` +
      `${htmlGz.toLocaleString().padStart(8)} ${first.toLocaleString().padStart(11)}   ` +
      (t === Infinity ? "—" : `${d > 0 ? "+" : ""}${d.toLocaleString()} B (${((d / baseFirst) * 100).toFixed(1)}%)`),
  );
}
console.log("");
