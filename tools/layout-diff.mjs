// Walks both DOM trees in lockstep (markup is identical, only styling differs)
// and reports the first elements whose geometry diverges.
import { chromium } from "playwright";

import { REFERENCE, origin } from "./engines.mjs";

const route = process.argv[2] ?? "/";
const limit = Number(process.argv[3] ?? 25);
const challenger = process.argv[4] ?? "stylex";

const probe = () => {
  const out = [];
  const walk = (node, path) => {
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    out.push({
      path,
      tag: node.tagName.toLowerCase(),
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      mt: cs.marginTop,
      mb: cs.marginBottom,
      pt: cs.paddingTop,
      pb: cs.paddingBottom,
      fs: cs.fontSize,
      lh: cs.lineHeight,
      d: cs.display,
      text: (node.childNodes[0]?.nodeType === 3 ? node.childNodes[0].textContent : "")
        .trim()
        .slice(0, 24),
    });
    [...node.children].forEach((c, i) => walk(c, `${path}>${c.tagName.toLowerCase()}[${i}]`));
  };
  walk(document.body, "body");
  return out;
};

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const grab = async (origin) => {
  await page.goto(origin + route, { waitUntil: "networkidle" });
  // `getBoundingClientRect()` reports the *transformed* box, so a running
  // keyframe — /lab spins a loader and scales a dot — makes the geometry a
  // function of which frame the probe happened to catch, and the two apps are
  // never caught on the same one. `compare.mjs` gets this from Playwright's
  // `animations: "disabled"` screenshot option; there is no equivalent for a
  // live rect read, so freeze them here.
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important}",
  });
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(probe);
};

const a = await grab(origin(REFERENCE));
const b = await grab(origin(challenger));
await browser.close();

console.log(`route=${route}  ${REFERENCE}=${a.length} nodes  ${challenger}=${b.length} nodes`);
if (a.length !== b.length) console.log("!! node count differs — markup is not identical");

let shown = 0;
for (let i = 0; i < Math.min(a.length, b.length); i++) {
  const x = a[i];
  const y = b[i];
  if (x.path !== y.path) {
    console.log(`PATH DIVERGE at ${i}: ${x.path} vs ${y.path}`);
    break;
  }
  const dh = x.h - y.h;
  const dy = x.y - y.y;
  if (Math.abs(dh) > 1 || Math.abs(dy) > 1) {
    console.log(
      `\n${x.path}  <${x.tag}> ${x.text ? `"${x.text}"` : ""}\n` +
        `  ${REFERENCE.padEnd(6)} y=${x.y} h=${x.h} mt=${x.mt} mb=${x.mb} pt=${x.pt} pb=${x.pb} fs=${x.fs} lh=${x.lh} d=${x.d}\n` +
        `  ${challenger.padEnd(6)} y=${y.y} h=${y.h} mt=${y.mt} mb=${y.mb} pt=${y.pt} pb=${y.pb} fs=${y.fs} lh=${y.lh} d=${y.d}\n` +
        `  Δy=${dy} Δh=${dh}`,
    );
    if (++shown >= limit) break;
  }
}
if (shown === 0) console.log("no geometry differences > 1px");
