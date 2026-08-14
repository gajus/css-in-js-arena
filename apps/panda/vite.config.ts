import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// Panda's shipped integration is the PostCSS plugin (see postcss.config.cjs).
// The first-party Vite plugin exists only as a 2.0 beta, so this app uses the
// stable path — which means `css()`/`cva()` resolve class names at runtime
// rather than being folded to literals at build time.
export default defineConfig({
  // CSS minification is disabled across every app in the arena. Vite's default
  // runs Lightning CSS over the emitted stylesheet, which rewrites it — most
  // visibly by downlevelling `light-dark()` into a 54-variable polyfill under
  // the default `baseline-widely-available` target. That measures the
  // downleveller, not the engine, and it only affects engines that emit modern
  // CSS. Disabling it means each stylesheet is exactly what its engine wrote.
  build: { cssMinify: false },
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
