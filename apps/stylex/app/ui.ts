import * as stylex from "@stylexjs/stylex";

import { size, t } from "./tokens.stylex";

/**
 * Shared UI primitives — the StyleX equivalent of the reusable component
 * classes the bamboo app declares in app.css (.btn, .card, .badge, …).
 */
export const ui = stylex.create({
  pageHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  pageTitle: { fontSize: 25, fontWeight: 600, letterSpacing: "-0.022em" },
  pageSub: { marginTop: 5, fontSize: 14, color: t.muted, maxWidth: "62ch" },
  pageActions: { display: "flex", gap: 8, flexShrink: 0 },

  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    paddingBlock: 8,
    paddingInline: 14,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: size.rSm,
    fontSize: 13.5,
    fontWeight: 550,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    cursor: "pointer",
    outlineColor: t.accent,
    transitionProperty: "background-color, border-color",
    transitionDuration: "0.15s",
  },
  btnPrimary: {
    backgroundColor: {
      default: t.accent,
      ":hover": `color-mix(in srgb, ${t.accent} 86%, #000)`,
    },
    color: t.accentContrast,
  },
  btnSecondary: {
    backgroundColor: { default: t.surface, ":hover": t.surface2 },
    borderColor: t.borderStrong,
    color: t.text,
  },
  btnGhost: {
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    color: { default: t.muted, ":hover": t.text },
  },
  btnDanger: {
    backgroundColor: {
      default: t.danger,
      ":hover": `color-mix(in srgb, ${t.danger} 86%, #000)`,
    },
    color: "#fff",
  },
  btnBlock: { width: "100%", justifyContent: "center" },

  card: {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rLg,
    boxShadow: t.shSm,
  },
  cardPad: { padding: 18 },
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingBlock: 15,
    paddingInline: 18,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  cardTitle: { fontSize: 14.5, fontWeight: 600 },
  cardNote: { fontSize: 12.5, color: t.muted, marginTop: 2 },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    paddingBlock: 2,
    paddingInline: 8,
    borderRadius: size.rFull,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.005em",
    whiteSpace: "nowrap",
  },
  badgeLive: { backgroundColor: t.successSoft, color: t.success },
  badgeStaging: { backgroundColor: t.accentSoft, color: t.accent },
  badgePaused: { backgroundColor: t.warningSoft, color: t.warning },
  badgeArchived: { backgroundColor: t.surface3, color: t.muted },
  badgeDot: { width: 5, height: 5, borderRadius: size.rFull, backgroundColor: "currentColor" },

  delta: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600 },
  deltaUp: { color: t.success },
  deltaDown: { color: t.danger },

  segmented: {
    display: "inline-flex",
    padding: 2,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rSm,
  },
  segBtn: {
    paddingBlock: 5,
    paddingInline: 11,
    backgroundColor: { default: "transparent", ":hover": "transparent" },
    borderRadius: 4,
    fontSize: 12.5,
    fontWeight: 550,
    color: { default: t.muted, ":hover": t.text },
    cursor: "pointer",
    outlineColor: t.accent,
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  segBtnOn: {
    backgroundColor: { default: t.surface, ":hover": t.surface },
    color: { default: t.text, ":hover": t.text },
    boxShadow: t.shSm,
  },

  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: size.rFull,
    backgroundColor: t.accentSoft,
    color: t.accent,
    fontSize: 11,
    fontWeight: 650,
    letterSpacing: "0.02em",
  },
  avatarSm: { width: 24, height: 24, fontSize: 10 },
  avatarLg: {
    width: 56,
    height: 56,
    fontSize: 18,
    backgroundImage: `linear-gradient(140deg, ${t.accent}, color-mix(in srgb, ${t.accent} 55%, #22d3ee))`,
    color: "#fff",
  },

  tag: {
    display: "inline-block",
    paddingBlock: 2,
    paddingInline: 7,
    borderRadius: size.rSm,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    fontSize: 11,
    fontWeight: 550,
    color: t.muted,
  },

  field: {
    paddingBlock: 7,
    paddingInline: 11,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.borderStrong,
    borderRadius: size.rSm,
    fontSize: 13.5,
    color: t.text,
    outlineColor: t.accent,
    "::placeholder": { color: t.faint, opacity: 1 },
  },
  fieldGrow: { flexGrow: 1, minWidth: 180 },

  // Everything bamboo applies to `select` for free. Native <select> also
  // ignores author line-height until `appearance` is reset, which is why the
  // control would otherwise be 3px taller than the text inputs beside it.
  selectField: {
    appearance: "none",
    paddingRight: 24,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundImage: {
      default: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%232e3440'%3E%3Cpath d='M5 6l5 5 5-5 2 1-7 7-7-7 2-1z'/%3E%3C/svg%3E")`,
      "@media (prefers-color-scheme: dark)": `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23eceff4'%3E%3Cpath d='M5 6l5 5 5-5 2 1-7 7-7-7 2-1z'/%3E%3C/svg%3E")`,
    },
  },

  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 3 },
  sectionNote: { fontSize: 13, color: t.muted, marginBottom: 16, maxWidth: "60ch" },

  stack: { display: "flex", flexDirection: "column", gap: 18 },
});

export const badgeFor = {
  live: ui.badgeLive,
  staging: ui.badgeStaging,
  paused: ui.badgePaused,
  archived: ui.badgeArchived,
} as const;
