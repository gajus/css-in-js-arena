import { reactRouter } from "@react-router/dev/vite";
import stylex from "@stylexjs/unplugin";
import { defineConfig } from "vite";

export default defineConfig({
  // CSS minification is disabled across every app in the arena. Vite's default
  // runs Lightning CSS over the emitted stylesheet, which rewrites it — most
  // visibly by downlevelling `light-dark()` into a 54-variable polyfill under
  // the default `baseline-widely-available` target. That measures the
  // downleveller, not the engine, and it only affects engines that emit modern
  // CSS. Disabling it means each stylesheet is exactly what its engine wrote.
  build: { cssMinify: false },
  plugins: [
    stylex.vite({
      // NOTE: `useCSSLayers: true` puts every StyleX rule inside an @layer, and
      // unlayered CSS always beats layered CSS. That silently lets the plain
      // reset in reset.css override StyleX styles. The default `:not(#\#)`
      // specificity strategy is what makes StyleX win over element selectors.
      useCSSLayers: false,
      dev: process.env.NODE_ENV === "development",
      runtimeInjection: false,
    }),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
