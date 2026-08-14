import * as stylex from "@stylexjs/stylex";

import { t } from "./tokens.stylex";

/**
 * Explicit theme overrides for the light/dark toggle. `defineVars` already
 * handles `prefers-color-scheme`; these two themes let the user override the
 * system preference. StyleX requires static literals here, so the palette has
 * to be repeated rather than derived from the token defaults.
 */

export const lightTheme = stylex.createTheme(t, {
  bg: "#f7f8fa",
  surface: "#ffffff",
  surface2: "#f1f3f7",
  surface3: "#e8ecf3",
  border: "#e3e7ee",
  borderStrong: "#cdd4e0",
  text: "#10131a",
  muted: "#5d6675",
  faint: "#8b94a5",
  accent: "#4f46e5",
  accentSoft: "#eef0fe",
  accentContrast: "#ffffff",
  success: "#0f7a52",
  successSoft: "#e3f5ec",
  warning: "#92500a",
  warningSoft: "#fdf0dc",
  danger: "#c0271f",
  dangerSoft: "#fdeceb",
  shSm: "0 1px 2px rgb(16 19 26 / 0.06), 0 1px 3px rgb(16 19 26 / 0.04)",
  shMd: "0 4px 12px rgb(16 19 26 / 0.08), 0 1px 3px rgb(16 19 26 / 0.04)",
  shLg: "0 12px 32px rgb(16 19 26 / 0.12), 0 2px 8px rgb(16 19 26 / 0.06)",
});

export const darkTheme = stylex.createTheme(t, {
  bg: "#14171f",
  surface: "#1b1f2a",
  surface2: "#232834",
  surface3: "#2b3140",
  border: "#2c3240",
  borderStrong: "#3d4557",
  text: "#e8ebf2",
  muted: "#98a1b3",
  faint: "#7c8598",
  accent: "#818cf8",
  accentSoft: "#262a40",
  accentContrast: "#0b0d12",
  success: "#34d399",
  successSoft: "#16302a",
  warning: "#fbbf24",
  warningSoft: "#332711",
  danger: "#f87171",
  dangerSoft: "#341d1f",
  shSm: "0 1px 2px rgb(0 0 0 / 0.3)",
  shMd: "0 4px 12px rgb(0 0 0 / 0.36)",
  shLg: "0 12px 32px rgb(0 0 0 / 0.44)",
});
