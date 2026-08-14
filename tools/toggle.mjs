import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome" });
for (const [name, port] of [["bamboo", 3001], ["stylex", 3002]]) {
  // OS preference is LIGHT; use the in-app button to request dark.
  const ctx = await b.newContext({ colorScheme: "light", viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  const bg = () => p.evaluate(() => getComputedStyle(document.querySelector("main").parentElement).backgroundColor);
  const before = await bg();
  // click through: system -> light -> dark
  for (let i = 0; i < 2; i++) { await p.click('button[aria-label^="Theme:"]'); await p.waitForTimeout(250); }
  const label = await p.getAttribute('button[aria-label^="Theme:"]', "aria-label");
  const after = await bg();
  console.log(`${name.padEnd(8)} shell bg  system=${before}  after→${label}: ${after}   ${before === after ? "❌ TOGGLE HAS NO EFFECT" : "✅ changes"}`);
  await ctx.close();
}
await b.close();
