// Measures only what a browser actually downloads: the stylesheet and scripts
// referenced by the server-rendered HTML, not everything sitting in build/.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

import { ENGINES } from "./engines.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const APPS = ENGINES.map((e) => [e.name, e.port]);
const ROUTES = [["dashboard", "/"], ["projects", "/projects"], ["settings", "/settings"], ["pricing", "/pricing"], ["docs", "/docs"], ["lab", "/lab"]];

const size = (buf) => ({
  raw: buf.length,
  gzip: gzipSync(buf, { level: 9 }).length,
  brotli: brotliCompressSync(buf).length,
});
const n = (x) => x.toLocaleString("en-US");
const get = (port, path) => execSync(`curl -s http://127.0.0.1:${port}${path}`, { maxBuffer: 60e6 });

const out = {};

for (const [app, port] of APPS) {
  const html = get(port, "/").toString();

  const cssHref = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  const jsSrc = [...new Set([
    ...[...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/href="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]),
  ])];

  const cssBuf = Buffer.concat(cssHref.map((h) => readFileSync(`${ROOT}apps/${app}/build/client${h}`)));
  const jsBuf = Buffer.concat(jsSrc.map((h) => readFileSync(`${ROOT}apps/${app}/build/client${h}`)));

  const cssText = cssBuf.toString();
  out[app] = {
    cssHref,
    css: size(cssBuf),
    rules: (cssText.match(/(^|\})[^{}@]+\{/g) || []).length,
    jsCount: jsSrc.length,
    js: size(jsBuf),
    html: {},
  };

  for (const [name, path] of ROUTES) {
    const doc = get(port, path);
    const classBytes = (doc.toString().match(/class="[^"]*"/g) || []).join("").length;
    out[app].html[name] = { ...size(doc), classBytes };
  }
}

const NAMES = APPS.map(([name]) => name);
const W = 13;

const row = (label, pick, unit = "B") => {
  const vals = NAMES.map((name) => pick(out[name]));
  const cells = vals.map((v) => `${n(v)} ${unit}`.padStart(W));
  // Deltas are always against the reference (the first engine listed).
  const base = vals[0];
  const deltas = vals.slice(1).map((v, i) => {
    const d = v - base;
    const pct = base ? ((d / base) * 100).toFixed(1) : "—";
    return `${NAMES[i + 1]} ${d > 0 ? "+" : ""}${pct}%`;
  });
  console.log(`  ${label.padEnd(26)}${cells.join("")}   ${deltas.join("  ")}`);
};

const header = () => {
  console.log("\n  " + "metric".padEnd(26) + NAMES.map((x) => x.padStart(W)).join("") + `   vs ${NAMES[0]}`);
  console.log("  " + "-".repeat(28 + W * NAMES.length + 24));
};

header();
console.log("\n  CSS actually downloaded (one stylesheet per app):");
row("raw", (o) => o.css.raw);
row("gzip -9", (o) => o.css.gzip);
row("brotli", (o) => o.css.brotli);
row("CSS rules", (o) => o.rules, " ");

console.log("\n  Client JS referenced by the document:");
row("raw", (o) => o.js.raw);
row("gzip -9", (o) => o.js.gzip);
row("brotli", (o) => o.js.brotli);

console.log("\n  SSR HTML, gzipped (per route):");
for (const [name] of ROUTES) row(name, (o) => o.html[name].gzip);

console.log("\n  Bytes spent on class attributes in the HTML (raw):");
for (const [name] of ROUTES) row(name, (o) => o.html[name].classBytes);
row("— total", (o) => ROUTES.reduce((a, [r]) => a + o.html[r].classBytes, 0));

console.log("\n  First paint blocking bytes = CSS(brotli) + HTML(gzip), dashboard:");
row("critical path", (o) => o.css.brotli + o.html.dashboard.gzip);

const meanHtml = (o) => ROUTES.reduce((a, [r]) => a + o.html[r].gzip, 0) / ROUTES.length;
console.log("\n  SSR HTML, gzip (mean of 5):");
row("mean", (o) => Math.round(meanHtml(o)));

console.log("\n  Full first load (CSS brotli + JS brotli + mean HTML gzip):");
row("total", (o) => Math.round(o.css.brotli + o.js.brotli + meanHtml(o)));
console.log("");
