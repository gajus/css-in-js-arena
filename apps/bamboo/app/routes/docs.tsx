import { css, cx } from "styled-system/css";

import { docsNav, toc } from "../data";
import { ChevronIcon } from "../icons";

const snippet = `# authenticate once per machine
npx nimbus login --sso

# link the working directory to a project
npx nimbus link --project checkout-v3

# build locally with the production toolchain
npx nimbus build --target=edge`;

export function meta() {
  return [{ title: "Your first deploy · Nimbus Docs" }];
}

export default function Docs() {
  return (
    <div className={s.docsGrid}>
      <nav aria-label="Documentation" className={s.docsNav}>
        {docsNav.map((group) => (
          <div key={group.section}>
            <div className={s.sectionLabel}>{group.section}</div>
            <ul>
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href="/docs"
                    aria-current={item.active ? "page" : undefined}
                    className={cx(s.navItem, item.active && s.navItemOn)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* One `prose` class styles every descendant. Bamboo compiles nested
          selectors, so the article's own markup carries no classes at all. */}
      <article className={s.prose}>
        <div className={s.crumbs}>
          <span>Docs</span>
          <ChevronIcon />
          <span>Getting started</span>
          <ChevronIcon />
          <span>Your first deploy</span>
        </div>

        <h1>Your first deploy</h1>
        <p>
          This guide takes a repository from zero to a production URL in about five minutes. You
          will need an organisation with at least one seat and local access to the repository you
          want to deploy.
        </p>

        <h2>Before you begin</h2>
        <p>
          Nimbus builds run in ephemeral containers that mirror your production runtime. Make sure
          your project builds cleanly with <code>npm ci &amp;&amp; npm run build</code> before you
          start — the platform will not install undeclared system packages for you.
        </p>
        <ul>
          <li>Node.js 20 or newer, or a container image you control.</li>
          <li>A lockfile committed to the repository.</li>
          <li>
            Owner or admin role in the target workspace. See <a href="/settings">Settings</a>.
          </li>
        </ul>

        <div className={cx(s.callout, s.calloutInfo)}>
          <span aria-hidden="true" className={cx(s.calloutIcon, s.calloutIconInfo)}>
            ◈
          </span>
          <div>
            <div className={s.calloutTitle}>Trial workspaces</div>
            <p className={s.calloutText}>
              Deploys from a trial workspace are capped at 2 concurrent builds and are torn down
              after 14 days of inactivity.
            </p>
          </div>
        </div>

        <h2>Authenticate the CLI</h2>
        <p>
          The CLI stores a scoped refresh token in your system keychain. Tokens are bound to a
          single organisation and can be revoked from the security settings page at any time.
        </p>

        <div className={s.codeBlock}>
          <div className={s.codeHead}>
            <span>terminal</span>
            <span>bash</span>
          </div>
          <pre className={s.pre}>
            <code>{snippet}</code>
          </pre>
        </div>

        <h2>Link a repository</h2>
        <p>
          Linking writes a <code>nimbus.json</code> file to the repository root. Commit it — the
          build pipeline reads the project ID from this file rather than from CLI state, so CI runs
          and local runs resolve to the same project.
        </p>

        <h3>Choosing a region</h3>
        <p>
          Pick the region closest to your primary datastore, not your users. Edge routing already
          terminates requests near the user; what matters for cold-start latency is the round trip
          from the build region to your database.
        </p>

        <table>
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Location</th>
              <th scope="col">Cold start</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["us-east-1", "N. Virginia", "~120 ms"],
              ["eu-west-2", "London", "~140 ms"],
              ["ap-south-1", "Mumbai", "~180 ms"],
            ].map(([region, location, cold]) => (
              <tr key={region}>
                <td>{region}</td>
                <td>{location}</td>
                <td>{cold}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={cx(s.callout, s.calloutWarn)}>
          <span aria-hidden="true" className={cx(s.calloutIcon, s.calloutIconWarn)}>
            ▲
          </span>
          <div>
            <div className={s.calloutTitle}>Region changes rebuild everything</div>
            <p className={s.calloutText}>
              Moving a linked project to a new region invalidates the build cache and re-issues TLS
              certificates. Expect the first deploy after a move to take 3–4× longer.
            </p>
          </div>
        </div>

        <h2>Configure the build</h2>
        <p>
          Most projects need no configuration. If autodetection picks the wrong framework, set it
          explicitly and Nimbus will skip detection entirely.
        </p>
        <ol>
          <li>
            Open <strong>Project → Build</strong> in the console.
          </li>
          <li>Set the framework preset, or choose “Other” to supply raw commands.</li>
          <li>Add environment variables scoped to preview, staging or production.</li>
          <li>Save. The next push triggers a build with the new settings.</li>
        </ol>

        <h2>Promote to production</h2>
        <p>
          Every push produces an immutable deployment with its own URL. Promotion is a pointer swap
          — it never rebuilds — so rolling back is instantaneous and always safe.
        </p>
        <blockquote>
          Promotion changes which deployment the production domain resolves to. It does not change
          the deployment itself.
        </blockquote>

        <div className={s.docsFoot}>
          <a href="/docs" className={s.footLink}>
            <div className={s.footDir}>Previous</div>
            <div className={s.footLabel}>Installation</div>
          </a>
          <a href="/docs" className={cx(s.footLink, s.footLinkNext)}>
            <div className={s.footDir}>Next</div>
            <div className={s.footLabel}>CLI reference</div>
          </a>
        </div>
      </article>

      <aside aria-label="On this page" className={s.docsToc}>
        <div className={s.sectionLabel}>On this page</div>
        <ul>
          {toc.map((item) => (
            <li key={item.label}>
              <a href="/docs" className={cx(s.tocLink, item.depth > 0 && s.tocDeep)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

const s = {
  docsGrid: css({
    display: "grid",
    gridTemplateColumns: {
      base: "200px minmax(0, 1fr) 180px",
      _wide: "190px minmax(0, 1fr)",
      _stack: "minmax(0, 1fr)",
    },
    gap: { base: "34px", _stack: "20px" },
    alignItems: "start",
  }),
  docsNav: css({
    position: { base: "sticky", _stack: "static" },
    top: "navOffset",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  }),
  sectionLabel: css({
    fontSize: "11px",
    fontWeight: 650,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "faint",
    marginBottom: "6px",
  }),
  navItem: css({
    display: "block",
    paddingBlock: "5px",
    paddingInline: "10px",
    borderLeftWidth: "2px",
    borderLeftStyle: "solid",
    borderLeftColor: "transparent",
    fontSize: "13px",
    color: { base: "muted", _hover: "text" },
    transitionProperty: "color, border-color",
    transitionDuration: "0.15s",
  }),
  navItemOn: css({
    borderLeftColor: "accent",
    color: { base: "accent", _hover: "accent" },
    fontWeight: 600,
  }),
  docsToc: css({
    position: "sticky",
    top: "navOffset",
    display: { base: "block", _wide: "none" },
  }),
  tocLink: css({
    display: "block",
    paddingBlock: "4px",
    fontSize: "12.5px",
    color: { base: "muted", _hover: "accent" },
    transitionProperty: "color",
    transitionDuration: "0.15s",
  }),
  tocDeep: css({ paddingLeft: "12px" }),

  crumbs: css({
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "12px",
    fontSize: "12.5px",
    color: "faint",
  }),

  // A single nested block covers the whole article. Block elements are matched
  // as direct children and inline elements only inside prose text, so the
  // callout, code block and prev/next cards nested in here keep their own
  // styling — a bare `& p` / `& a` would outrank their classes, since nesting
  // puts both rules in the same layer and specificity decides.
  prose: css({
    maxWidth: "72ch",
    "& > h1": {
      fontSize: "28px",
      fontWeight: 600,
      letterSpacing: "-0.025em",
      marginBottom: "10px",
    },
    "& > h2": {
      fontSize: "19px",
      fontWeight: 600,
      marginTop: "30px",
      marginBottom: "10px",
      paddingTop: "4px",
    },
    "& > h3": { fontSize: "15.5px", fontWeight: 600, marginTop: "22px", marginBottom: "8px" },
    "& > p": { fontSize: "14.5px", lineHeight: 1.68, color: "muted", marginBottom: "14px" },
    "& > p:first-of-type": { fontSize: "16px", color: "text" },
    "& strong": { color: "text", fontWeight: 600 },
    "& :is(p, li) a": {
      color: "accent",
      textDecorationLine: "underline",
      textUnderlineOffset: "2px",
    },
    "& > ul, & > ol": {
      marginBottom: "14px",
      paddingLeft: "20px",
      fontSize: "14.5px",
      lineHeight: 1.68,
      color: "muted",
    },
    "& > ul": { listStyleType: "disc" },
    "& > ol": { listStyleType: "decimal" },
    "& > :is(ul, ol) > li": { marginBottom: "5px" },
    "& > :is(ul, ol) > li::marker": { color: "faint" },
    "& :is(p, li) code": {
      paddingBlock: "2px",
      paddingInline: "5px",
      rounded: "4px",
      bg: "surface2",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border",
      fontSize: "12.5px",
      fontFamily: "mono",
      color: "text",
    },
    "& > table": { marginBottom: "16px", fontSize: "13.5px", width: "100%" },
    "& > table th": {
      paddingBlock: "9px",
      paddingInline: "12px",
      bg: "surface2",
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: "border",
      fontSize: "12px",
      fontWeight: 600,
      textAlign: "left",
    },
    "& > table td": {
      paddingBlock: "9px",
      paddingInline: "12px",
      borderBottomWidth: "1px",
      borderBottomStyle: "solid",
      borderBottomColor: "border",
      color: "muted",
    },
    "& > table td:first-child": { color: "text", fontWeight: 550 },
    "& > blockquote": {
      marginBottom: "16px",
      paddingBlock: "10px",
      paddingLeft: "16px",
      borderLeftWidth: "3px",
      borderLeftStyle: "solid",
      borderLeftColor: "borderStrong",
      fontSize: "14.5px",
      lineHeight: 1.65,
      color: "muted",
      fontStyle: "italic",
    },
  }),

  callout: css({
    display: "flex",
    gap: "11px",
    paddingBlock: "13px",
    paddingInline: "15px",
    marginBottom: "16px",
    rounded: "md",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "13.5px",
    lineHeight: 1.6,
  }),
  calloutInfo: css({ bg: "accentSoft", borderColor: "accentBorder" }),
  calloutWarn: css({ bg: "warningSoft", borderColor: "warningBorder" }),
  calloutIcon: css({ flexShrink: 0, fontSize: "14px", lineHeight: 1.45 }),
  calloutIconInfo: css({ color: "accent" }),
  calloutIconWarn: css({ color: "warning" }),
  calloutTitle: css({ fontWeight: 650, marginBottom: "2px" }),
  calloutText: css({ fontSize: "13.5px", lineHeight: 1.6 }),

  codeBlock: css({
    marginBottom: "16px",
    bg: "surface2",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "md",
    overflow: "hidden",
  }),
  codeHead: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: "8px",
    paddingInline: "13px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
    fontSize: "11.5px",
    fontFamily: "mono",
    color: "faint",
  }),
  pre: css({
    padding: "13px",
    fontSize: "12.5px",
    fontFamily: "mono",
    lineHeight: 1.62,
    overflowX: "auto",
    whiteSpace: "pre",
  }),

  docsFoot: css({
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    marginTop: "34px",
    paddingTop: "18px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border",
  }),
  footLink: css({
    display: "block",
    paddingBlock: "11px",
    paddingInline: "14px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: "border", _hover: "accent" },
    rounded: "md",
    minWidth: "170px",
    color: "inherit",
    textDecorationLine: "none",
    transitionProperty: "border-color",
    transitionDuration: "0.15s",
  }),
  footLinkNext: css({ textAlign: "right" }),
  footDir: css({ fontSize: "11.5px", color: "faint", marginBottom: "2px" }),
  footLabel: css({ fontSize: "13.5px", fontWeight: 600 }),
};
