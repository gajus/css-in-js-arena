import { useState } from "react";
import { css, cx } from "styled-system/css";

import { comparison, faqs, plans } from "../data";
import { CheckIcon } from "../icons";
import { button, pageSub, pageTitle, segButton, segmented } from "../ui";

const periods = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly · save 20%" },
] as const;

export function meta() {
  return [{ title: "Pricing · Nimbus" }];
}

export default function Pricing() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <div className={s.pricingHead}>
        <h1 className={pageTitle}>Pricing that scales with your rollout</h1>
        <p className={cx(pageSub, s.centeredSub)}>
          Every plan includes unlimited members, preview environments and the full API. Pay only
          for the workspaces you keep running.
        </p>
        <div className={s.billingToggle}>
          <div className={segmented}>
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={period === p.id}
                onClick={() => setPeriod(p.id)}
                className={segButton({ active: period === p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.planGrid}>
        {plans.map((plan) => {
          const amount = plan.price[period];
          return (
            <article key={plan.name} className={cx(s.plan, plan.featured && s.planFeatured)}>
              {plan.featured && <span className={s.planRibbon}>Most popular</span>}
              <div>
                <h2 className={s.planName}>{plan.name}</h2>
                <p className={s.planBlurb}>{plan.blurb}</p>
              </div>
              <div className={s.planPrice}>
                {amount === null ? (
                  <span className={s.planAmount}>Custom</span>
                ) : (
                  <>
                    <span className={s.planAmount}>${amount}</span>
                    <span className={s.planPeriod}>per seat / month</span>
                  </>
                )}
              </div>
              <ul className={s.planFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature} className={s.planFeature}>
                    <span className={s.check}>
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={button({ tone: plan.featured ? "primary" : "secondary", block: true })}
              >
                {plan.cta}
              </button>
            </article>
          );
        })}
      </div>

      <h2 className={s.compareTitle}>Compare every plan</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={cx(s.th, s.thLeft)}>
                Feature
              </th>
              <th scope="col" className={s.th}>
                Starter
              </th>
              <th scope="col" className={s.th}>
                Team
              </th>
              <th scope="col" className={s.th}>
                Enterprise
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row, i) => {
              const last = i === comparison.length - 1;
              return (
                <tr key={row.feature} className={s.tr}>
                  <td className={cx(s.td, last && s.tdLast, s.tdFirst)}>{row.feature}</td>
                  <td className={cx(s.td, last && s.tdLast)}>{row.starter}</td>
                  <td className={cx(s.td, last && s.tdLast, s.tdFeatured)}>{row.team}</td>
                  <td className={cx(s.td, last && s.tdLast)}>{row.enterprise}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className={cx(s.compareTitle, s.compareTitleTop)}>Frequently asked</h2>
      <div className={s.faqList}>
        {faqs.map((faq, i) => (
          <details key={faq.q} open={i === 0} className={s.faq}>
            {/* The open/closed glyph is a `details[open] &` selector, so the
                accordion needs no onToggle handler or React state. */}
            <summary className={s.faqSummary}>{faq.q}</summary>
            <div className={s.faqBody}>{faq.a}</div>
          </details>
        ))}
      </div>
    </>
  );
}

const s = {
  pricingHead: css({ textAlign: "center", marginBottom: "26px" }),
  centeredSub: css({ marginInline: "auto" }),
  billingToggle: css({
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginTop: "18px",
  }),

  planGrid: css({
    display: "grid",
    gridTemplateColumns: { base: "repeat(3, minmax(0, 1fr))", _tablet: "minmax(0, 1fr)" },
    gap: "16px",
    alignItems: "start",
    marginBottom: "44px",
    maxWidth: { _tablet: "440px" },
    marginInline: { _tablet: "auto" },
  }),
  plan: css({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "22px",
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "lg",
    boxShadow: "sm",
  }),
  planFeatured: css({
    borderColor: "accent",
    boxShadow: "lg",
    transform: { _desktop: "scale(1.035)" },
  }),
  planRibbon: css({
    position: "absolute",
    top: "-10px",
    left: "50%",
    transform: "translateX(-50%)",
    paddingBlock: "3px",
    paddingInline: "11px",
    rounded: "full",
    bg: "accent",
    color: "accentContrast",
    fontSize: "11px",
    fontWeight: 650,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  }),
  planName: css({ fontSize: "15px", fontWeight: 650 }),
  planBlurb: css({ fontSize: "13px", color: "muted", marginTop: "3px" }),
  planPrice: css({
    display: "flex",
    alignItems: "baseline",
    gap: "5px",
    paddingBottom: "14px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  }),
  planAmount: css({ fontSize: "34px", fontWeight: 680, letterSpacing: "-0.03em", lineHeight: 1 }),
  planPeriod: css({ fontSize: "13px", color: "muted" }),
  planFeatures: css({ display: "flex", flexDirection: "column", gap: "9px", flexGrow: 1 }),
  planFeature: css({
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    lineHeight: 1.45,
    color: "muted",
  }),
  check: css({ color: "success", flexShrink: 0, marginTop: "1px", lineHeight: 0 }),

  compareTitle: css({ fontSize: "18px", fontWeight: 600, marginBottom: "14px", textAlign: "center" }),
  compareTitleTop: css({ marginTop: "44px" }),

  tableWrap: css({
    overflowX: "auto",
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "lg",
    boxShadow: "sm",
  }),
  table: css({ width: "100%", minWidth: "620px", borderCollapse: "separate", borderSpacing: 0 }),
  th: css({
    paddingBlock: "10px",
    paddingInline: "14px",
    bg: "surface2",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
    fontSize: "12px",
    fontWeight: 600,
    color: "text",
    textAlign: "center",
  }),
  thLeft: css({ textAlign: "left" }),
  tr: css({
    bg: { base: "transparent", _hover: "surface2" },
    transitionProperty: "background-color",
    transitionDuration: "0.12s",
  }),
  td: css({
    paddingBlock: "11px",
    paddingInline: "14px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
    fontSize: "13.5px",
    textAlign: "center",
  }),
  tdFirst: css({ textAlign: "left", fontWeight: 550 }),
  tdLast: css({ borderBottomWidth: "0" }),
  tdFeatured: css({ bg: "accentSoft", color: "accent", fontWeight: 600 }),

  faqList: css({ display: "flex", flexDirection: "column", gap: "10px" }),
  faq: css({
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "md",
  }),
  faqSummary: css({
    paddingBlock: "14px",
    paddingInline: "16px",
    fontSize: "13.5px",
    fontWeight: 600,
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    cursor: "pointer",
    outlineColor: "accent",
    "&::-webkit-details-marker": { display: "none" },
    _after: {
      content: '"+"',
      fontSize: "17px",
      fontWeight: 400,
      color: "muted",
      lineHeight: 1,
    },
    "details[open] &": {
      _after: { content: '"−"' },
    },
  }),
  faqBody: css({
    paddingBlock: "13px",
    paddingInline: "16px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border",
    fontSize: "13px",
    lineHeight: 1.6,
    color: "muted",
  }),
};
