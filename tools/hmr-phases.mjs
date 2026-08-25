// The HMR axis, decomposed into phases instead of timed end to end.
//
//   node hmr-phases.mjs [sweeps] [pairs]
//
// Drives hmr-trace.mjs across every engine and both edit kinds, one dev server
// at a time, and pools the phase medians.
//
// Why this replaced a single end-to-end latency number:
//
//   * The old probe polled `getComputedStyle` until it differed from the
//     previous value. The first thing it sees is an *inherited* value the
//     element falls back to while the new rule is in flight — a flash, tens of
//     ms before the written value actually paints.
//   * Worse, it is not the same event across engines. Whichever of the two
//     signals arrives first is what the poll catches, and the order is
//     engine-dependent: some engines land the CSS before the JS re-executes,
//     others after. Comparing those columns compares different events.
//
// The phases below are each one thing, measured the same way for every engine:
//
//   write → ws        the dev server's own reaction: watcher, invalidation and
//                     whatever the plugin does on change, up to the broadcast.
//                     The only phase attributable to the engine alone.
//   write → cssLive   the new rule is live in the document.
//   write → correct   the target element computes the value that was written.
//                     True end to end, and the number a human would call
//                     "how long until I see my edit".
//
// `class` (the edited JS module re-executed) is reported too, because the gap
// between it and cssLive is what makes the old probe incomparable.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { ENGINES } from "./engines.mjs";
import { CASES } from "./hmr-anchors.mjs";

const SWEEPS = Number(process.argv[2] ?? 2);
const PAIRS = Number(process.argv[3] ?? 5);
const WS_RUNS = Number(process.env.WS_RUNS ?? 7);
const KINDS = ["shared", "leaf"];
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => {
  const s = a.filter((x) => x != null).sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const f1 = (x) => (x == null ? "—" : (Math.round(x * 10) / 10).toFixed(1));

/** Only what is LISTENING — this process holds client sockets to the same port. */
const freePort = (port) => {
  try { execFileSync("bash", ["-c", `lsof -ti:${port} -sTCP:LISTEN | xargs kill -9 2>/dev/null`], { stdio: "ignore" }); } catch {}
};

const waitFor = async (port, ms = 90000) => {
  const t = Date.now();
  while (Date.now() - t < ms) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return true;
    } catch {}
    await sleep(80);
  }
  return false;
};

const startDev = async (dir, port) => {
  freePort(port);
  await sleep(500);
  execFileSync("bash", ["-c", `cd ${JSON.stringify(dir)} && nohup npm run dev -- --port ${port} > /dev/null 2>&1 &`], { stdio: "ignore" });
  return waitFor(port);
};

/** write → HMR broadcast, over a bare `vite-hmr` socket.
 *
 *  hmr-trace reports a `ws` figure too, but it takes it with a browser attached
 *  and a CDP poll running against the same server, which moves it by 3-10×
 *  sweep to sweep. Measured on its own it is the steadiest number in the file,
 *  so the server-reaction row comes from here and the browser-side phases come
 *  from the trace. */
const wsLatency = async (app, port, kind, runs) => {
  const C = CASES[app][kind];
  const times = [];
  for (let i = 0; i < runs; i++) {
    const original = readFileSync(C.file, "utf8");
    if (!original.includes(C.from)) return [];
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
    writeFileSync(C.file, original.replace(C.from, C.mk(C.first + i)));
    const deadline = performance.now() + 12000;
    while (first == null && performance.now() < deadline) await sleep(4);
    writeFileSync(C.file, original);
    await sleep(500);
    try { ws.close(); } catch {}
    if (first != null) times.push(Math.round(first));
  }
  return times;
};

/** One hmr-trace run; returns its parsed summary or null. */
const trace = (app, port, kind) => {
  let out = "";
  try {
    out = execFileSync("node", ["hmr-trace.mjs", app, String(port), kind, String(PAIRS)], {
      cwd: new URL(".", import.meta.url).pathname,
      encoding: "utf8",
      env: { ...process.env, TRACE_JSON: "1" },
      maxBuffer: 64 * 1024 * 1024,
      timeout: 15 * 60 * 1000,
    });
  } catch (e) {
    out = String(e.stdout ?? "");
  }
  const line = out.split("\n").find((l) => l.startsWith("##TRACE## "));
  if (!line) return null;
  try { return JSON.parse(line.slice("##TRACE## ".length)); } catch { return null; }
};

/* ------------------------------------------------------------------ measure */

const samples = {};
const wsSamples = {};
for (const e of ENGINES) for (const k of KINDS) { samples[`${e.name}/${k}`] = []; wsSamples[`${e.name}/${k}`] = []; }

for (let sweep = 0; sweep < SWEEPS; sweep++) {
  // reverse the engine order on alternate sweeps so machine drift over the
  // sweep's own runtime does not favour whichever engine goes first
  const order = sweep % 2 === 0 ? ENGINES : [...ENGINES].reverse();
  for (const eng of order) {
    const dir = `${ROOT}/apps/${eng.name}`;
    process.stderr.write(`  … sweep ${sweep + 1}/${SWEEPS} ${eng.name}: dev server\n`);
    const up = await startDev(dir, eng.devPort);
    if (!up) { process.stderr.write(`  !! ${eng.name} dev server did not come up\n`); continue; }
    await sleep(11000); // module graph settles; an early edit reports inflated numbers
    for (const kind of KINDS) {
      process.stderr.write(`  … sweep ${sweep + 1}/${SWEEPS} ${eng.name}/${kind}: ws\n`);
      wsSamples[`${eng.name}/${kind}`].push(...(await wsLatency(eng.name, eng.devPort, kind, WS_RUNS)));
      await sleep(1200);
      process.stderr.write(`  … sweep ${sweep + 1}/${SWEEPS} ${eng.name}/${kind}: trace\n`);
      const r = trace(eng.name, eng.devPort, kind);
      if (r) samples[`${eng.name}/${kind}`].push(r);
      else process.stderr.write(`  !! ${eng.name}/${kind} produced no summary\n`);
      await sleep(1500);
    }
    freePort(eng.devPort);
    await sleep(1500);
  }
}

/* ------------------------------------------------------------------- report */

const PHASES = [
  ["cssLive", "write → rule live"],
  ["class", "write → JS re-executed"],
  ["correct", "write → correct paint"],
];

const pad = (s, w) => String(s).padStart(w);
console.log(`\n================ HMR PHASES ================\n`);
console.log(`  ${SWEEPS} sweeps × ${PAIRS} pairs per engine per kind, engine order reversed`);
console.log(`  on alternate sweeps. Every figure is ms after the file write.\n`);

for (const kind of KINDS) {
  console.log(`--- ${kind === "shared" ? "edit a shared style module" : "edit a component file"} ---`);
  console.log(`  ${pad("phase", 26)}${ENGINES.map((e) => pad(e.name, 11)).join("")}`);
  console.log(`  ${pad("write → ws (server reacts)", 26)}${ENGINES.map((e) => pad(f1(median(wsSamples[`${e.name}/${kind}`])), 11)).join("")}`);
  for (const [key, label] of PHASES) {
    const cells = ENGINES.map((e) => {
      const rows = samples[`${e.name}/${kind}`];
      return pad(f1(median(rows.map((r) => r[key]))), 11);
    }).join("");
    console.log(`  ${pad(label, 26)}${cells}`);
  }
  // the artifact the old row reported, kept visible so the change is auditable
  const flash = ENGINES.map((e) => {
    const rows = samples[`${e.name}/${kind}`];
    const c = median(rows.map((r) => r.correct));
    const g = median(rows.map((r) => r.changed));
    return pad(c != null && g != null ? f1(c - g) : "—", 11);
  }).join("");
  console.log(`  ${pad("(flash → correct)", 26)}${flash}`);
  const order = ENGINES.map((e) => {
    const rows = samples[`${e.name}/${kind}`];
    const cls = median(rows.map((r) => r.class));
    const css = median(rows.map((r) => r.cssLive));
    if (cls == null || css == null) return pad("—", 11);
    return pad(css > cls ? "CSS last" : "JS last", 11);
  }).join("");
  console.log(`  ${pad("which signal lands last", 26)}${order}`);
  console.log(`  ${pad("sweeps pooled", 26)}${ENGINES.map((e) => pad(samples[`${e.name}/${kind}`].length, 11)).join("")}`);
  console.log(`  ${pad("ws runs pooled", 26)}${ENGINES.map((e) => pad(wsSamples[`${e.name}/${kind}`].length, 11)).join("")}`);
  console.log("");
}

console.log(`--- write → ws, every run ---`);
for (const kind of KINDS) {
  for (const e of ENGINES) {
    console.log(`  ${pad(`${e.name}/${kind}`, 18)} ${wsSamples[`${e.name}/${kind}`].join(", ")}`);
  }
}
