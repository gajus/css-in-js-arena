// Single source of truth for which engines are in the arena and what ports they
// use. Shell scripts read the JSON directly:
//   ENGINES=$(node -e "console.log(require('./engines.json').engines.map(e=>e.name).join(' '))")
import { readFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync(new URL("./engines.json", import.meta.url), "utf8"));

export const ENGINES = cfg.engines;
export const REFERENCE = cfg.reference;
export const NAMES = ENGINES.map((e) => e.name);
export const byName = (name) => ENGINES.find((e) => e.name === name);
export const origin = (e) => `http://127.0.0.1:${(typeof e === "string" ? byName(e) : e).port}`;
/** Every engine except the reference, which everything is diffed against. */
export const CHALLENGERS = ENGINES.filter((e) => e.name !== REFERENCE);
