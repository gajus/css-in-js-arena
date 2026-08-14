import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
const [key, y0, y1, x0, x1] = [process.argv[2], +process.argv[3], +process.argv[4], +(process.argv[5]??0), +(process.argv[6]??1440)];
const pad = 8, scale = 3;
for (const app of ["bamboo", "stylex"]) {
  const src = PNG.sync.read(readFileSync(`./shots/${app}-${key}.png`));
  const Y0 = Math.max(0, y0 - pad), H = Math.min(src.height - Y0, y1 - y0 + 1 + pad * 2);
  const X0 = Math.max(0, x0 - pad), W = Math.min(src.width - X0, x1 - x0 + 1 + pad * 2);
  const out = new PNG({ width: W * scale, height: H * scale });
  for (let y = 0; y < H * scale; y++) for (let x = 0; x < W * scale; x++) {
    const si = ((Y0 + (y/scale|0)) * src.width + (X0 + (x/scale|0))) * 4;
    const di = (y * W * scale + x) * 4;
    out.data[di]=src.data[si]; out.data[di+1]=src.data[si+1]; out.data[di+2]=src.data[si+2]; out.data[di+3]=255;
  }
  writeFileSync(`./shots/crop-${app}.png`, PNG.sync.write(out));
}
console.log("cropped");
