import { reactRouter } from "@react-router/dev/vite";
import bamboocss from "@bamboocss/vite";
import { defineConfig } from "vite";

// Bamboo's Vite plugin is the compiler, not an optimisation: it rewrites every
// css()/cva() call to a literal class string and fails the build on any call it
// cannot analyse. The PostCSS integration only emits the stylesheet, which
// leaves the style engine in the client bundle.
export default defineConfig({
  // CSS minification is disabled across every app in the arena. Vite's default
  // runs Lightning CSS over the emitted stylesheet, which rewrites it — most
  // visibly by downlevelling `light-dark()` into a 54-variable polyfill under
  // the default `baseline-widely-available` target. That measures the
  // downleveller, not the engine, and it only affects engines that emit modern
  // CSS. Disabling it means each stylesheet is exactly what its engine wrote.
  build: { cssMinify: false },
  plugins: [bamboocss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
