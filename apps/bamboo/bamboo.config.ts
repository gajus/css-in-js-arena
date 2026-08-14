import { defineConfig } from "@bamboocss/dev";

/**
 * Design tokens. Values are identical to the ones the StyleX app declares in
 * tokens.stylex.ts — the two apps must render the same pixels.
 */
export default defineConfig({
  preflight: true,

  include: ["./app/**/*.{js,jsx,ts,tsx}"],
  exclude: [],

  outdir: "styled-system",

  // The app is designed desktop-first, so every breakpoint is a max-width
  // range. Bamboo's built-ins are mobile-first, so these are declared as
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
  global: {
    css: {
      html: {
        fontFamily: "body",
        fontSize: "15px",
      },
    },
  },

  theme: {
    extend: {
      // Motion for the /lab route. Declared in the theme rather than inline so
      // the engine owns the `@keyframes` block and can prune it with the rules
      // that name it.
      keyframes: {
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        sweep: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },

      tokens: {
        sizes: {
          shellMax: { value: "1240px" },
          navH: { value: "60px" },
          navOffset: { value: "84px" },
        },
        // `top`/`bottom`/`inset` read the `spacing` scale, not `sizes`, so the
        // two nav offsets have to be declared in both to be referencable from
        // either. Bamboo 1.42.0's unresolvedToken check is what surfaced this —
        // before it, `top: "navOffset"` emitted `top:navOffset` and the browser
        // silently dropped it.
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

      // `_osDark` pairs fold into light-dark(), so the palette is declared once
      // and `color-scheme: dark` on a subtree drives the explicit toggle.
      semanticTokens: {
        colors: {
          bg: { value: { base: "#f7f8fa", _osDark: "#14171f" } },
          surface: { value: { base: "#ffffff", _osDark: "#1b1f2a" } },
          surface2: { value: { base: "#f1f3f7", _osDark: "#232834" } },
          surface3: { value: { base: "#e8ecf3", _osDark: "#2b3140" } },
          border: { value: { base: "#e3e7ee", _osDark: "#2c3240" } },
          borderStrong: { value: { base: "#cdd4e0", _osDark: "#3d4557" } },
          text: { value: { base: "#10131a", _osDark: "#e8ebf2" } },
          muted: { value: { base: "#5d6675", _osDark: "#98a1b3" } },
          faint: { value: { base: "#8b94a5", _osDark: "#7c8598" } },
          accent: { value: { base: "#4f46e5", _osDark: "#818cf8" } },
          accentSoft: { value: { base: "#eef0fe", _osDark: "#262a40" } },
          accentContrast: { value: { base: "#ffffff", _osDark: "#0b0d12" } },
          success: { value: { base: "#0f7a52", _osDark: "#34d399" } },
          successSoft: { value: { base: "#e3f5ec", _osDark: "#16302a" } },
          warning: { value: { base: "#92500a", _osDark: "#fbbf24" } },
          warningSoft: { value: { base: "#fdf0dc", _osDark: "#332711" } },
          danger: { value: { base: "#c0271f", _osDark: "#f87171" } },
          dangerSoft: { value: { base: "#fdeceb", _osDark: "#341d1f" } },

          // Derived once from the theme-aware tokens above, so these need no
          // _osDark branch of their own — light-dark() resolves underneath.
          accentHover: { value: "color-mix(in srgb, token(colors.accent) 86%, #000)" },
          dangerHover: { value: "color-mix(in srgb, token(colors.danger) 86%, #000)" },
          surfaceGlass: { value: "color-mix(in srgb, token(colors.surface) 86%, transparent)" },
          surfaceGlassStrong: { value: "color-mix(in srgb, token(colors.surface) 92%, transparent)" },
          barSecondary: { value: "color-mix(in srgb, token(colors.accent) 32%, transparent)" },
          accentBorder: { value: "color-mix(in srgb, token(colors.accent) 30%, transparent)" },
          warningBorder: { value: "color-mix(in srgb, token(colors.warning) 34%, transparent)" },
          dangerBorder: { value: "color-mix(in srgb, token(colors.danger) 40%, transparent)" },
        },
        shadows: {
          sm: {
            value: {
              base: "0 1px 2px rgb(16 19 26 / 0.06), 0 1px 3px rgb(16 19 26 / 0.04)",
              _osDark: "0 1px 2px rgb(0 0 0 / 0.3)",
            },
          },
          md: {
            value: {
              base: "0 4px 12px rgb(16 19 26 / 0.08), 0 1px 3px rgb(16 19 26 / 0.04)",
              _osDark: "0 4px 12px rgb(0 0 0 / 0.36)",
            },
          },
          lg: {
            value: {
              base: "0 12px 32px rgb(16 19 26 / 0.12), 0 2px 8px rgb(16 19 26 / 0.06)",
              _osDark: "0 12px 32px rgb(0 0 0 / 0.44)",
            },
          },
        },
      },
    },
  },
});
