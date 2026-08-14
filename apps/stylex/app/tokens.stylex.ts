import * as stylex from "@stylexjs/stylex";

const DARK = "@media (prefers-color-scheme: dark)";

/**
 * Design tokens. Values are identical to the ones the bamboo app declares as
 * CSS custom properties in app.css — the two apps must render the same pixels.
 */
export const t = stylex.defineVars({
  bg: { default: "#f7f8fa", [DARK]: "#14171f" },
  surface: { default: "#ffffff", [DARK]: "#1b1f2a" },
  surface2: { default: "#f1f3f7", [DARK]: "#232834" },
  surface3: { default: "#e8ecf3", [DARK]: "#2b3140" },
  border: { default: "#e3e7ee", [DARK]: "#2c3240" },
  borderStrong: { default: "#cdd4e0", [DARK]: "#3d4557" },
  text: { default: "#10131a", [DARK]: "#e8ebf2" },
  muted: { default: "#5d6675", [DARK]: "#98a1b3" },
  faint: { default: "#8b94a5", [DARK]: "#7c8598" },
  accent: { default: "#4f46e5", [DARK]: "#818cf8" },
  accentSoft: { default: "#eef0fe", [DARK]: "#262a40" },
  accentContrast: { default: "#ffffff", [DARK]: "#0b0d12" },
  success: { default: "#0f7a52", [DARK]: "#34d399" },
  successSoft: { default: "#e3f5ec", [DARK]: "#16302a" },
  warning: { default: "#92500a", [DARK]: "#fbbf24" },
  warningSoft: { default: "#fdf0dc", [DARK]: "#332711" },
  danger: { default: "#c0271f", [DARK]: "#f87171" },
  dangerSoft: { default: "#fdeceb", [DARK]: "#341d1f" },

  shSm: {
    default: "0 1px 2px rgb(16 19 26 / 0.06), 0 1px 3px rgb(16 19 26 / 0.04)",
    [DARK]: "0 1px 2px rgb(0 0 0 / 0.3)",
  },
  shMd: {
    default: "0 4px 12px rgb(16 19 26 / 0.08), 0 1px 3px rgb(16 19 26 / 0.04)",
    [DARK]: "0 4px 12px rgb(0 0 0 / 0.36)",
  },
  shLg: {
    default: "0 12px 32px rgb(16 19 26 / 0.12), 0 2px 8px rgb(16 19 26 / 0.06)",
    [DARK]: "0 12px 32px rgb(0 0 0 / 0.44)",
  },
});

export const size = stylex.defineVars({
  rSm: "6px",
  rMd: "10px",
  rLg: "14px",
  rFull: "999px",
  shellMax: "1240px",
  navH: "60px",
  navOffset: "84px",
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
});
