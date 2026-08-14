import { execSync } from "node:child_process";
import { gzipSync, brotliCompressSync } from "node:zlib";
const ROUTES = [["dashboard","/"],["projects","/projects"],["settings","/settings"],["pricing","/pricing"],["docs","/docs"],["lab","/lab"]];
const n = x => x.toLocaleString("en-US");
for (const [app, port] of [["bamboo",3001],["stylex",3002]]) {
  let totalClassBytes = 0, longBytes = 0, longCount = 0, docRaw = 0, docGz = 0, hashedGz = 0, hashedBr = 0, docBr = 0;
  const longNames = new Set();
  for (const [, path] of ROUTES) {
    const html = execSync(`curl -s http://127.0.0.1:${port}${path}`, {maxBuffer:60e6}).toString();
    docRaw += html.length; docGz += gzipSync(html,{level:9}).length; docBr += brotliCompressSync(Buffer.from(html)).length;
    const attrs = [...html.matchAll(/class="([^"]*)"/g)].map(m=>m[1]);
    for (const a of attrs) {
      totalClassBytes += a.length;
      for (const tok of a.split(/\s+/).filter(Boolean)) {
        if (tok.length > 12 && /[[\]()&>:,]/.test(tok)) { longBytes += tok.length; longCount++; longNames.add(tok); }
      }
    }
    // simulate hashing: replace each long token with a short id
    let map = new Map(); let i = 0;
    let out = html;
    for (const name of [...longNames].sort((a,b)=>b.length-a.length)) { if(!map.has(name)) map.set(name, "b"+(i++).toString(36)); }
    for (const [f,t] of map) out = out.split(f).join(t);
    hashedGz += gzipSync(out,{level:9}).length; hashedBr += brotliCompressSync(Buffer.from(out)).length;
  }
  console.log(`\n${app}:`);
  console.log(`  class attribute bytes (5 routes)  ${n(totalClassBytes)}`);
  console.log(`  of which escaped/arbitrary names  ${n(longBytes)} across ${n(longCount)} tokens (${longNames.size} distinct) = ${((longBytes/totalClassBytes)*100).toFixed(1)}%`);
  console.log(`  documents  ${n(docRaw)} raw · ${n(docGz)} gzip · ${n(docBr)} brotli`);
  console.log(`  if hashed  ${" ".repeat(String(n(docRaw)).length)}    ${n(hashedGz)} gzip · ${n(hashedBr)} brotli   → saves ${n(docGz-hashedGz)} gzip (${(((docGz-hashedGz)/docGz)*100).toFixed(1)}%), ${n(docBr-hashedBr)} brotli`);
  if (longNames.size) console.log(`  longest: ${[...longNames].sort((a,b)=>b.length-a.length)[0].slice(0,90)}`);
}
