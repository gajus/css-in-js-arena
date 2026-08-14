import { css, cva } from "styled-system/css";

import { pipelineTracks, regions, runLog, runStateLabels } from "../data";
import { card, cardHead, cardNote, cardTitle, pageHead, pageSub, pageTitle, sectionNote, sectionTitle, stack } from "../ui";

export function meta() {
  return [{ title: "Lab · Nimbus" }];
}

/* -----------------------------------------------------------------------------
 * 1. Structural and relational selectors
 *
 * One class on the table. Zebra striping, the divider rule and the follow-on
 * tint below a failed run are all expressed as selectors, so nothing about row
 * position has to be computed in javascript and no class varies per row.
 * -----------------------------------------------------------------------------*/

const runTable = css({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",

  "& th": {
    textAlign: "left",
    paddingBlock: "9px",
    paddingInline: "12px",
    fontSize: "11.5px",
    fontWeight: 600,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: "faint",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  },

  "& td": {
    paddingBlock: "10px",
    paddingInline: "12px",
    color: "text",
  },

  "& tbody tr:nth-child(even)": { bg: "surface2" },

  "& tbody tr:not(:last-child) td": {
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  },

  // `~` not `+`: StyleX's relational API has no next-sibling form, so the
  // general-sibling combinator is the strongest relation all three can express.
  "& tbody tr[data-state='failed'] ~ tr": {
    boxShadow: "inset 3px 0 0 token(colors.dangerBorder)",
  },

  // Matches `th` as well as `td`, so the numeric headers align with their
  // columns. StyleX has to opt each cell in by hand, which is why this is not
  // scoped to `td`.
  "& [data-numeric='true']": {
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    color: "muted",
  },

  "& tbody tr:hover td": { bg: "surface3" },
});

const runState = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    paddingBlock: "2px",
    paddingInline: "8px",
    rounded: "full",
    fontSize: "11.5px",
    fontWeight: 600,
  },
  variants: {
    tone: {
      passed: { bg: "successSoft", color: "success" },
      failed: { bg: "dangerSoft", color: "danger" },
      running: { bg: "accentSoft", color: "accent" },
      queued: { bg: "surface3", color: "muted" },
    },
  },
  defaultVariants: { tone: "queued" },
});

/* -----------------------------------------------------------------------------
 * 2. Motion
 * -----------------------------------------------------------------------------*/

const motionRow = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "22px",
  paddingBlock: "18px",
  paddingInline: "18px",
});

const motionItem = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  fontSize: "11.5px",
  color: "muted",
});

const spinner = css({
  width: "22px",
  height: "22px",
  rounded: "full",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "border",
  borderTopColor: "accent",
  animation: "spin 0.8s linear infinite",
});

const pulseDot = css({
  width: "12px",
  height: "12px",
  rounded: "full",
  bg: "success",
  animation: "pulse 1.4s ease-in-out infinite",
});

const sweepRing = css({
  width: "24px",
  height: "24px",
  rounded: "full",
  background: "conic-gradient(from 0deg, token(colors.accent), transparent 70%)",
  animation: "sweep 1.6s linear infinite",
});

const trackList = css({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  paddingBlock: "4px 18px",
  paddingInline: "18px",
});

const trackRow = css({ display: "flex", alignItems: "center", gap: "12px", fontSize: "12.5px" });
const trackLabel = css({ width: "78px", color: "muted" });

const trackBar = css({
  position: "relative",
  flex: "1",
  height: "8px",
  rounded: "full",
  bg: "surface3",
  overflow: "hidden",
});

const trackFill = css({
  height: "100%",
  rounded: "full",
  backgroundImage:
    "linear-gradient(90deg, token(colors.accent), token(colors.barSecondary), token(colors.accent))",
  backgroundSize: "200% 100%",
  animation: "shimmer 2.2s linear infinite",
});

/* -----------------------------------------------------------------------------
 * 3. Container queries
 *
 * Each card is its own container, so the layout answers the card's width rather
 * than the viewport's — the same card reflows differently in the wide column and
 * the narrow one.
 * -----------------------------------------------------------------------------*/

const regionGrid = css({
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "14px",
  padding: "18px",
  _tablet: { gridTemplateColumns: "1fr" },
});

const regionCard = css({
  containerType: "inline-size",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  rounded: "md",
  bg: "surface2",
  padding: "14px",
});

const regionInner = css({
  display: "flex",
  flexDirection: "column",
  gap: "10px",

  "@container (min-width: 340px)": {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

const regionName = css({ fontSize: "13.5px", fontWeight: 600 });

const regionStats = css({
  display: "flex",
  gap: "14px",

  "@container (min-width: 340px)": { gap: "22px" },
});

const regionStat = css({ display: "flex", flexDirection: "column", gap: "2px" });
const regionStatValue = css({ fontSize: "14px", fontWeight: 600, fontVariantNumeric: "tabular-nums" });
const regionStatLabel = css({ fontSize: "11px", color: "faint" });

export default function Lab() {
  return (
    <>
      <div className={pageHead}>
        <div>
          <h1 className={pageTitle}>Lab</h1>
          <p className={pageSub}>
            The surfaces the rest of the console does not exercise — structural selectors, keyframe
            motion and container queries — held to the same pixels in every engine.
          </p>
        </div>
      </div>

      <div className={stack}>
        <section>
          <h2 className={sectionTitle}>Run log</h2>
          <p className={sectionNote}>
            Zebra striping, dividers and the tint below a failed run are selectors, not per-row
            classes.
          </p>
          <div className={card}>
            <div className={cardHead}>
              <div>
                <div className={cardTitle}>Recent runs</div>
                <div className={cardNote}>Last 8 across every region</div>
              </div>
            </div>
            <table className={runTable}>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Job</th>
                  <th>Step</th>
                  <th>State</th>
                  <th data-numeric="true">Queue</th>
                  <th data-numeric="true">Duration</th>
                </tr>
              </thead>
              <tbody>
                {runLog.map((run) => (
                  <tr key={run.id} data-state={run.state}>
                    <td>{run.id}</td>
                    <td>{run.job}</td>
                    <td>{run.step}</td>
                    <td>
                      <span className={runState({ tone: run.state as "passed" })}>
                        {runStateLabels[run.state]}
                      </span>
                    </td>
                    <td data-numeric="true">{run.queue}</td>
                    <td data-numeric="true">{run.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className={sectionTitle}>Motion</h2>
          <p className={sectionNote}>
            Keyframes owned by the engine, including one that animates a registered custom property.
          </p>
          <div className={card}>
            <div className={motionRow}>
              <div className={motionItem}>
                <div className={spinner} />
                <span>Spinner</span>
              </div>
              <div className={motionItem}>
                <div className={pulseDot} />
                <span>Heartbeat</span>
              </div>
              <div className={motionItem}>
                <div className={sweepRing} />
                <span>Sweep</span>
              </div>
            </div>
            <div className={trackList}>
              {pipelineTracks.map((track) => (
                <div key={track.label} className={trackRow}>
                  <span className={trackLabel}>{track.label}</span>
                  <span className={trackBar}>
                    <span className={trackFill} style={{ width: `${track.pct}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className={sectionTitle}>Capacity</h2>
          <p className={sectionNote}>
            Each card is a query container, so the same card reflows on its own width rather than the
            viewport's.
          </p>
          <div className={card}>
            <div className={regionGrid}>
              {regions.map((region) => (
                <article key={region.name} className={regionCard}>
                  <div className={regionInner}>
                    <div className={regionName}>{region.name}</div>
                    <div className={regionStats}>
                      <div className={regionStat}>
                        <span className={regionStatValue}>{region.cpu}%</span>
                        <span className={regionStatLabel}>CPU</span>
                      </div>
                      <div className={regionStat}>
                        <span className={regionStatValue}>{region.mem}%</span>
                        <span className={regionStatLabel}>Memory</span>
                      </div>
                      <div className={regionStat}>
                        <span className={regionStatValue}>
                          {region.pods}/{region.cap}
                        </span>
                        <span className={regionStatLabel}>Pods</span>
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
