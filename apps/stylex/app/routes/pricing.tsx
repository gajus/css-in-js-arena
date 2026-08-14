import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { comparison, faqs, plans } from "../data";
import { CheckIcon } from "../icons";
import { size, t } from "../tokens.stylex";
import { ui } from "../ui";

const periods = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly · save 20%" },
] as const;

const MID = "@media (max-width: 900px)";
const WIDE = "@media (min-width: 901px)";

export function meta() {
  return [{ title: "Pricing · Nimbus" }];
}

export default function Pricing() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({});

  return (
    <>
      <div {...stylex.props(s.pricingHead)}>
        <h1 {...stylex.props(ui.pageTitle)}>Pricing that scales with your rollout</h1>
        <p {...stylex.props(ui.pageSub, s.centeredSub)}>
          Every plan includes unlimited members, preview environments and the full API. Pay only
          for the workspaces you keep running.
        </p>
        <div {...stylex.props(s.billingToggle)}>
          <div {...stylex.props(ui.segmented)}>
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
                {...stylex.props(ui.segBtn, period === p.id && ui.segBtnOn)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div {...stylex.props(s.planGrid)}>
        {plans.map((plan) => {
          const amount = plan.price[period];
          return (
            <article key={plan.name} {...stylex.props(s.plan, plan.featured && s.planFeatured)}>
              {plan.featured && <span {...stylex.props(s.planRibbon)}>Most popular</span>}
              <div>
                <h2 {...stylex.props(s.planName)}>{plan.name}</h2>
                <p {...stylex.props(s.planBlurb)}>{plan.blurb}</p>
              </div>
              <div {...stylex.props(s.planPrice)}>
                {amount === null ? (
                  <span {...stylex.props(s.planAmount)}>Custom</span>
                ) : (
                  <>
                    <span {...stylex.props(s.planAmount)}>${amount}</span>
                    <span {...stylex.props(s.planPeriod)}>per seat / month</span>
                  </>
                )}
              </div>
              <ul {...stylex.props(s.planFeatures)}>
                {plan.features.map((feature) => (
                  <li key={feature} {...stylex.props(s.planFeature)}>
                    <span {...stylex.props(s.check)}>
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                {...stylex.props(
                  ui.btn,
                  plan.featured ? ui.btnPrimary : ui.btnSecondary,
                  ui.btnBlock,
                )}
              >
                {plan.cta}
              </button>
            </article>
          );
        })}
      </div>

      <h2 {...stylex.props(s.compareTitle)}>Compare every plan</h2>
      <div {...stylex.props(s.tableWrap)}>
        <table {...stylex.props(s.table)}>
          <thead>
            <tr>
              <th scope="col" {...stylex.props(s.th, s.thLeft)}>
                Feature
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Starter
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Team
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row, i) => {
              const last = i === comparison.length - 1;
              return (
                <tr key={row.feature} {...stylex.props(s.tr)}>
                  <td {...stylex.props(s.td, last && s.tdLast, s.tdFirst)}>{row.feature}</td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>{row.starter}</td>
                  <td {...stylex.props(s.td, last && s.tdLast, s.tdFeatured)}>{row.team}</td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>{row.enterprise}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 {...stylex.props(s.compareTitle, s.compareTitleTop)}>Frequently asked</h2>
      <div {...stylex.props(s.faqList)}>
        {faqs.map((faq, i) => (
          <details
            key={faq.q}
            open={i === 0}
            // StyleX cannot target `details[open] summary::after`, so the
            // open/closed glyph has to be driven from React state instead.
            onToggle={(event) =>
              setOpenFaqs((prev) => ({ ...prev, [faq.q]: event.currentTarget.open }))
            }
            {...stylex.props(s.faq)}
          >
            <summary
              {...stylex.props(
                s.faqSummary,
                (openFaqs[faq.q] ?? i === 0) && s.faqSummaryOpen,
              )}
            >
              {faq.q}
            </summary>
            <div {...stylex.props(s.faqBody)}>{faq.a}</div>
          </details>
        ))}
      </div>
    </>
  );
}

const s = stylex.create({
  pricingHead: { textAlign: "center", marginBottom: 26 },
  centeredSub: { marginInline: "auto" },
  billingToggle: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(3, minmax(0, 1fr))", [MID]: "minmax(0, 1fr)" },
    gap: 16,
    alignItems: "start",
    marginBottom: 44,
    maxWidth: { default: null, [MID]: 440 },
    marginInline: { default: null, [MID]: "auto" },
  },
  plan: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 22,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rLg,
    boxShadow: t.shSm,
  },
  planFeatured: {
    borderColor: t.accent,
    boxShadow: t.shLg,
    transform: { default: null, [WIDE]: "scale(1.035)" },
  },
  planRibbon: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    paddingBlock: 3,
    paddingInline: 11,
    borderRadius: size.rFull,
    backgroundColor: t.accent,
    color: t.accentContrast,
    fontSize: 11,
    fontWeight: 650,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  planName: { fontSize: 15, fontWeight: 650 },
  planBlurb: { fontSize: 13, color: t.muted, marginTop: 3 },
  planPrice: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  planAmount: { fontSize: 34, fontWeight: 680, letterSpacing: "-0.03em", lineHeight: 1 },
  planPeriod: { fontSize: 13, color: t.muted },
  planFeatures: { display: "flex", flexDirection: "column", gap: 9, flexGrow: 1 },
  planFeature: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 13,
    lineHeight: 1.45,
    color: t.muted,
  },
  check: { color: t.success, flexShrink: 0, marginTop: 1, lineHeight: 0 },

  compareTitle: { fontSize: 18, fontWeight: 600, marginBottom: 14, textAlign: "center" },
  compareTitleTop: { marginTop: 44 },

  tableWrap: {
    overflowX: "auto",
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rLg,
    boxShadow: t.shSm,
  },
  table: { width: "100%", minWidth: 620, borderCollapse: "separate", borderSpacing: 0 },
  th: {
    paddingBlock: 10,
    paddingInline: 14,
    backgroundColor: t.surface2,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    fontSize: 12,
    fontWeight: 600,
    color: t.text,
    textAlign: "center",
  },
  thLeft: { textAlign: "left" },
  tr: {
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    transitionProperty: "background-color",
    transitionDuration: "0.12s",
  },
  td: {
    paddingBlock: 11,
    paddingInline: 14,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    fontSize: 13.5,
    textAlign: "center",
  },
  tdFirst: { textAlign: "left", fontWeight: 550 },
  tdLast: { borderBottomWidth: 0 },
  tdFeatured: { backgroundColor: t.accentSoft, color: t.accent, fontWeight: 600 },

  faqList: { display: "flex", flexDirection: "column", gap: 10 },
  faq: {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rMd,
  },
  faqSummary: {
    paddingBlock: 14,
    paddingInline: 16,
    fontSize: 13.5,
    fontWeight: 600,
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
    outlineColor: t.accent,
    "::-webkit-details-marker": { display: "none" },
    "::after": {
      content: "'+'",
      fontSize: 17,
      fontWeight: 400,
      color: t.muted,
      lineHeight: 1,
    },
  },
  faqSummaryOpen: {
    "::after": { content: "'−'" },
  },
  faqBody: {
    paddingBlock: 13,
    paddingInline: 16,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: t.border,
    fontSize: 13,
    lineHeight: 1.6,
    color: t.muted,
  },
});
