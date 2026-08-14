import * as stylex from "@stylexjs/stylex";

import { pipelineTracks, regions, runLog, runStateLabels } from "../data";
import { size, t } from "../tokens.stylex";
import { ui } from "../ui";

export function meta() {
  return [{ title: "Lab · Nimbus" }];
}

/* -----------------------------------------------------------------------------
 * 1. Structural and relational selectors
 *
 * StyleX styles the element it is applied to and nothing below it, so the single
 * `runTable` rule the other two apps write becomes a class on every `th`, `td`
 * and `tr`. Own-element pseudo-classes still work — `:nth-child(even)` is a fact
 * about the row itself — but "a td whose row is not the last row" is not, so
 * `lastRow` is computed in javascript and threaded down. That is the cost this
 * page exists to make visible.
 * -----------------------------------------------------------------------------*/

const s = stylex.create({
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    paddingBlock: "9px",
    paddingInline: "12px",
    fontSize: "11.5px",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: t.faint,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  tr: {
    // Own-element pseudo-class: the row knows its own position.
    backgroundColor: {
      default: null,
      ":nth-child(even)": t.surface2,
    },
  },
  // Relational: a row that follows a failed row. `when.siblingAfter` is the one
  // relational selector StyleX can express without help from javascript.
  trAfterFailed: {
    boxShadow: {
      default: null,
      [stylex.when.siblingBefore('[data-state="failed"]')]: `inset 3px 0 0 color-mix(in srgb, ${t.danger} 40%, transparent)`,
    },
  },
  td: {
    paddingBlock: "10px",
    paddingInline: "12px",
    color: t.text,
    backgroundColor: { default: null, ":hover": null },
  },
  tdDivider: {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  tdNumeric: {
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    color: t.muted,
  },
  state: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    paddingBlock: "2px",
    paddingInline: "8px",
    borderRadius: size.rFull,
    fontSize: "11.5px",
    fontWeight: 600,
  },
  statePassed: { backgroundColor: t.successSoft, color: t.success },
  stateFailed: { backgroundColor: t.dangerSoft, color: t.danger },
  stateRunning: { backgroundColor: t.accentSoft, color: t.accent },
  stateQueued: { backgroundColor: t.surface3, color: t.muted },
});

const stateStyle = {
  passed: s.statePassed,
  failed: s.stateFailed,
  running: s.stateRunning,
  queued: s.stateQueued,
} as const;

/* -----------------------------------------------------------------------------
 * 2. Motion
 * -----------------------------------------------------------------------------*/

const spin = stylex.keyframes({ to: { transform: "rotate(360deg)" } });
const pulse = stylex.keyframes({
  "0%, 100%": { opacity: 1, transform: "scale(1)" },
  "50%": { opacity: 0.45, transform: "scale(0.82)" },
});
const shimmer = stylex.keyframes({
  from: { backgroundPosition: "200% 0" },
  to: { backgroundPosition: "-200% 0" },
});
const sweep = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const m = stylex.create({
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "22px",
    paddingBlock: "18px",
    paddingInline: "18px",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    fontSize: "11.5px",
    color: t.muted,
  },
  spinner: {
    width: "22px",
    height: "22px",
    borderRadius: size.rFull,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: t.border,
    borderTopColor: t.accent,
    animationName: spin,
    animationDuration: "0.8s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  pulseDot: {
    width: "12px",
    height: "12px",
    borderRadius: size.rFull,
    backgroundColor: t.success,
    animationName: pulse,
    animationDuration: "1.4s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  sweepRing: {
    width: "24px",
    height: "24px",
    borderRadius: size.rFull,
    background: `conic-gradient(from 0deg, ${t.accent}, transparent 70%)`,
    animationName: sweep,
    animationDuration: "1.6s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
  trackList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "4px",
    paddingBottom: "18px",
    paddingInline: "18px",
  },
  trackRow: { display: "flex", alignItems: "center", gap: "12px", fontSize: "12.5px" },
  trackLabel: { width: "78px", color: t.muted },
  trackBar: {
    position: "relative",
    flex: "1",
    height: "8px",
    borderRadius: size.rFull,
    backgroundColor: t.surface3,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: size.rFull,
    backgroundImage: `linear-gradient(90deg, ${t.accent}, color-mix(in srgb, ${t.accent} 32%, transparent), ${t.accent})`,
    backgroundSize: "200% 100%",
    animationName: shimmer,
    animationDuration: "2.2s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
});

/* -----------------------------------------------------------------------------
 * 3. Container queries
 * -----------------------------------------------------------------------------*/

const TABLET = "@media (max-width: 900px)";
const CQ = "@container (min-width: 340px)";

const c = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "2fr 1fr", [TABLET]: "1fr" },
    gap: "14px",
    padding: "18px",
  },
  card: {
    containerType: "inline-size",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rMd,
    backgroundColor: t.surface2,
    padding: "14px",
  },
  inner: {
    display: "flex",
    flexDirection: { default: "column", [CQ]: "row" },
    alignItems: { default: null, [CQ]: "center" },
    justifyContent: { default: null, [CQ]: "space-between" },
    gap: "10px",
  },
  name: { fontSize: "13.5px", fontWeight: 600 },
  stats: { display: "flex", gap: { default: "14px", [CQ]: "22px" } },
  stat: { display: "flex", flexDirection: "column", gap: "2px" },
  statValue: { fontSize: "14px", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  statLabel: { fontSize: "11px", color: t.faint },
});

export default function Lab() {
  return (
    <>
      <div {...stylex.props(ui.pageHead)}>
        <div>
          <h1 {...stylex.props(ui.pageTitle)}>Lab</h1>
          <p {...stylex.props(ui.pageSub)}>
            The surfaces the rest of the console does not exercise — structural selectors, keyframe
            motion and container queries — held to the same pixels in every engine.
          </p>
        </div>
      </div>

      <div {...stylex.props(ui.stack)}>
        <section>
          <h2 {...stylex.props(ui.sectionTitle)}>Run log</h2>
          <p {...stylex.props(ui.sectionNote)}>
            Zebra striping, dividers and the tint below a failed run are selectors, not per-row
            classes.
          </p>
          <div {...stylex.props(ui.card)}>
            <div {...stylex.props(ui.cardHead)}>
              <div>
                <div {...stylex.props(ui.cardTitle)}>Recent runs</div>
                <div {...stylex.props(ui.cardNote)}>Last 8 across every region</div>
              </div>
            </div>
            <table {...stylex.props(s.table)}>
              <thead>
                <tr>
                  <th {...stylex.props(s.th)}>Run</th>
                  <th {...stylex.props(s.th)}>Job</th>
                  <th {...stylex.props(s.th)}>Step</th>
                  <th {...stylex.props(s.th)}>State</th>
                  <th {...stylex.props(s.th, s.tdNumeric)} data-numeric="true">
                    Queue
                  </th>
                  <th {...stylex.props(s.th, s.tdNumeric)} data-numeric="true">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {runLog.map((run, i) => {
                  const divider = i !== runLog.length - 1;
                  return (
                    <tr
                      key={run.id}
                      data-state={run.state}
                      {...stylex.props(s.tr, s.trAfterFailed, stylex.defaultMarker())}
                    >
                      <td {...stylex.props(s.td, divider && s.tdDivider)}>{run.id}</td>
                      <td {...stylex.props(s.td, divider && s.tdDivider)}>{run.job}</td>
                      <td {...stylex.props(s.td, divider && s.tdDivider)}>{run.step}</td>
                      <td {...stylex.props(s.td, divider && s.tdDivider)}>
                        <span {...stylex.props(s.state, stateStyle[run.state as "passed"])}>
                          {runStateLabels[run.state]}
                        </span>
                      </td>
                      <td
                        {...stylex.props(s.td, divider && s.tdDivider, s.tdNumeric)}
                        data-numeric="true"
                      >
                        {run.queue}
                      </td>
                      <td
                        {...stylex.props(s.td, divider && s.tdDivider, s.tdNumeric)}
                        data-numeric="true"
                      >
                        {run.duration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 {...stylex.props(ui.sectionTitle)}>Motion</h2>
          <p {...stylex.props(ui.sectionNote)}>
            Keyframes owned by the engine, including one that animates a registered custom property.
          </p>
          <div {...stylex.props(ui.card)}>
            <div {...stylex.props(m.row)}>
              <div {...stylex.props(m.item)}>
                <div {...stylex.props(m.spinner)} />
                <span>Spinner</span>
              </div>
              <div {...stylex.props(m.item)}>
                <div {...stylex.props(m.pulseDot)} />
                <span>Heartbeat</span>
              </div>
              <div {...stylex.props(m.item)}>
                <div {...stylex.props(m.sweepRing)} />
                <span>Sweep</span>
              </div>
            </div>
            <div {...stylex.props(m.trackList)}>
              {pipelineTracks.map((track) => (
                <div key={track.label} {...stylex.props(m.trackRow)}>
                  <span {...stylex.props(m.trackLabel)}>{track.label}</span>
                  <span {...stylex.props(m.trackBar)}>
                    <span {...stylex.props(m.trackFill)} style={{ width: `${track.pct}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 {...stylex.props(ui.sectionTitle)}>Capacity</h2>
          <p {...stylex.props(ui.sectionNote)}>
            Each card is a query container, so the same card reflows on its own width rather than the
            viewport's.
          </p>
          <div {...stylex.props(ui.card)}>
            <div {...stylex.props(c.grid)}>
              {regions.map((region) => (
                <article key={region.name} {...stylex.props(c.card)}>
                  <div {...stylex.props(c.inner)}>
                    <div {...stylex.props(c.name)}>{region.name}</div>
                    <div {...stylex.props(c.stats)}>
                      <div {...stylex.props(c.stat)}>
                        <span {...stylex.props(c.statValue)}>{region.cpu}%</span>
                        <span {...stylex.props(c.statLabel)}>CPU</span>
                      </div>
                      <div {...stylex.props(c.stat)}>
                        <span {...stylex.props(c.statValue)}>{region.mem}%</span>
                        <span {...stylex.props(c.statLabel)}>Memory</span>
                      </div>
                      <div {...stylex.props(c.stat)}>
                        <span {...stylex.props(c.statValue)}>
                          {region.pods}/{region.cap}
                        </span>
                        <span {...stylex.props(c.statLabel)}>Pods</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
