import { useState } from "react";
import { css, cx } from "styled-system/css";

import { projects, statusLabels } from "../data";
import { DotsIcon, PlusIcon, SearchIcon } from "../icons";
import {
  avatar,
  badge,
  badgeDot,
  button,
  field,
  fieldGrow,
  iconButton,
  pageActions,
  pageBtn,
  pageHead,
  pageSub,
  pageTitle,
  segButton,
  segmented,
} from "../ui";

const views = ["Table", "Board"];

export function meta() {
  return [{ title: "Projects · Nimbus" }];
}

export default function Projects() {
  const [view, setView] = useState("Table");

  return (
    <>
      <div className={pageHead}>
        <div>
          <h1 className={pageTitle}>Projects</h1>
          <p className={pageSub}>
            Every deployable service in the Nimbus org, with its current rollout state and
            quarter-to-date spend.
          </p>
        </div>
        <div className={pageActions}>
          <button type="button" className={button({ tone: "secondary" })}>
            Import
          </button>
          <button type="button" className={button({ tone: "primary" })}>
            <PlusIcon />
            New project
          </button>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={cx(s.searchWrap, fieldGrow)}>
          <span className={s.searchIcon}>
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Filter by name or repository…"
            aria-label="Filter projects"
            className={cx(field, s.fieldSearch)}
          />
        </div>
        <select aria-label="Status filter" defaultValue="all" className={cx(field, s.select)}>
          <option value="all">All statuses</option>
          <option value="live">Live</option>
          <option value="staging">Staging</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        <select aria-label="Owner filter" defaultValue="any" className={cx(field, s.select)}>
          <option value="any">Any owner</option>
          <option value="me">Owned by me</option>
        </select>
        <div className={segmented}>
          {views.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={segButton({ active: view === v })}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={cx(s.th, s.colTight)}>
                <input type="checkbox" aria-label="Select all projects" className={s.check} />
              </th>
              <th scope="col" className={s.th}>
                Project
              </th>
              <th scope="col" className={s.th}>
                Owner
              </th>
              <th scope="col" className={s.th}>
                Status
              </th>
              <th scope="col" className={s.th}>
                Rollout
              </th>
              <th scope="col" className={cx(s.th, s.colNum)}>
                QTD spend
              </th>
              <th scope="col" className={s.th}>
                Updated
              </th>
              <th scope="col" className={cx(s.th, s.colTight)}>
                <span className={s.srOnly}>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => {
              const last = i === projects.length - 1;
              return (
                <tr key={project.repo} className={s.tr}>
                  <td className={cx(s.td, last && s.tdLast, s.colTight)}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${project.name}`}
                      className={s.check}
                    />
                  </td>
                  <td className={cx(s.td, last && s.tdLast)}>
                    <div className={s.cellName}>{project.name}</div>
                    <div className={s.cellRepo}>{project.repo}</div>
                  </td>
                  <td className={cx(s.td, last && s.tdLast)}>
                    <span className={s.owner}>
                      <span aria-hidden="true" className={avatar({ size: "sm" })}>
                        {project.initials}
                      </span>
                      {project.owner}
                    </span>
                  </td>
                  <td className={cx(s.td, last && s.tdLast)}>
                    <span className={badge({ status: project.status })}>
                      <span className={badgeDot} />
                      {statusLabels[project.status]}
                    </span>
                  </td>
                  <td className={cx(s.td, last && s.tdLast)}>
                    <span className={s.progress}>
                      <span className={s.progressTrack}>
                        <span
                          className={s.progressFill}
                          style={{ width: `${project.progress}%` }}
                        />
                      </span>
                      <span className={s.progressNum}>{project.progress}%</span>
                    </span>
                  </td>
                  <td className={cx(s.td, last && s.tdLast, s.colNum)}>{project.budget}</td>
                  <td className={cx(s.td, last && s.tdLast)}>{project.updated}</td>
                  <td className={cx(s.td, last && s.tdLast, s.colTight)}>
                    <button
                      type="button"
                      aria-label={`Actions for ${project.name}`}
                      className={iconButton}
                    >
                      <DotsIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={s.tableFoot}>
          <span>Showing 8 of 34 projects</span>
          <ul className={s.pager}>
            <li>
              <button type="button" className={pageBtn()}>
                Prev
              </button>
            </li>
            <li>
              <button type="button" aria-current="page" className={pageBtn({ current: true })}>
                1
              </button>
            </li>
            <li>
              <button type="button" className={pageBtn()}>
                2
              </button>
            </li>
            <li>
              <button type="button" className={pageBtn()}>
                3
              </button>
            </li>
            <li>
              <button type="button" className={pageBtn()}>
                Next
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

const s = {
  toolbar: css({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "14px",
  }),
  searchWrap: css({ position: "relative", display: "flex" }),
  searchIcon: css({
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "faint",
    pointerEvents: "none",
    lineHeight: 0,
  }),
  fieldSearch: css({ paddingLeft: "31px", width: "100%" }),
  select: css({ appearance: "none", paddingRight: "24px" }),

  tableWrap: css({
    overflowX: "auto",
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "lg",
    boxShadow: "sm",
  }),
  table: css({
    width: "100%",
    minWidth: "860px",
    borderCollapse: "separate",
    borderSpacing: 0,
  }),
  th: css({
    paddingBlock: "10px",
    paddingInline: "14px",
    bg: "surface2",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
    fontSize: "11.5px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "muted",
    textAlign: "left",
    whiteSpace: "nowrap",
  }),
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
    verticalAlign: "middle",
  }),
  tdLast: css({ borderBottomWidth: "0" }),
  colNum: css({ textAlign: "right", fontVariantNumeric: "tabular-nums" }),
  colTight: css({ width: "1%", whiteSpace: "nowrap" }),
  check: css({ accentColor: "accent", cursor: "pointer" }),
  cellName: css({ fontWeight: 600 }),
  cellRepo: css({ fontFamily: "mono", fontSize: "11.5px", color: "faint", marginTop: "2px" }),
  owner: css({ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }),

  progress: css({ display: "flex", alignItems: "center", gap: "9px", minWidth: "130px" }),
  progressTrack: css({
    flexGrow: 1,
    height: "5px",
    rounded: "full",
    bg: "surface3",
    overflow: "hidden",
  }),
  progressFill: css({ height: "100%", rounded: "full", bg: "accent" }),
  progressNum: css({
    fontSize: "11.5px",
    color: "muted",
    fontVariantNumeric: "tabular-nums",
    width: "30px",
    textAlign: "right",
  }),

  tableFoot: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    paddingBlock: "11px",
    paddingInline: "14px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border",
    fontSize: "12.5px",
    color: "muted",
  }),
  pager: css({ display: "flex", gap: "4px" }),

  srOnly: css({
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  }),
};
