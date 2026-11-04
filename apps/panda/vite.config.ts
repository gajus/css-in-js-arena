import { reactRouter } from "@react-router/dev/vite";
import pandacss from "@pandacss/vite";
import { defineConfig } from "vite";

// Panda's first-party Vite plugin, in its shipped defaults. It generates
// `styled-system/` and injects the stylesheet itself, so there is no separate
// codegen step in the build. `transform` is opt-in and left off: `css()`/`cva()`
// resolve class names at runtime rather than being folded to literals at build
// time.
export default defineConfig({
  // CSS minification is disabled across every app in the arena. Vite's default
  // runs Lightning CSS over the emitted stylesheet, which rewrites it — most
  // visibly by downlevelling `light-dark()` into a 54-variable polyfill under
  // the default `baseline-widely-available` target. That measures the
  // downleveller, not the engine, and it only affects engines that emit modern
  // CSS. Disabling it means each stylesheet is exactly what its engine wrote.
  build: { cssMinify: false },
  plugins: [pandacss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
