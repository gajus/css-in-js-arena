// How does each engine's dev loop cost scale with the number of source files
// the compiler has to account for?
//
//   node dev-scale.mjs
//
// `scale.mjs` scales *rules* and measures bytes. This scales *files* and
// measures time, which is a different axis and the one an engine's incremental
// machinery lives or dies on: whether an edit re-reads the whole source
// inventory or only what changed, and whether the dependency walk is linear or
// quadratic in file count.
//
// Every generated module carries the SAME declarations. Atomic engines fold
// them to the same classes, so the emitted stylesheet stays flat while the file
// count grows — the delta is per-file pipeline cost, not rule cost. `blocks` is
// reported per size so that assumption is auditable rather than asserted.
//
// Three timings per size, each isolating a different part of the loop:
//   build       production build, cold — whole-inventory extraction
//   dev start   dev server boot to first response
//   edit → ws   file write to the server's HMR broadcast, over a bare
//               `vite-hmr` websocket. No browser, no React, no polling: this is
//               the server's own reaction and nothing else. hmr-phases.mjs
//               measures what the browser then does with it.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ENGINES as engines } from "./engines.mjs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const COUNTS = (process.env.COUNTS ?? "0,25,100,400").split(",").map(Number);
/** ORPHANED=1 generates the same modules but does NOT hang the barrel off
 *  ui.ts, so they match `include` while staying out of the bundle graph. The
 *  difference between the two passes is what an engine spends on a file whose
 *  extraction result it then discards. */
const ORPHANED = process.env.ORPHANED === "1";
const EDIT_RUNS = Number(process.env.RUNS ?? 7);
const BUILD_RUNS = Number(process.env.BUILD_RUNS ?? 3);
const START_RUNS = Number(process.env.START_RUNS ?? 3);

/** Identical in every generated module, so rules dedupe and only files scale. */
const DECLS = [
  `    paddingTop: "17px",`,
  `    paddingBottom: "19px",`,
  `    marginTop: "23px",`,
  `    letterSpacing: "0.037em",`,
].join("\n");

const generated = {
  bamboo: (i) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const m${i} = css({\n${DECLS}\n});\n`,
  panda: (i) =>
    `import { css } from "styled-system/css";\n\n` +
    `export const m${i} = css({\n${DECLS}\n});\n`,
  stylex: (i) =>
    `import * as stylex from "@stylexjs/stylex";\n\n` +
    `const s = stylex.create({\n  k: {\n${DECLS}\n  },\n});\n\n` +
    `export const m${i} = stylex.props(s.k);\n`,
};

const DIR = "app/__devscale";
const anchorFile = "app/ui.ts";
const anchorLine = `\nexport { devScale } from "./__devscale";\n`;

/** The edit whose broadcast we time — the same shared-module anchor
 *  hmr-phases.mjs uses, so the two tools describe the same edit. */
const EDIT = {
  bamboo: { from: `export const pageTitle = css({ fontSize: "25px"`, mk: (v) => `export const pageTitle = css({ fontSize: "${v}px"` },
  panda: { from: `export const pageTitle = css({ fontSize: "25px"`, mk: (v) => `export const pageTitle = css({ fontSize: "${v}px"` },
  stylex: { from: `pageTitle: { fontSize: 25,`, mk: (v) => `pageTitle: { fontSize: ${v},` },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => {
  const s = a.filter((x) => x != null).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

/** Write N modules plus a barrel, and hang the barrel off ui.ts so StyleX —
 *  which only sees the bundle graph — counts them too. Under ORPHANED the
 *  anchor is left alone, so nothing imports them. Returns the undo. */
const apply = (engine, dir, n, imported = !ORPHANED) => {
  const modDir = join(dir, DIR);
  const anchorPath = join(dir, anchorFile);
  const anchorOriginal = readFileSync(anchorPath, "utf8");
  const undo = () => {
    rmSync(modDir, { recursive: true, force: true });
    writeFileSync(anchorPath, anchorOriginal);
  };
  if (n === 0) { undo(); return undo; }

  mkdirSync(modDir, { recursive: true });
  for (let i = 0; i < n; i++) writeFileSync(join(modDir, `m${i}.ts`), generated[engine](i));
  writeFileSync(
    join(modDir, "index.ts"),
    Array.from({ length: n }, (_, i) => `import { m${i} } from "./m${i}";`).join("\n") +
      `\n\nexport const devScale = [\n` +
      Array.from({ length: n }, (_, i) => `  m${i},`).join("\n") +
      `\n];\n`,
  );
  if (imported) writeFileSync(anchorPath, anchorOriginal + anchorLine);
  return undo;
};

/** Kill only what is LISTENING on the port. Plain `lsof -ti:<port>` also matches
 *  this process, which holds a client socket to that port for the edit timing —
 *  killing that set kills the harness. */
const freePort = (port) => {
  try { execFileSync("bash", ["-c", `lsof -ti:${port} -sTCP:LISTEN | xargs kill -9 2>/dev/null`], { stdio: "ignore" }); } catch {}
};

const buildOnce = (dir) => {
  rmSync(join(dir, "build"), { recursive: true, force: true });
  rmSync(join(dir, ".react-router"), { recursive: true, force: true });
  rmSync(join(dir, "node_modules/.vite"), { recursive: true, force: true });
  const t = Date.now();
  try { execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "pipe", encoding: "utf8" }); }
  catch (e) { return { ms: null, error: String(e.stderr ?? e).slice(-400) }; }
  return { ms: Date.now() - t };
};

/** Raw bytes of every emitted stylesheet — the audit that rules stayed flat.
 *  If this grows with file count the isolation has failed and the timings are
 *  measuring rule volume, not per-file cost. */
const cssBytes = (dir) => {
  const base = join(dir, "build/client/assets");
  if (!existsSync(base)) return null;
  const files = readdirSync(base).filter((x) => x.endsWith(".css"));
  if (!files.length) return null;
  return files.reduce((n, f) => n + readFileSync(join(base, f)).length, 0);
};

const waitFor = async (port, ms = 90000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return Date.now() - t;
    } catch {}
    await sleep(60);
  }
  return null;
};

/** Boot a dev server, timing how long until it answers. Backgrounded through
 *  the shell and reaped by port, the way devstart.sh does it — a detached
 *  node spawn does not survive here. */
const startDev = async (dir, port) => {
  freePort(port);
  await sleep(400);
  const t = Date.now();
  execFileSync("bash", ["-c", `cd ${JSON.stringify(dir)} && nohup npm run dev -- --port ${port} > /dev/null 2>&1 &`], { stdio: "ignore" });
  const ok = await waitFor(port);
  return { startMs: ok == null ? null : Date.now() - t };
};

/** Time file-write → HMR broadcast, over a bare vite-hmr socket. */
const editLatency = async (dir, port, engine, runs) => {
  const anchorPath = join(dir, anchorFile);
  const spec = EDIT[engine];
  const times = [];
  for (let i = 0; i < runs; i++) {
    const original = readFileSync(anchorPath, "utf8");
    if (!original.includes(spec.from)) return { times: [], error: `anchor not found in ${anchorPath}` };

    const ws = new WebSocket(`ws://localhost:${port}`, "vite-hmr");
    let first = null;
    let t0 = 0;
    const opened = await new Promise((r) => {
      ws.addEventListener("open", () => r(true));
      ws.addEventListener("error", () => r(false));
      setTimeout(() => r(false), 5000);
    });
    if (!opened) { try { ws.close(); } catch {} continue; }
    ws.addEventListener("message", (e) => {
      const body = String(e.data);
      if (/vite:ping|"connected"|vite:invalidate/.test(body)) return;
      if (first == null) first = performance.now() - t0;
    });

    await sleep(350);
    t0 = performance.now();
    writeFileSync(anchorPath, original.replace(spec.from, spec.mk(31 + i)));
    const deadline = performance.now() + 12000;
    while (first == null && performance.now() < deadline) await sleep(4);
    writeFileSync(anchorPath, original);
    await sleep(500);
    try { ws.close(); } catch {}
    if (first != null) times.push(Math.round(first));
  }
  return { times };
};

/* ------------------------------------------------------------------ measure */

const results = {};
for (const eng of engines) {
  const dir = join(ROOT, "apps", eng.name);
  results[eng.name] = [];
  for (const n of COUNTS) {
    const undo = apply(eng.name, dir, n);
    process.stderr.write(`  … ${eng.name} n=${n}: building\n`);
    try {
      const buildTimes = [];
      let b = { ms: null };
      for (let k = 0; k < BUILD_RUNS; k++) { b = buildOnce(dir); if (b.ms == null) break; buildTimes.push(b.ms); }
      if (b.ms == null) {
        console.log(`  ${eng.name} n=${n} BUILD FAILED`);
        results[eng.name].push({ n, failed: true });
        continue;
      }
      const cssB = cssBytes(dir);
      process.stderr.write(`  … ${eng.name} n=${n}: dev server\n`);
      const startTimes = [];
      let startMs = null;
      for (let k = 0; k < START_RUNS; k++) {
        const r = await startDev(dir, eng.devPort);
        startMs = r.startMs;
        if (startMs != null) startTimes.push(startMs);
        if (k < START_RUNS - 1) { freePort(eng.devPort); await sleep(900); }
      }
      let edit = { times: [] };
      if (startMs != null) {
        process.stderr.write(`  … ${eng.name} n=${n}: timing edits\n`);
        await sleep(9000); // let the module graph settle before timing edits
        edit = await editLatency(dir, eng.devPort, eng.name, EDIT_RUNS);
      }
      freePort(eng.devPort);
      await sleep(1200);

      results[eng.name].push({
        n, build: median(buildTimes), builds: buildTimes, cssB,
        start: median(startTimes), starts: startTimes,
        edit: median(edit.times), edits: edit.times,
      });
      console.log(`  ${eng.name} n=${n} ok  build ${median(buildTimes)}ms  start ${median(startTimes)}ms  edit ${median(edit.times)}ms  css ${cssB}B`);
    } finally {
      undo();
    }
  }
  // leave each app back at its committed state and a build nobody has mutated
  buildOnce(dir);
}

/* ------------------------------------------------------------------- report */

const pad = (s, w) => String(s ?? "—").padStart(w);
console.log(`\n================ DEV LOOP vs FILE COUNT ================\n`);
console.log(`  ${COUNTS.length} sizes × ${engines.length} engines. Every generated module carries identical`);
console.log(`  declarations, so rule count stays flat and only the file count grows.`);
console.log(`  edit→ws is the dev server's own reaction, over a bare websocket.\n`);

for (const name of Object.keys(results)) {
  console.log(`${name}:`);
  console.log(`    ${pad("files", 7)}${pad("build ms", 11)}${pad("dev start", 11)}${pad("edit→ws", 10)}${pad("css B", 10)}`);
  for (const r of results[name]) {
    if (r.failed) { console.log(`    ${pad(r.n, 7)}  BUILD FAILED`); continue; }
    console.log(`    ${pad(r.n, 7)}${pad(r.build, 11)}${pad(r.start, 11)}${pad(r.edit, 10)}${pad(r.cssB, 10)}`);
  }
  const a = results[name].find((r) => r.n === COUNTS[0] && !r.failed);
  const z = results[name].find((r) => r.n === COUNTS.at(-1) && !r.failed);
  if (a && z && a.edit != null && z.edit != null) {
    const per = (z.edit - a.edit) / (COUNTS.at(-1) - COUNTS[0]);
    console.log(`    → edit→ws grew ${z.edit - a.edit} ms across ${COUNTS.at(-1)} files (${per.toFixed(2)} ms per file)`);
  }
  console.log("");
}

console.log(`--- edit→ws, ms, by file count ---`);
console.log(`    ${pad("files", 7)}${engines.map((e) => pad(e.name, 10)).join("")}`);
for (const n of COUNTS) {
  const cells = engines.map((e) => pad(results[e.name]?.find((r) => r.n === n && !r.failed)?.edit, 10)).join("");
  console.log(`    ${pad(n, 7)}${cells}`);
}
console.log(`\n--- production build, ms, by file count ---`);
console.log(`    ${pad("files", 7)}${engines.map((e) => pad(e.name, 10)).join("")}`);
for (const n of COUNTS) {
  const cells = engines.map((e) => pad(results[e.name]?.find((r) => r.n === n && !r.failed)?.build, 10)).join("");
  console.log(`    ${pad(n, 7)}${cells}`);
}
