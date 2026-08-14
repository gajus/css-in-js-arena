import { useState } from "react";
import { css, cx } from "styled-system/css";

import {
  barRect,
  CHART_H,
  CHART_MAX,
  CHART_PAD_L,
  CHART_W,
  GRID_LINES,
  gridY,
  SPARK_H,
  SPARK_W,
  sparklinePoints,
} from "../chart-utils";
import { activity, insights, kpis, revenueBars } from "../data";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon } from "../icons";
import {
  avatar,
  button,
  card,
  cardHead,
  cardNote,
  cardPad,
  cardTitle,
  delta,
  pageActions,
  pageHead,
  pageSub,
  pageTitle,
  segButton,
  segmented,
  tag,
} from "../ui";

const ranges = ["3m", "6m", "12m"];

export function meta() {
  return [{ title: "Overview · Nimbus" }];
}

export default function Dashboard() {
  const [range, setRange] = useState("12m");

  return (
    <>
      <div className={pageHead}>
        <div>
          <h1 className={pageTitle}>Overview</h1>
          <p className={pageSub}>
            Platform health across 12 regions. Figures refresh every 60 seconds and exclude
            internal traffic.
          </p>
        </div>
        <div className={pageActions}>
          <button type="button" className={button({ tone: "secondary" })}>
            Export CSV
          </button>
          <button type="button" className={button({ tone: "primary" })}>
            <PlusIcon />
            New deploy
          </button>
        </div>
      </div>

      <div className={s.kpiGrid}>
        {kpis.map((kpi) => (
          <article key={kpi.label} className={s.kpi}>
            <span className={s.kpiLabel}>{kpi.label}</span>
            <span className={s.kpiValue}>{kpi.value}</span>
            <div className={s.kpiFoot}>
              <span className={delta({ up: kpi.up })}>
                {kpi.up ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {kpi.delta}%
              </span>
              <svg
                width={SPARK_W}
                height={SPARK_H}
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                fill="none"
                aria-hidden="true"
                className={cx(s.spark, kpi.up ? s.sparkUp : s.sparkDown)}
              >
                <polyline
                  points={sparklinePoints(kpi.series)}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </article>
        ))}
      </div>

      <div className={s.dashGrid}>
        <section className={card}>
          <div className={cardHead}>
            <div>
              <h2 className={cardTitle}>Revenue by month</h2>
              <p className={cardNote}>Committed contracts vs. usage-based billing</p>
            </div>
            <div className={segmented}>
              {ranges.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={segButton({ active: range === r })}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className={s.chartBody}>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              role="img"
              aria-label="Revenue by month"
              className={s.chartSvg}
            >
              {GRID_LINES.map((g) => (
                <g key={g}>
                  <line
                    x1={CHART_PAD_L}
                    x2={CHART_W}
                    y1={gridY(g)}
                    y2={gridY(g)}
                    className={s.gridLine}
                  />
                  <text x={0} y={gridY(g) + 3} className={s.axisLabel}>
                    {g}
                  </text>
                </g>
              ))}
              {revenueBars.map((bar, i) => {
                const primary = barRect(i, bar.primary, CHART_MAX, 0);
                const secondary = barRect(i, bar.secondary, CHART_MAX, 1);
                return (
                  <g key={bar.month}>
                    <rect rx="2" {...primary} className={s.barPrimary} />
                    <rect rx="2" {...secondary} className={s.barSecondary} />
                    <text
                      x={primary.x + primary.width + 1.5}
                      y={CHART_H - 6}
                      textAnchor="middle"
                      className={s.axisLabel}
                    >
                      {bar.month}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className={s.chartLegend}>
              <span className={s.legendItem}>
                <span className={cx(s.legendSwatch, s.swatchPrimary)} />
                Committed
              </span>
              <span className={s.legendItem}>
                <span className={cx(s.legendSwatch, s.swatchSecondary)} />
                Usage-based
              </span>
            </div>
          </div>
        </section>

        <section className={card}>
          <div className={cardHead}>
            <h2 className={cardTitle}>Recent activity</h2>
            <a href="/" className={button({ tone: "ghost" })}>
              View all
            </a>
          </div>
          <ul>
            {activity.map((item, i) => (
              <li
                key={`${item.who}-${item.target}`}
                className={cx(s.feedItem, i === activity.length - 1 && s.feedItemLast)}
              >
                <span aria-hidden="true" className={avatar({ size: "sm" })}>
                  {item.initials}
                </span>
                <span className={s.feedText}>
                  <span className={s.feedWho}>{item.who}</span> {item.what}{" "}
                  <code className={s.feedTarget}>{item.target}</code>
                </span>
                <span className={s.feedWhen}>{item.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={s.insightGrid}>
        {insights.map((insight) => (
          <article key={insight.title} className={cx(card, cardPad)}>
            <span aria-hidden="true" className={s.insightIcon}>
              {insight.icon}
            </span>
            <h3 className={s.insightTitle}>{insight.title}</h3>
            <p className={s.insightBody}>{insight.body}</p>
            <span className={tag}>{insight.tag}</span>
          </article>
        ))}
      </div>
    </>
  );
}

const s = {
  kpiGrid: css({
    display: "grid",
    gridTemplateColumns: {
      base: "repeat(4, minmax(0, 1fr))",
      _lap: "repeat(2, minmax(0, 1fr))",
      _phone: "minmax(0, 1fr)",
    },
    gap: "14px",
    marginBottom: "18px",
  }),
  kpi: css({
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: "border", _hover: "borderStrong" },
    rounded: "lg",
    boxShadow: { base: "sm", _hover: "md" },
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
  }),
  kpiLabel: css({ fontSize: "12.5px", fontWeight: 500, color: "muted" }),
  kpiValue: css({
    fontSize: "23px",
    fontWeight: 650,
    letterSpacing: "-0.025em",
    fontVariantNumeric: "tabular-nums",
  }),
  kpiFoot: css({
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "10px",
  }),
  spark: css({ display: "block" }),
  sparkUp: css({ color: "success" }),
  sparkDown: css({ color: "danger" }),

  dashGrid: css({
    display: "grid",
    gridTemplateColumns: {
      base: "minmax(0, 2fr) minmax(0, 1fr)",
      _tablet: "minmax(0, 1fr)",
    },
    gap: "14px",
    marginBottom: "18px",
  }),
  chartBody: css({ padding: "18px" }),
  chartSvg: css({ display: "block", width: "100%", height: "auto" }),
  gridLine: css({ stroke: "border", strokeWidth: "1" }),
  axisLabel: css({ fill: "faint", fontSize: "10px" }),
  barPrimary: css({ fill: "accent" }),
  barSecondary: css({ fill: "barSecondary" }),
  chartLegend: css({ display: "flex", gap: "16px", marginTop: "14px" }),
  legendItem: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12.5px",
    color: "muted",
  }),
  legendSwatch: css({ width: "9px", height: "9px", rounded: "2px" }),
  swatchPrimary: css({ bg: "accent" }),
  swatchSecondary: css({ bg: "barSecondary" }),

  feedItem: css({
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    paddingBlock: "11px",
    paddingInline: "18px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  }),
  feedItemLast: css({ borderBottomWidth: "0" }),
  feedText: css({
    flexGrow: 1,
    fontSize: "13px",
    lineHeight: 1.45,
    color: "muted",
    minWidth: 0,
  }),
  feedWho: css({ fontWeight: 600, color: "text" }),
  feedTarget: css({
    fontFamily: "mono",
    fontSize: "12px",
    paddingBlock: "1px",
    paddingInline: "5px",
    rounded: "4px",
    bg: "surface2",
    color: "text",
  }),
  feedWhen: css({ fontSize: "11.5px", color: "faint", whiteSpace: "nowrap", flexShrink: 0 }),

  insightGrid: css({
    display: "grid",
    gridTemplateColumns: {
      base: "repeat(3, minmax(0, 1fr))",
      _narrow: "minmax(0, 1fr)",
    },
    gap: "14px",
  }),
  insightIcon: css({
    display: "grid",
    placeItems: "center",
    width: "30px",
    height: "30px",
    marginBottom: "11px",
    rounded: "sm",
    bg: "accentSoft",
    color: "accent",
    fontSize: "14px",
  }),
  insightTitle: css({ fontSize: "14px", fontWeight: 600, marginBottom: "5px" }),
  insightBody: css({ fontSize: "13px", lineHeight: 1.5, color: "muted", marginBottom: "11px" }),
};
