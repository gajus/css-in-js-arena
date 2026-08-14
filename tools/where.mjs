import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
const key = process.argv[2];
const a = PNG.sync.read(readFileSync(`./shots/bamboo-${key}.png`));
const b = PNG.sync.read(readFileSync(`./shots/stylex-${key}.png`));
const diff = new PNG({ width: a.width, height: a.height });
pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
// cluster differing rows into bands
const rows = new Array(a.height).fill(0);
for (let y = 0; y < a.height; y++)
  for (let x = 0; x < a.width; x++) {
    const i = (y * a.width + x) * 4;
    if (diff.data[i] > 200 && diff.data[i+1] < 100) rows[y]++;
  }
const bands = [];
let cur = null;
for (let y = 0; y < a.height; y++) {
  if (rows[y] > 0) { if (!cur) cur = { y0: y, y1: y, px: 0 }; cur.y1 = y; cur.px += rows[y]; }
  else if (cur) { bands.push(cur); cur = null; }
}
if (cur) bands.push(cur);
bands.sort((p, q) => q.px - p.px);
console.log(`${key}: ${bands.length} bands`);
for (const band of bands.slice(0, 8)) {
  // x extent for this band
  let x0 = a.width, x1 = 0;
  for (let y = band.y0; y <= band.y1; y++)
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (diff.data[i] > 200 && diff.data[i+1] < 100) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    }
  console.log(`  y=${band.y0}-${band.y1} (h=${band.y1-band.y0+1})  x=${x0}-${x1}  px=${band.px}`);
}
