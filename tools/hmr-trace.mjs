// Decomposes one HMR edit into phases, instead of timing it end to end.
//
//   node hmr-trace.mjs <app> <port> <kind: leaf|shared> [pairs]
//
// Two measurement modes over the same edit, interleaved run by run so ambient
// machine drift cancels between them:
//
//   poll   — byte-for-byte the loop in hmr-fanout.mjs: page.evaluate a
//            getComputedStyle read every 5 ms until it changes. This is what the
//            README numbers are.
//   trace  — nothing polls over CDP. An in-page detector (MessageChannel loop,
//            sub-millisecond) records when each signal lands, a second Node-side
//            vite-hmr websocket client records when the server broadcast, and
//            resource timing records every module refetch. One CDP call before
//            the write, one after the change; neither overlaps the edit.
//
// Every run uses a *distinct* font size, so the class it produces has never
// existed before. That matters twice: a probe element carrying the new class
// can only change when the rule genuinely arrives, and the target element's
// "changed" and "correct" moments can be told apart — a class whose rule has
// not landed yet computes as inherited, which reads as "changed" to
// hmr-fanout's `!== previous` test.
//
// Phases, all in ms since the file write, on one epoch clock:
//   write → ws(node)   watcher + invalidation + whatever the plugin does on change
//   module refetches   each one's start/end, so serialization is visible
//   → class            the edited JS module re-executed and React re-rendered
//   → cssLive          a probe carrying the new class computes the new value
//   → changed          the target computes *anything* new   (hmr-fanout's answer)
//   → correct          the target computes the value that was written
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { CASES } from "./hmr-anchors.mjs";

const app = process.argv[2];
const port = Number(process.argv[3]);
const kind = process.argv[4] ?? "leaf";
const PAIRS = Number(process.argv[5] ?? 6);
// interleaved: alternate a trace-only edit with a poll-only edit (drift cancels)
// dual:        run BOTH detectors on the SAME edit (isolates detection lag)
const MODE = process.argv[6] ?? "interleaved";
const ROOT = new URL("../", import.meta.url).pathname;

// Same anchors and same first value as hmr-fanout.mjs, so run 0 is its edit.
const C = CASES[app]?.[kind];
if (!C) { console.error(`no case for ${app}/${kind}`); process.exit(1); }
const ORIGINAL = readFileSync(C.file, "utf8");
if (!ORIGINAL.includes(C.from)) { console.error(`anchor not found in ${C.file}`); process.exit(1); }
const write = (v) => writeFileSync(C.file, ORIGINAL.replace(C.from, C.mk(v)));
const restore = () => writeFileSync(C.file, ORIGINAL);
process.on("exit", restore);
process.on("SIGINT", () => { restore(); process.exit(1); });
process.on("SIGTERM", () => { restore(); process.exit(1); });

const nowEpoch = () => performance.timeOrigin + performance.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const f1 = (x) => (x == null ? "-" : (+x).toFixed(1));

const INIT = `
window.__T = { wsMsgs: [], wsUrl: null, origin: performance.timeOrigin };
(() => {
  const OW = window.WebSocket;
  class W extends OW {
    constructor(url, proto) {
      super(url, proto);
      if (String(proto) === 'vite-hmr') window.__T.wsUrl = String(url);
      this.addEventListener('message', (e) => {
        const d = typeof e.data === 'string' ? e.data : '';
        window.__T.wsMsgs.push({ t: performance.now(), len: d.length, body: d.slice(0, 4000) });
      });
    }
  }
  window.WebSocket = W;
})();
`;

const DETECTOR = function (args) {
  const { sel, probeClass, expect, timeout } = args;
  const T = window.__T;
  T.wsMsgs = [];
  performance.clearResourceTimings();

  const el = document.querySelector(sel);
  if (!el) return Promise.resolve({ error: "selector not found" });
  const before = getComputedStyle(el).fontSize;
  const beforeClass = el.getAttribute("class") ?? "";

  // "the CSS rule is live" = a rule declaring exactly the written value exists in
  // some stylesheet. Authoritative, and unlike a probe element it cannot be
  // destroyed by a React re-render of the document root.
  const hasRule = () => {
    const want = expect;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      if (!rules) continue;
      const stack = [rules];
      while (stack.length) {
        const list = stack.pop();
        for (let i = 0; i < list.length; i++) {
          const r = list[i];
          if (r.style && r.style.fontSize === want) return true;
          if (r.cssRules && r.cssRules.length) stack.push(r.cssRules);
        }
      }
    }
    return false;
  };
  const ruleBefore = hasRule();
  const probeBefore = null;

  const t0 = performance.now();
  const out = {
    t0, before, beforeClass, probeClass, ruleBefore, expect,
    tClass: null, tCss: null, tChanged: null, tCorrect: null,
    afterClass: null, changedTo: null, cssProbeTo: null,
    iterations: 0, maxGap: 0, headMut: [],
    sheets: document.querySelectorAll("style,link[rel=stylesheet]").length,
  };

  const mo = new MutationObserver((recs) => {
    const t = +(performance.now() - t0).toFixed(2);
    for (const r of recs) {
      const tgt = r.target;
      const id =
        (tgt.getAttribute && tgt.getAttribute("data-vite-dev-id")) ||
        (tgt.parentElement && tgt.parentElement.getAttribute && tgt.parentElement.getAttribute("data-vite-dev-id")) ||
        (tgt.href || tgt.nodeName || "");
      const name = r.type === "characterData" ? "style-text" : r.type === "attributes" ? `attr:${r.attributeName}` : "childList";
      if (out.headMut.length < 30) out.headMut.push({ t, name, id: String(id).slice(-70) });
    }
  });
  mo.observe(document.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href"] });

  const mc = new MessageChannel();
  let last = t0;
  let lastScan = 0;
  return new Promise((resolve) => {
    const finish = () => {
      mo.disconnect();
      mc.port1.onmessage = null;
      out.wsMsgs = T.wsMsgs.map((m) => ({ t: +(m.t - t0).toFixed(2), len: m.len, body: m.body }));
      out.res = performance.getEntriesByType("resource")
        .filter((e) => e.startTime >= t0 - 5)
        .map((e) => ({
          name: e.name.replace(location.origin, ""),
          start: +(e.startTime - t0).toFixed(2),
          end: +(e.responseEnd - t0).toFixed(2),
          size: e.encodedBodySize,
        }));
      resolve(out);
    };
    mc.port1.onmessage = () => {
      const t = performance.now();
      const gap = t - last;
      if (gap > out.maxGap) out.maxGap = +gap.toFixed(2);
      last = t;
      out.iterations++;
      const rel = +(t - t0).toFixed(2);

      const cur = document.querySelector(sel);
      if (cur) {
        if (out.tClass === null) {
          const c = cur.getAttribute("class") ?? "";
          if (c !== beforeClass) { out.tClass = rel; out.afterClass = c; }
        }
        const v = getComputedStyle(cur).fontSize;
        if (out.tChanged === null && v && v !== before) { out.tChanged = rel; out.changedTo = v; }
        if (out.tCorrect === null && v === expect) out.tCorrect = rel;
      }
      // scanning every stylesheet is not free; throttle it to ~2 ms
      if (out.tCss === null && !ruleBefore && t - lastScan >= 2) {
        lastScan = t;
        if (hasRule()) { out.tCss = rel; out.cssProbeTo = expect; }
      }
      // stop once everything landed, or after a grace period past "correct"
      if (out.tCorrect !== null && out.tCss !== null && out.tClass !== null) return finish();
      if (out.tCorrect !== null && rel > out.tCorrect + 300) return finish();
      if (rel > timeout) return finish();
      mc.port2.postMessage(0);
    };
    mc.port2.postMessage(0);
  });
};

// ------------------------------------------------------------------ node side
const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
const reloads = [];
page.on("framenavigated", (f) => { if (f === page.mainFrame()) reloads.push(nowEpoch()); });
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await sleep(1500);

const readState = () => page.evaluate((s) => {
  const el = document.querySelector(s);
  return el ? { cls: el.getAttribute("class") ?? "", size: getComputedStyle(el).fontSize } : null;
}, C.sel);

const control = async () => {
  const a = [], b = [];
  for (let i = 0; i < 20; i++) { const s = nowEpoch(); await page.evaluate(() => 1); a.push(nowEpoch() - s); }
  for (let i = 0; i < 20; i++) {
    const s = nowEpoch();
    await page.evaluate((x) => { const e = document.querySelector(x); return e ? getComputedStyle(e).fontSize : null; }, C.sel);
    b.push(nowEpoch() - s);
  }
  return { trivial: median(a), read: median(b) };
};
const ctlBefore = await control();

// clock skew: the page stamp must fall inside the node sandwich
let skew = null;
for (let i = 0; i < 20; i++) {
  const a = nowEpoch();
  const p = await page.evaluate(() => performance.timeOrigin + performance.now());
  const b = nowEpoch();
  const s = p - (a + b) / 2;
  if (skew === null || Math.abs(s) < Math.abs(skew)) skew = s;
}

const wsUrl = await page.evaluate(() => window.__T.wsUrl);
let nodeWs = null;
let nodeMsgs = [];
if (wsUrl) {
  await new Promise((resolve) => {
    try {
      nodeWs = new WebSocket(wsUrl, "vite-hmr");
      nodeWs.addEventListener("open", () => resolve());
      nodeWs.addEventListener("error", () => resolve());
      nodeWs.addEventListener("message", (e) => {
        const d = typeof e.data === "string" ? e.data : "";
        nodeMsgs.push({ t: nowEpoch(), len: d.length, body: d.slice(0, 4000) });
      });
      setTimeout(resolve, 2500);
    } catch { resolve(); }
  });
}

// ---- learn the class shape one edit produces --------------------------------
const st0 = await readState();
write(C.first);
let learned = null;
for (let i = 0; i < 800; i++) {
  await sleep(20);
  const c = await readState();
  if (c && c.size === `${C.first}px`) { learned = c; break; }
}
restore();
await sleep(1600);
const stBack = await readState();

console.log(`\n### ${app} / ${kind}`);
console.log(`  ${C.sel}: ${st0?.size} → ${learned?.size ?? "NEVER REACHED"} → ${stBack?.size}`);
console.log(`  class before: ${(st0?.cls ?? "").slice(0, 130)}`);
console.log(`  class after : ${(learned?.cls ?? "").slice(0, 130)}`);
if (!learned) { console.log("  cannot learn class shape — aborting"); restore(); await browser.close(); process.exit(1); }

const probeFor = (v) => learned.cls.split(/\s+/).map((tok) => tok.replaceAll(`${C.first}px`, `${v}px`)).join(" ");
const probeChanges = probeFor(C.first + 5) !== learned.cls;
console.log(`  probe template: ${probeFor(99)}   (varies: ${probeChanges}); values ${process.env.ALT === "1" ? `alternate ${C.base}<->${C.first} (hmr-fanout's exact edit)` : `start at ${process.env.START ?? C.first}`}`);
console.log(`  control before: CDP trivial ${f1(ctlBefore.trivial)} ms, getComputedStyle read ${f1(ctlBefore.read)} ms, clock skew ${f1(skew)} ms`);

// ---- interleaved runs -------------------------------------------------------
const rows = [];
const pollTimes = [];
const traces = [];
let v = Number(process.env.START ?? C.first);
const ALT = process.env.ALT === '1';
let altN = 0;
const nextValue = () => (ALT ? (altN++ % 2 === 0 ? C.first : C.base) : v++);

const doPoll = async (val) => {
  const read = () => page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? getComputedStyle(el).fontSize : null;
  }, C.sel);
  const prev = await read();
  const t0 = performance.now();
  write(val);
  let waited = 0, got = null;
  while (waited < 15000) {
    const now = await read();
    if (now && now !== prev) { got = now; break; }
    await sleep(5);
    waited = performance.now() - t0;
  }
  const changed = Math.round(performance.now() - t0);
  // keep polling to the correct value, to price the flash
  let correct = changed;
  if (got !== `${val}px`) {
    while (performance.now() - t0 < 15000) {
      const now = await read();
      if (now === `${val}px`) break;
      await sleep(5);
    }
    correct = Math.round(performance.now() - t0);
  }
  return { changed, correct, firstValue: got };
};

const doTrace = async (val) => {
  nodeMsgs = [];
  const rBefore = reloads.length;
  await page.evaluate(
    ([src, args]) => { window.__T.done = eval(`(${src})`)(args); return true; },
    [DETECTOR.toString(), { sel: C.sel, probeClass: probeFor(val), expect: `${val}px`, timeout: 15000 }],
  );
  const tWrite = nowEpoch();
  write(val);
  const r = await page.evaluate(() => window.__T.done);
  const originEpoch = await page.evaluate(() => window.__T.origin);
  r.writeToT0 = originEpoch + r.t0 - tWrite;
  r.nodeWs = nodeMsgs.map((m) => ({ t: +(m.t - tWrite).toFixed(2), len: m.len, body: m.body }));
  r.reloaded = reloads.length > rBefore;
  return r;
};

// Both detectors on one edit: the in-page detector reports the true moment, the
// CDP poll reports what hmr-fanout would have reported for that same moment.
const doDual = async (val) => {
  nodeMsgs = [];
  const rBefore = reloads.length;
  await page.evaluate(
    ([src, args]) => { window.__T.done = eval(`(${src})`)(args); return true; },
    [DETECTOR.toString(), { sel: C.sel, probeClass: probeFor(val), expect: `${val}px`, timeout: 15000 }],
  );
  const read = () => page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? getComputedStyle(el).fontSize : null;
  }, C.sel);
  const prev = await read();
  const tWrite = nowEpoch();
  const t0 = performance.now();
  write(val);
  let pchanged = null, first = null;
  while (performance.now() - t0 < 15000) {
    const now = await read();
    if (now && now !== prev) { pchanged = Math.round(performance.now() - t0); first = now; break; }
    await sleep(5);
  }
  const r = await page.evaluate(() => window.__T.done);
  const originEpoch = await page.evaluate(() => window.__T.origin);
  r.writeToT0 = originEpoch + r.t0 - tWrite;
  r.nodeWs = nodeMsgs.map((m) => ({ t: +(m.t - tWrite).toFixed(2), len: m.len, body: m.body }));
  r.reloaded = reloads.length > rBefore;
  return { t: r, p: { changed: pchanged, correct: pchanged, firstValue: first } };
};

for (let i = 0; i < PAIRS; i++) {
  if (MODE === "dual") {
    const { t, p } = await doDual(nextValue()); await sleep(900);
    traces.push(t); pollTimes.push(p); rows.push({ i, t, p });
  } else if (i % 2 === 0) {
    // alternate order so any within-pair drift cancels
    const t = await doTrace(nextValue()); await sleep(700);
    const p = await doPoll(nextValue()); await sleep(700);
    traces.push(t); pollTimes.push(p); rows.push({ i, t, p });
  } else {
    const p = await doPoll(nextValue()); await sleep(700);
    const t = await doTrace(nextValue()); await sleep(700);
    traces.push(t); pollTimes.push(p); rows.push({ i, t, p });
  }
}
restore();
await sleep(900);
const ctlAfter = await control();

// -------------------------------------------------------------------- report
const off = (r, t) => (t == null ? null : +(t + r.writeToT0).toFixed(1));
const firstReal = (msgs) => msgs.filter((m) => !/vite:ping|"connected"|vite:invalidate/.test(m.body))[0];

console.log(`\n  per-run, ms after the file write:`);
console.log("    " + ["run", "ws", "lastRes", "nRes", "class", "cssLive", "changed", "correct", "|", "POLLchg", "POLLcor"].map((c) => c.padStart(9)).join(""));
for (const { i, t, p } of rows) {
  const ws = firstReal(t.nodeWs);
  const lastRes = t.res?.length ? Math.max(...t.res.map((e) => e.end)) : null;
  console.log("    " + [
    i, ws ? f1(ws.t) : "-", lastRes != null ? f1(off(t, lastRes)) : "-", t.res?.length ?? 0,
    f1(off(t, t.tClass)), t.ruleBefore ? "PRE" : f1(off(t, t.tCss)), f1(off(t, t.tChanged)), f1(off(t, t.tCorrect)),
    "|", p.changed, p.correct,
  ].map((c) => String(c).padStart(9)).join(""));
}

const M = {
  ws: median(traces.map((t) => firstReal(t.nodeWs)?.t)),
  lastRes: median(traces.map((t) => (t.res?.length ? off(t, Math.max(...t.res.map((e) => e.end))) : null))),
  nRes: median(traces.map((t) => t.res?.length)),
  cls: median(traces.map((t) => off(t, t.tClass))),
  css: median(traces.map((t) => off(t, t.tCss))),
  chg: median(traces.map((t) => off(t, t.tChanged))),
  cor: median(traces.map((t) => off(t, t.tCorrect))),
  head: median(traces.map((t) => (t.headMut?.length ? off(t, t.headMut[0].t) : null))),
  pchg: median(pollTimes.map((p) => p.changed)),
  pcor: median(pollTimes.map((p) => p.correct)),
};
console.log(`  MEDIANS  headMut(css swap) ${f1(M.head)}`);
console.log(`\n  MEDIANS  ws ${f1(M.ws)}  lastRes ${f1(M.lastRes)} (${M.nRes} fetches)  class ${f1(M.cls)}  cssLive ${f1(M.css)}  changed ${f1(M.chg)}  correct ${f1(M.cor)}`);
console.log(`           poll: changed ${M.pchg}  correct ${M.pcor}`);
console.log(`  INSTRUMENT  poll(changed) ${M.pchg} − trace(changed) ${f1(M.chg)} = ${f1(M.pchg - M.chg)} ms (medians)`);
const paired = rows.map(({ t, p }) => (p.changed != null && t.tChanged != null ? p.changed - off(t, t.tChanged) : null)).filter((x) => x != null);
console.log(`  INSTRUMENT  paired poll−trace per run: [${paired.map((x) => f1(x)).join(", ")}]  median ${f1(median(paired))} ms${MODE === "dual" ? "  (same edit → pure detection lag)" : "  (different edits → includes drift)"}`);
console.log(`  ORDER       class ${f1(M.cls)} vs cssLive ${f1(M.css)} → ${M.css != null && M.cls != null ? (M.css > M.cls ? `CSS trails JS by ${f1(M.css - M.cls)} ms` : `JS trails CSS by ${f1(M.cls - M.css)} ms`) : "n/a"}`);
console.log(`  flash       changed→correct ${f1(M.cor - M.chg)} ms; poll first saw ${JSON.stringify(pollTimes.map((p) => p.firstValue))}`);

// Machine-readable summary for hmr-phases.mjs, which aggregates across engines.
if (process.env.TRACE_JSON) {
  console.log("##TRACE## " + JSON.stringify({
    app, kind, pairs: PAIRS,
    ws: M.ws, cssLive: M.css, class: M.cls, changed: M.chg, correct: M.cor,
    nRes: M.nRes, pollChanged: M.pchg, pollCorrect: M.pcor,
  }));
}

const s = traces.filter((t) => t.tCorrect != null).sort((a, b) => a.tCorrect - b.tCorrect);
const rep = s[Math.floor(s.length / 2)] ?? traces[0];
console.log(`\n  --- detail, representative run (correct at ${f1(off(rep, rep.tCorrect))} ms; reload=${rep.reloaded}; sheets=${rep.sheets}; loop ${rep.iterations} iters, max gap ${rep.maxGap} ms) ---`);
console.log(`  ws messages (node clock, write-relative):`);
for (const m of rep.nodeWs) console.log(`    ${f1(m.t).padStart(8)} ms  ${String(m.len).padStart(5)} B  ${m.body.replace(/\s+/g, " ").slice(0, 200)}`);
console.log(`  fetches:`);
for (const e of (rep.res ?? []).sort((a, b) => a.start - b.start))
  console.log(`    ${f1(off(rep, e.start)).padStart(8)} → ${f1(off(rep, e.end)).padStart(8)} ms  ${String(e.size).padStart(7)} B  ${e.name.split("?")[0].slice(-64)}`);
console.log(`  head mutations: ${rep.headMut.map((m) => `${m.t}:${m.name}:${m.id}`).slice(0, 10).join("  ")}`);
console.log(`\n  control after: CDP trivial ${f1(ctlAfter.trivial)} ms (before ${f1(ctlBefore.trivial)}), read ${f1(ctlAfter.read)} ms (before ${f1(ctlBefore.read)})`);

restore();
try { nodeWs?.close(); } catch {}
await browser.close();
