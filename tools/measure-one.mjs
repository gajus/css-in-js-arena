// Measures the CSS + SSR HTML of whichever build is currently being served.
// Emits one JSON line so a shell driver can sweep configurations.
//
//   node measure-one.mjs <app> <port> <label>
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

const [app, port, label] = process.argv.slice(2);
const ROOT = new URL("../", import.meta.url).pathname;
const ROUTES = [["dashboard", "/"], ["projects", "/projects"], ["docs", "/docs"]];

const size = (buf) => ({
  raw: buf.length,
  gzip: gzipSync(buf, { level: 9 }).length,
  brotli: brotliCompressSync(buf).length,
});
const get = (path) =>
  execSync(`curl -s --max-time 20 http://127.0.0.1:${port}${path}`, { maxBuffer: 60e6 });

const html = get("/").toString();
const href = html.match(/href="(\/assets\/[^"]+\.css)"/)?.[1];
if (!href) {
  console.error("no stylesheet link in the served document");
  process.exit(1);
}
const css = size(readFileSync(`${ROOT}apps/${app}/build/client${href}`));

const pages = {};
for (const [name, path] of ROUTES) {
  const doc = get(path);
  pages[name] = {
    ...size(doc),
    classBytes: (doc.toString().match(/class="[^"]*"/g) || []).join("").length,
  };
}

console.log(JSON.stringify({ label, css, pages }));
