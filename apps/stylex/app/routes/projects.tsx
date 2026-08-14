import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { projects, statusLabels } from "../data";
import { DotsIcon, PlusIcon, SearchIcon } from "../icons";
import { size, t } from "../tokens.stylex";
import { badgeFor, ui } from "../ui";

const views = ["Table", "Board"];

export function meta() {
  return [{ title: "Projects · Nimbus" }];
}

export default function Projects() {
  const [view, setView] = useState("Table");

  return (
    <>
      <div {...stylex.props(ui.pageHead)}>
        <div>
          <h1 {...stylex.props(ui.pageTitle)}>Projects</h1>
          <p {...stylex.props(ui.pageSub)}>
            Every deployable service in the Nimbus org, with its current rollout state and
            quarter-to-date spend.
          </p>
        </div>
        <div {...stylex.props(ui.pageActions)}>
          <button type="button" {...stylex.props(ui.btn, ui.btnSecondary)}>
            Import
          </button>
          <button type="button" {...stylex.props(ui.btn, ui.btnPrimary)}>
            <PlusIcon />
            New project
          </button>
        </div>
      </div>

      <div {...stylex.props(s.toolbar)}>
        <div {...stylex.props(s.searchWrap, ui.fieldGrow)}>
          <span {...stylex.props(s.searchIcon)}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Filter by name or repository…"
            aria-label="Filter projects"
            {...stylex.props(ui.field, s.fieldSearch)}
          />
        </div>
        <select aria-label="Status filter" defaultValue="all" {...stylex.props(ui.field, ui.selectField)}>
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="staging">Staging</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        <select aria-label="Owner filter" defaultValue="any" {...stylex.props(ui.field, ui.selectField)}>
          <option value="any">Any owner</option>
          <option value="me">Owned by me</option>
        </select>
        <div {...stylex.props(ui.segmented)}>
          {views.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              {...stylex.props(ui.segBtn, view === v && ui.segBtnOn)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div {...stylex.props(s.tableWrap)}>
        <table {...stylex.props(s.table)}>
          <thead>
            <tr>
              <th scope="col" {...stylex.props(s.th, s.colTight)}>
                <input type="checkbox" aria-label="Select all projects" {...stylex.props(s.check)} />
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Project
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Owner
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Status
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Rollout
              </th>
              <th scope="col" {...stylex.props(s.th, s.colNum)}>
                QTD spend
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Updated
              </th>
              <th scope="col" {...stylex.props(s.th, s.colTight)}>
                <span {...stylex.props(s.srOnly)}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => {
              const last = i === projects.length - 1;
              return (
                <tr key={project.repo} {...stylex.props(s.tr)}>
                  <td {...stylex.props(s.td, last && s.tdLast, s.colTight)}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${project.name}`}
                      {...stylex.props(s.check)}
                    />
                  </td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>
                    <div {...stylex.props(s.cellName)}>{project.name}</div>
                    <div {...stylex.props(s.cellRepo)}>{project.repo}</div>
                  </td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>
                    <span {...stylex.props(s.owner)}>
                      <span aria-hidden="true" {...stylex.props(ui.avatar, ui.avatarSm)}>
                        {project.initials}
                      </span>
                      {project.owner}
                    </span>
                  </td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>
                    <span {...stylex.props(ui.badge, badgeFor[project.status])}>
                      <span {...stylex.props(ui.badgeDot)} />
                      {statusLabels[project.status]}
                    </span>
                  </td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>
                    <span {...stylex.props(s.progress)}>
                      <span {...stylex.props(s.progressTrack)}>
                        <span {...stylex.props(s.progressFill, dyn.width(project.progress))} />
                      </span>
                      <span {...stylex.props(s.progressNum)}>{project.progress}%</span>
                    </span>
                  </td>
                  <td {...stylex.props(s.td, last && s.tdLast, s.colNum)}>{project.budget}</td>
                  <td {...stylex.props(s.td, last && s.tdLast)}>{project.updated}</td>
                  <td {...stylex.props(s.td, last && s.tdLast, s.colTight)}>
                    <button
                      type="button"
                      aria-label={`Actions for ${project.name}`}
                      {...stylex.props(s.iconBtn)}
                    >
                      <DotsIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div {...stylex.props(s.tableFoot)}>
          <span>Showing 8 of 34 projects</span>
          <ul {...stylex.props(s.pager)}>
            <li>
              <button type="button" {...stylex.props(s.pageBtn)}>
                Prev
              </button>
            </li>
            <li>
              <button type="button" aria-current="page" {...stylex.props(s.pageBtn, s.pageBtnOn)}>
                1
              </button>
            </li>
            <li>
              <button type="button" {...stylex.props(s.pageBtn)}>
                2
              </button>
            </li>
            <li>
              <button type="button" {...stylex.props(s.pageBtn)}>
                3
              </button>
            </li>
            <li>
              <button type="button" {...stylex.props(s.pageBtn)}>
                Next
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

// Dynamic styles: the only place StyleX emits an inline custom property.
const dyn = stylex.create({
  width: (pct: number) => ({ width: `${pct}%` }),
});

const s = stylex.create({
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  searchWrap: { position: "relative", display: "flex" },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: t.faint,
    pointerEvents: "none",
    lineHeight: 0,
  },
  fieldSearch: { paddingLeft: 31, width: "100%" },

  tableWrap: {
    overflowX: "auto",
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rLg,
    boxShadow: t.shSm,
  },
  table: {
    width: "100%",
    minWidth: 860,
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    paddingBlock: 10,
    paddingInline: 14,
    backgroundColor: t.surface2,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    fontSize: 11.5,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: t.muted,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
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
    verticalAlign: "middle",
  },
  tdLast: { borderBottomWidth: 0 },
  colNum: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
  colTight: { width: "1%", whiteSpace: "nowrap" },
  check: { accentColor: t.accent, cursor: "pointer" },
  cellName: { fontWeight: 600 },
  cellRepo: { fontFamily: size.mono, fontSize: 11.5, color: t.faint, marginTop: 2 },
  owner: { display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" },

  progress: { display: "flex", alignItems: "center", gap: 9, minWidth: 130 },
  progressTrack: {
    flexGrow: 1,
    height: 5,
    borderRadius: size.rFull,
    backgroundColor: t.surface3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: size.rFull, backgroundColor: t.accent },
  progressNum: {
    fontSize: 11.5,
    color: t.muted,
    fontVariantNumeric: "tabular-nums",
    width: 30,
    textAlign: "right",
  },

  iconBtn: {
    display: "grid",
    placeItems: "center",
    width: 32,
    height: 32,
    padding: 0,
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rSm,
    color: { default: t.muted, ":hover": t.text },
    cursor: "pointer",
    outlineColor: t.accent,
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },

  tableFoot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    paddingBlock: 11,
    paddingInline: 14,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: t.border,
    fontSize: 12.5,
    color: t.muted,
  },
  pager: { display: "flex", gap: 4 },
  pageBtn: {
    minWidth: 28,
    height: 28,
    paddingInline: 8,
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rSm,
    fontSize: 12.5,
    color: { default: t.muted, ":hover": t.text },
    cursor: "pointer",
    outlineColor: t.accent,
  },
  pageBtnOn: {
    backgroundColor: { default: t.accent, ":hover": t.accent },
    borderColor: t.accent,
    color: { default: t.accentContrast, ":hover": t.accentContrast },
    fontWeight: 600,
  },

  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});
