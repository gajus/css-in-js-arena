import { css, cva } from "styled-system/css";

/**
 * Shared UI primitives. Anything with discrete states is a `cva` recipe —
 * Bamboo compiles the variant matrix into its own cascade layer, so a caller's
 * `css()` always wins over the recipe without a specificity fight.
 */

export const button = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    paddingBlock: "8px",
    paddingInline: "14px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    rounded: "sm",
    fontSize: "13.5px",
    fontWeight: 550,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    cursor: "pointer",
    outlineColor: "accent",
    transitionProperty: "background-color, border-color",
    transitionDuration: "0.15s",
  },
  variants: {
    tone: {
      primary: { bg: { base: "accent", _hover: "accentHover" }, color: "accentContrast" },
      secondary: {
        bg: { base: "surface", _hover: "surface2" },
        borderColor: "borderStrong",
        color: "text",
      },
      ghost: {
        bg: { base: "transparent", _hover: "surface2" },
        color: { base: "muted", _hover: "text" },
      },
      danger: { bg: { base: "danger", _hover: "dangerHover" }, color: "#fff" },
    },
    block: {
      true: { width: "100%", justifyContent: "center" },
    },
  },
  defaultVariants: { tone: "secondary" },
});

export const badge = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    paddingBlock: "2px",
    paddingInline: "8px",
    rounded: "full",
    fontSize: "11.5px",
    fontWeight: 600,
    letterSpacing: "0.005em",
    whiteSpace: "nowrap",
  },
  variants: {
    status: {
      live: { bg: "successSoft", color: "success" },
      staging: { bg: "accentSoft", color: "accent" },
      paused: { bg: "warningSoft", color: "warning" },
      archived: { bg: "surface3", color: "muted" },
    },
  },
});

export const avatar = cva({
  base: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    rounded: "full",
    bg: "accentSoft",
    color: "accent",
    fontWeight: 650,
    letterSpacing: "0.02em",
  },
  variants: {
    size: {
      sm: { width: "24px", height: "24px", fontSize: "10px" },
      md: { width: "30px", height: "30px", fontSize: "11px" },
      lg: {
        width: "56px",
        height: "56px",
        fontSize: "18px",
        backgroundImage:
          "linear-gradient(140deg, token(colors.accent), color-mix(in srgb, token(colors.accent) 55%, #22d3ee))",
        color: "#fff",
      },
    },
  },
  defaultVariants: { size: "md" },
});

export const segButton = cva({
  base: {
    paddingBlock: "5px",
    paddingInline: "11px",
    rounded: "4px",
    fontSize: "12.5px",
    fontWeight: 550,
    cursor: "pointer",
    outlineColor: "accent",
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  variants: {
    active: {
      true: { bg: "surface", color: "text", boxShadow: "sm" },
      false: { bg: "transparent", color: { base: "muted", _hover: "text" } },
    },
  },
  defaultVariants: { active: false },
});

export const pageBtn = cva({
  base: {
    minWidth: "28px",
    height: "28px",
    paddingInline: "8px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "sm",
    fontSize: "12.5px",
    cursor: "pointer",
    outlineColor: "accent",
  },
  variants: {
    current: {
      true: { bg: "accent", borderColor: "accent", color: "accentContrast", fontWeight: 600 },
      false: { bg: { base: "transparent", _hover: "surface2" }, color: { base: "muted", _hover: "text" } },
    },
  },
  defaultVariants: { current: false },
});

export const navLink = cva({
  base: {
    display: "block",
    paddingBlock: "7px",
    paddingInline: "11px",
    rounded: "sm",
    fontSize: "14px",
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  variants: {
    active: {
      true: { bg: "accentSoft", color: "accent", fontWeight: 600 },
      false: {
        bg: { base: "transparent", _hover: "surface2" },
        color: { base: "muted", _hover: "text" },
        fontWeight: 500,
      },
    },
  },
  defaultVariants: { active: false },
});

export const sideLink = cva({
  base: {
    display: "block",
    paddingBlock: "7px",
    paddingInline: "10px",
    rounded: "sm",
    fontSize: "13.5px",
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  variants: {
    active: {
      true: { bg: "accentSoft", color: "accent", fontWeight: 600 },
      false: { bg: { base: "transparent", _hover: "surface2" }, color: { base: "muted", _hover: "text" } },
    },
  },
  defaultVariants: { active: false },
});

/* --- static primitives ---------------------------------------------------- */

export const pageHead = css({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "24px",
});

export const pageTitle = css({ fontSize: "25px", fontWeight: 600, letterSpacing: "-0.022em" });
export const pageSub = css({ marginTop: "5px", fontSize: "14px", color: "muted", maxWidth: "62ch" });
export const pageActions = css({ display: "flex", gap: "8px", flexShrink: 0 });

export const card = css({
  bg: "surface",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  rounded: "lg",
  boxShadow: "sm",
});

export const cardPad = css({ padding: "18px" });

export const cardHead = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  paddingBlock: "15px",
  paddingInline: "18px",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border",
});

export const cardTitle = css({ fontSize: "14.5px", fontWeight: 600 });
export const cardNote = css({ fontSize: "12.5px", color: "muted", marginTop: "2px" });

export const badgeDot = css({ width: "5px", height: "5px", rounded: "full", bg: "currentColor" });

export const delta = cva({
  base: { display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", fontWeight: 600 },
  variants: { up: { true: { color: "success" }, false: { color: "danger" } } },
});

export const segmented = css({
  display: "inline-flex",
  padding: "2px",
  bg: "surface2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  rounded: "sm",
});

export const tag = css({
  display: "inline-block",
  paddingBlock: "2px",
  paddingInline: "7px",
  rounded: "sm",
  bg: "surface2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  fontSize: "11px",
  fontWeight: 550,
  color: "muted",
});

export const field = css({
  paddingBlock: "7px",
  paddingInline: "11px",
  bg: "surface",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "borderStrong",
  rounded: "sm",
  fontSize: "13.5px",
  color: "text",
  outlineColor: "accent",
  _placeholder: { color: "faint", opacity: 1 },
});

export const fieldGrow = css({ flexGrow: 1, minWidth: "180px" });

export const sectionTitle = css({ fontSize: "16px", fontWeight: 600, marginBottom: "3px" });
export const sectionNote = css({ fontSize: "13px", color: "muted", marginBottom: "16px", maxWidth: "60ch" });
export const stack = css({ display: "flex", flexDirection: "column", gap: "18px" });

export const iconButton = css({
  display: "grid",
  placeItems: "center",
  width: "32px",
  height: "32px",
  padding: 0,
  flexShrink: 0,
  bg: { base: "transparent", _hover: "surface2" },
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  rounded: "sm",
  color: { base: "muted", _hover: "text" },
  cursor: "pointer",
  outlineColor: "accent",
  transitionProperty: "background-color, color",
  transitionDuration: "0.15s",
});
