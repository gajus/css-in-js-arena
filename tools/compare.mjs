// Visual-parity harness. Screenshots every route in every app at three
// viewports plus dark mode, then pixel-diffs each challenger against the
// reference app — all apps matching the reference means all apps match.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { CHALLENGERS, REFERENCE, byName, origin } from "./engines.mjs";

const APPS = Object.fromEntries([byName(REFERENCE), ...CHALLENGERS].map((e) => [e.name, origin(e)]));

const ROUTES = [
  ["dashboard", "/"],
  ["projects", "/projects"],
  ["settings", "/settings"],
  ["pricing", "/pricing"],
  ["docs", "/docs"],
  ["lab", "/lab"],
];

const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["tablet", 880, 900],
  ["mobile", 420, 900],
];

const OUT = new URL("./shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

async function shoot(page, url, file) {
  await page.goto(url, { waitUntil: "networkidle" });
  // Settle web fonts so text metrics match between the two runs.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.screenshot({ path: file, fullPage: true, animations: "disabled" });
}

const results = [];

for (const [scheme] of [["light"], ["dark"]]) {
  const browser = await chromium.launch({ channel: "chrome" });

  for (const [vpName, width, height] of VIEWPORTS) {
    // Only run the full viewport matrix in light mode; dark mode is desktop-only.
    if (scheme === "dark" && vpName !== "desktop") continue;

    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: scheme,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const [routeName, path] of ROUTES) {
      const files = {};
      for (const [app, url] of Object.entries(APPS)) {
        files[app] = `${OUT}${app}-${routeName}-${vpName}-${scheme}.png`;
        await shoot(page, url + path, files[app]);
      }

      const ref = PNG.sync.read(readFileSync(files[REFERENCE]));

      for (const challenger of CHALLENGERS) {
        const key = `${challenger.name}/${routeName}-${vpName}-${scheme}`;
        const b = PNG.sync.read(readFileSync(files[challenger.name]));

        if (ref.width !== b.width || ref.height !== b.height) {
          results.push({ key, status: "SIZE-MISMATCH", detail: `${ref.width}x${ref.height} vs ${b.width}x${b.height}` });
          continue;
        }

        const diff = new PNG({ width: ref.width, height: ref.height });
        const changed = pixelmatch(ref.data, b.data, diff.data, ref.width, ref.height, { threshold: 0.1 });
        const pct = (changed / (ref.width * ref.height)) * 100;
        if (changed > 0) {
          writeFileSync(`${OUT}diff-${challenger.name}-${routeName}-${vpName}-${scheme}.png`, PNG.sync.write(diff));
        }
        results.push({
          key,
          status: pct < 0.05 ? "MATCH" : "DIFF",
          changed,
          total: ref.width * ref.height,
          pct: pct.toFixed(4),
          size: `${ref.width}x${ref.height}`,
        });
      }
    }

    await context.close();
  }

  await browser.close();
}

console.log("\n=== VISUAL PARITY ===");
let worst = 0;
for (const r of results) {
  if (r.status === "SIZE-MISMATCH") {
    console.log(`${r.key.padEnd(40)} ${r.status}  ${r.detail}`);
  } else {
    worst = Math.max(worst, Number(r.pct));
    console.log(
      `${r.key.padEnd(40)} ${r.status.padEnd(6)} ${String(r.pct).padStart(8)}% differing  (${r.size})`,
    );
  }
}
console.log(`\nworst-case difference: ${worst.toFixed(4)}%`);
writeFileSync(`${OUT}results.json`, JSON.stringify(results, null, 2));
