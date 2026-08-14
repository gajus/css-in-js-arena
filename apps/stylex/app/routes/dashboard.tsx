import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

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
import { size, t } from "../tokens.stylex";
import { ui } from "../ui";

const ranges = ["3m", "6m", "12m"];

const WIDE = "@media (max-width: 1000px)";
const MID = "@media (max-width: 900px)";
const NARROW = "@media (max-width: 860px)";
const TINY = "@media (max-width: 560px)";

export function meta() {
  return [{ title: "Overview · Nimbus" }];
}

export default function Dashboard() {
  const [range, setRange] = useState("12m");

  return (
    <>
      <div {...stylex.props(ui.pageHead)}>
        <div>
          <h1 {...stylex.props(ui.pageTitle)}>Overview</h1>
          <p {...stylex.props(ui.pageSub)}>
            Platform health across 12 regions. Figures refresh every 60 seconds and exclude
            internal traffic.
          </p>
        </div>
        <div {...stylex.props(ui.pageActions)}>
          <button type="button" {...stylex.props(ui.btn, ui.btnSecondary)}>
            Export CSV
          </button>
          <button type="button" {...stylex.props(ui.btn, ui.btnPrimary)}>
            <PlusIcon />
            New deploy
          </button>
        </div>
      </div>

      <div {...stylex.props(s.kpiGrid)}>
        {kpis.map((kpi) => (
          <article key={kpi.label} {...stylex.props(s.kpi)}>
            <span {...stylex.props(s.kpiLabel)}>{kpi.label}</span>
            <span {...stylex.props(s.kpiValue)}>{kpi.value}</span>
            <div {...stylex.props(s.kpiFoot)}>
              <span {...stylex.props(ui.delta, kpi.up ? ui.deltaUp : ui.deltaDown)}>
                {kpi.up ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {kpi.delta}%
              </span>
              <svg
                width={SPARK_W}
                height={SPARK_H}
                viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                fill="none"
                aria-hidden="true"
                {...stylex.props(s.spark, kpi.up ? s.sparkUp : s.sparkDown)}
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

      <div {...stylex.props(s.dashGrid)}>
        <section {...stylex.props(ui.card)}>
          <div {...stylex.props(ui.cardHead)}>
            <div>
              <h2 {...stylex.props(ui.cardTitle)}>Revenue by month</h2>
              <p {...stylex.props(ui.cardNote)}>Committed contracts vs. usage-based billing</p>
            </div>
            <div {...stylex.props(ui.segmented)}>
              {ranges.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  {...stylex.props(ui.segBtn, range === r && ui.segBtnOn)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div {...stylex.props(s.chartBody)}>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              role="img"
              aria-label="Revenue by month"
              {...stylex.props(s.chartSvg)}
            >
              {GRID_LINES.map((g) => (
                <g key={g}>
                  <line
                    x1={CHART_PAD_L}
                    x2={CHART_W}
                    y1={gridY(g)}
                    y2={gridY(g)}
                    {...stylex.props(s.gridLine)}
                  />
                  <text x={0} y={gridY(g) + 3} {...stylex.props(s.axisLabel)}>
                    {g}
                  </text>
                </g>
              ))}
              {revenueBars.map((bar, i) => {
                const primary = barRect(i, bar.primary, CHART_MAX, 0);
                const secondary = barRect(i, bar.secondary, CHART_MAX, 1);
                return (
                  <g key={bar.month}>
                    <rect rx="2" {...primary} {...stylex.props(s.barPrimary)} />
                    <rect rx="2" {...secondary} {...stylex.props(s.barSecondary)} />
                    <text
                      x={primary.x + primary.width + 1.5}
                      y={CHART_H - 6}
                      textAnchor="middle"
                      {...stylex.props(s.axisLabel)}
                    >
                      {bar.month}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div {...stylex.props(s.chartLegend)}>
              <span {...stylex.props(s.legendItem)}>
                <span {...stylex.props(s.legendSwatch, s.swatchPrimary)} />
                Committed
              </span>
              <span {...stylex.props(s.legendItem)}>
                <span {...stylex.props(s.legendSwatch, s.swatchSecondary)} />
                Usage-based
              </span>
            </div>
          </div>
        </section>

        <section {...stylex.props(ui.card)}>
          <div {...stylex.props(ui.cardHead)}>
            <h2 {...stylex.props(ui.cardTitle)}>Recent activity</h2>
            <a href="/" {...stylex.props(ui.btn, ui.btnGhost)}>
              View all
            </a>
          </div>
          <ul>
            {activity.map((item, i) => (
              <li
                key={`${item.who}-${item.target}`}
                {...stylex.props(s.feedItem, i === activity.length - 1 && s.feedItemLast)}
              >
                <span aria-hidden="true" {...stylex.props(ui.avatar, ui.avatarSm)}>
                  {item.initials}
                </span>
                <span {...stylex.props(s.feedText)}>
                  <span {...stylex.props(s.feedWho)}>{item.who}</span> {item.what}{" "}
                  <code {...stylex.props(s.feedTarget)}>{item.target}</code>
                </span>
                <span {...stylex.props(s.feedWhen)}>{item.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div {...stylex.props(s.insightGrid)}>
        {insights.map((insight) => (
          <article key={insight.title} {...stylex.props(ui.card, ui.cardPad)}>
            <span aria-hidden="true" {...stylex.props(s.insightIcon)}>
              {insight.icon}
            </span>
            <h3 {...stylex.props(s.insightTitle)}>{insight.title}</h3>
            <p {...stylex.props(s.insightBody)}>{insight.body}</p>
            <span {...stylex.props(ui.tag)}>{insight.tag}</span>
          </article>
        ))}
      </div>
    </>
  );
}

const s = stylex.create({
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(4, minmax(0, 1fr))",
      [WIDE]: "repeat(2, minmax(0, 1fr))",
      [TINY]: "minmax(0, 1fr)",
    },
    gap: 14,
    marginBottom: 18,
  },
  kpi: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: t.border, ":hover": t.borderStrong },
    borderRadius: size.rLg,
    boxShadow: { default: t.shSm, ":hover": t.shMd },
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
  },
  kpiLabel: { fontSize: 12.5, fontWeight: 500, color: t.muted },
  kpiValue: {
    fontSize: 23,
    fontWeight: 650,
    letterSpacing: "-0.025em",
    fontVariantNumeric: "tabular-nums",
  },
  kpiFoot: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  spark: { display: "block" },
  sparkUp: { color: t.success },
  sparkDown: { color: t.danger },

  dashGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 2fr) minmax(0, 1fr)",
      [MID]: "minmax(0, 1fr)",
    },
    gap: 14,
    marginBottom: 18,
  },
  chartBody: { padding: 18 },
  chartSvg: { display: "block", width: "100%", height: "auto" },
  gridLine: { stroke: t.border, strokeWidth: 1 },
  axisLabel: { fill: t.faint, fontSize: 10 },
  barPrimary: { fill: t.accent },
  barSecondary: { fill: `color-mix(in srgb, ${t.accent} 32%, transparent)` },
  chartLegend: { display: "flex", gap: 16, marginTop: 14 },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    color: t.muted,
  },
  legendSwatch: { width: 9, height: 9, borderRadius: 2 },
  swatchPrimary: { backgroundColor: t.accent },
  swatchSecondary: { backgroundColor: `color-mix(in srgb, ${t.accent} 32%, transparent)` },

  feedItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    paddingBlock: 11,
    paddingInline: 18,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  feedItemLast: { borderBottomWidth: 0 },
  feedText: {
    flexGrow: 1,
    fontSize: 13,
    lineHeight: 1.45,
    color: t.muted,
    minWidth: 0,
  },
  feedWho: { fontWeight: 600, color: t.text },
  feedTarget: {
    fontFamily: size.mono,
    fontSize: 12,
    paddingBlock: 1,
    paddingInline: 5,
    borderRadius: 4,
    backgroundColor: t.surface2,
    color: t.text,
  },
  feedWhen: { fontSize: 11.5, color: t.faint, whiteSpace: "nowrap", flexShrink: 0 },

  insightGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      [NARROW]: "minmax(0, 1fr)",
    },
    gap: 14,
  },
  insightIcon: {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    marginBottom: 11,
    borderRadius: size.rSm,
    backgroundColor: t.accentSoft,
    color: t.accent,
    fontSize: 14,
  },
  insightTitle: { fontSize: 14, fontWeight: 600, marginBottom: 5 },
  insightBody: { fontSize: 13, lineHeight: 1.5, color: t.muted, marginBottom: 11 },
});
