import { defineConfig } from "@pandacss/dev";

/**
 * Design tokens. Values are identical to the ones apps/bamboo and apps/stylex
 * declare — all three apps must render the same pixels.
 */
export default defineConfig({
  preflight: true,

  include: ["./app/**/*.{js,jsx,ts,tsx}"],
  exclude: [],

  outdir: "styled-system",

  // The app is designed desktop-first, so every breakpoint is a max-width
  // range. Panda's built-ins are mobile-first, so these are declared as
  // custom conditions rather than fought with.
  conditions: {
    extend: {
      wide: "@media (max-width: 1150px)",
      lap: "@media (max-width: 1000px)",
      tablet: "@media (max-width: 900px)",
      narrow: "@media (max-width: 860px)",
      stack: "@media (max-width: 820px)",
      form: "@media (max-width: 620px)",
      phone: "@media (max-width: 560px)",
      tiny: "@media (max-width: 460px)",
      desktop: "@media (min-width: 901px)",
    },
  },

  // preflight sets its own font stack and leaves font-size at the UA default;
  // the design is built on Inter at 15px.
  globalCss: {
    // `color-scheme` is what makes native controls (checkboxes, scrollbars)
    // follow the theme. Bamboo gets this from its light-dark() token strategy;
    // here it has to be declared alongside the class-based override.
    html: {
      fontFamily: "body",
      fontSize: "15px",
      colorScheme: "light dark",
    },
    "html.light": { colorScheme: "light" },
    "html.dark": { colorScheme: "dark" },
  },

  theme: {
    extend: {
      // Motion for the /lab route. Declared in the theme rather than inline so
      // the engine owns the `@keyframes` block and can prune it with the rules
      // that name it.
      keyframes: {
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        sweep: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      tokens: {
        sizes: {
          shellMax: { value: "1240px" },
          navH: { value: "60px" },
          navOffset: { value: "84px" },
        },
        spacing: {
          navH: { value: "60px" },
          navOffset: { value: "84px" },
        },
        radii: {
          sm: { value: "6px" },
          md: { value: "10px" },
          lg: { value: "14px" },
          full: { value: "999px" },
        },
        fonts: {
          body: { value: '"Inter", system-ui, sans-serif' },
          mono: {
            value:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
        },
      },

      // Panda emits `_osDark` as a media query and `_dark`/`_light` as class
      // selectors, and does not fold the pair into `light-dark()`. So each
      // theme-aware token carries four values, not two: the system default,
      // and an explicit class override that has to be able to beat it in both
      // directions.
      semanticTokens: {
        colors: {
          bg: { value: { base: "#f7f8fa", _osDark: "#14171f", _light: "#f7f8fa", _dark: "#14171f" } },
          surface: { value: { base: "#ffffff", _osDark: "#1b1f2a", _light: "#ffffff", _dark: "#1b1f2a" } },
          surface2: { value: { base: "#f1f3f7", _osDark: "#232834", _light: "#f1f3f7", _dark: "#232834" } },
          surface3: { value: { base: "#e8ecf3", _osDark: "#2b3140", _light: "#e8ecf3", _dark: "#2b3140" } },
          border: { value: { base: "#e3e7ee", _osDark: "#2c3240", _light: "#e3e7ee", _dark: "#2c3240" } },
          borderStrong: { value: { base: "#cdd4e0", _osDark: "#3d4557", _light: "#cdd4e0", _dark: "#3d4557" } },
          text: { value: { base: "#10131a", _osDark: "#e8ebf2", _light: "#10131a", _dark: "#e8ebf2" } },
          muted: { value: { base: "#5d6675", _osDark: "#98a1b3", _light: "#5d6675", _dark: "#98a1b3" } },
          faint: { value: { base: "#8b94a5", _osDark: "#7c8598", _light: "#8b94a5", _dark: "#7c8598" } },
          accent: { value: { base: "#4f46e5", _osDark: "#818cf8", _light: "#4f46e5", _dark: "#818cf8" } },
          accentSoft: { value: { base: "#eef0fe", _osDark: "#262a40", _light: "#eef0fe", _dark: "#262a40" } },
          accentContrast: { value: { base: "#ffffff", _osDark: "#0b0d12", _light: "#ffffff", _dark: "#0b0d12" } },
          success: { value: { base: "#0f7a52", _osDark: "#34d399", _light: "#0f7a52", _dark: "#34d399" } },
          successSoft: { value: { base: "#e3f5ec", _osDark: "#16302a", _light: "#e3f5ec", _dark: "#16302a" } },
          warning: { value: { base: "#92500a", _osDark: "#fbbf24", _light: "#92500a", _dark: "#fbbf24" } },
          warningSoft: { value: { base: "#fdf0dc", _osDark: "#332711", _light: "#fdf0dc", _dark: "#332711" } },
          danger: { value: { base: "#c0271f", _osDark: "#f87171", _light: "#c0271f", _dark: "#f87171" } },
          dangerSoft: { value: { base: "#fdeceb", _osDark: "#341d1f", _light: "#fdeceb", _dark: "#341d1f" } },

          // Derived from the theme-aware tokens above, so these need no
          // condition branches of their own.
          accentHover: { value: "color-mix(in srgb, {colors.accent} 86%, #000)" },
          dangerHover: { value: "color-mix(in srgb, {colors.danger} 86%, #000)" },
          surfaceGlass: { value: "color-mix(in srgb, {colors.surface} 86%, transparent)" },
          surfaceGlassStrong: { value: "color-mix(in srgb, {colors.surface} 92%, transparent)" },
          barSecondary: { value: "color-mix(in srgb, {colors.accent} 32%, transparent)" },
          accentBorder: { value: "color-mix(in srgb, {colors.accent} 30%, transparent)" },
          warningBorder: { value: "color-mix(in srgb, {colors.warning} 34%, transparent)" },
          dangerBorder: { value: "color-mix(in srgb, {colors.danger} 40%, transparent)" },
        },
        shadows: {
          sm: {
            value: {
              base: "0 1px 2px rgb(16 19 26 / 0.06), 0 1px 3px rgb(16 19 26 / 0.04)",
              _osDark: "0 1px 2px rgb(0 0 0 / 0.3)",
              _light: "0 1px 2px rgb(16 19 26 / 0.06), 0 1px 3px rgb(16 19 26 / 0.04)",
              _dark: "0 1px 2px rgb(0 0 0 / 0.3)",
            },
          },
          md: {
            value: {
              base: "0 4px 12px rgb(16 19 26 / 0.08), 0 1px 3px rgb(16 19 26 / 0.04)",
              _osDark: "0 4px 12px rgb(0 0 0 / 0.36)",
              _light: "0 4px 12px rgb(16 19 26 / 0.08), 0 1px 3px rgb(16 19 26 / 0.04)",
              _dark: "0 4px 12px rgb(0 0 0 / 0.36)",
            },
          },
          lg: {
            value: {
              base: "0 12px 32px rgb(16 19 26 / 0.12), 0 2px 8px rgb(16 19 26 / 0.06)",
              _osDark: "0 12px 32px rgb(0 0 0 / 0.44)",
              _light: "0 12px 32px rgb(16 19 26 / 0.12), 0 2px 8px rgb(16 19 26 / 0.06)",
              _dark: "0 12px 32px rgb(0 0 0 / 0.44)",
            },
          },
        },
      },
    },
  },
});
