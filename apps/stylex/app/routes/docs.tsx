import * as stylex from "@stylexjs/stylex";

import { docsNav, toc } from "../data";
import { ChevronIcon } from "../icons";
import { size, t } from "../tokens.stylex";

const snippet = `# authenticate once per machine
npx nimbus login --sso

# link the working directory to a project
npx nimbus link --project checkout-v3

# build locally with the production toolchain
npx nimbus build --target=edge`;

const TOC_HIDE = "@media (max-width: 1150px)";
const STACK = "@media (max-width: 820px)";

export function meta() {
  return [{ title: "Your first deploy · Nimbus Docs" }];
}

export default function Docs() {
  return (
    <div {...stylex.props(s.docsGrid)}>
      <nav aria-label="Documentation" {...stylex.props(s.docsNav)}>
        {docsNav.map((group) => (
          <div key={group.section}>
            <div {...stylex.props(s.sectionLabel)}>{group.section}</div>
            <ul>
              {group.items.map((item) => (
                <li key={item.label}>
                  <a
                    href="/docs"
                    aria-current={item.active ? "page" : undefined}
                    {...stylex.props(s.navItem, item.active && s.navItemOn)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <article {...stylex.props(s.prose)}>
        <div {...stylex.props(s.crumbs)}>
          <span>Docs</span>
          <ChevronIcon />
          <span>Getting started</span>
          <ChevronIcon />
          <span>Your first deploy</span>
        </div>

        <h1 {...stylex.props(s.h1)}>Your first deploy</h1>
        <p {...stylex.props(s.p, s.lede)}>
          This guide takes a repository from zero to a production URL in about five minutes. You
          will need an organisation with at least one seat and local access to the repository you
          want to deploy.
        </p>

        <h2 {...stylex.props(s.h2)}>Before you begin</h2>
        <p {...stylex.props(s.p)}>
          Nimbus builds run in ephemeral containers that mirror your production runtime. Make sure
          your project builds cleanly with{" "}
          <code {...stylex.props(s.code)}>npm ci &amp;&amp; npm run build</code> before you start —
          the platform will not install undeclared system packages for you.
        </p>
        <ul {...stylex.props(s.list, s.ul)}>
          <li {...stylex.props(s.li)}>Node.js 20 or newer, or a container image you control.</li>
          <li {...stylex.props(s.li)}>A lockfile committed to the repository.</li>
          <li {...stylex.props(s.li)}>
            Owner or admin role in the target workspace. See{" "}
            <a href="/settings" {...stylex.props(s.link)}>
              Settings
            </a>
            .
          </li>
        </ul>

        <div {...stylex.props(s.callout, s.calloutInfo)}>
          <span aria-hidden="true" {...stylex.props(s.calloutIcon, s.calloutIconInfo)}>
            ◈
          </span>
          <div>
            <div {...stylex.props(s.calloutTitle)}>Trial workspaces</div>
            <p {...stylex.props(s.calloutText)}>
              Deploys from a trial workspace are capped at 2 concurrent builds and are torn down
              after 14 days of inactivity.
            </p>
          </div>
        </div>

        <h2 {...stylex.props(s.h2)}>Authenticate the CLI</h2>
        <p {...stylex.props(s.p)}>
          The CLI stores a scoped refresh token in your system keychain. Tokens are bound to a
          single organisation and can be revoked from the security settings page at any time.
        </p>

        <div {...stylex.props(s.codeBlock)}>
          <div {...stylex.props(s.codeHead)}>
            <span>terminal</span>
            <span>bash</span>
          </div>
          <pre {...stylex.props(s.pre)}>
            <code>{snippet}</code>
          </pre>
        </div>

        <h2 {...stylex.props(s.h2)}>Link a repository</h2>
        <p {...stylex.props(s.p)}>
          Linking writes a <code {...stylex.props(s.code)}>nimbus.json</code> file to the
          repository root. Commit it — the build pipeline reads the project ID from this file
          rather than from CLI state, so CI runs and local runs resolve to the same project.
        </p>

        <h3 {...stylex.props(s.h3)}>Choosing a region</h3>
        <p {...stylex.props(s.p)}>
          Pick the region closest to your primary datastore, not your users. Edge routing already
          terminates requests near the user; what matters for cold-start latency is the round trip
          from the build region to your database.
        </p>

        <table {...stylex.props(s.table)}>
          <thead>
            <tr>
              <th scope="col" {...stylex.props(s.th)}>
                Region
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Location
              </th>
              <th scope="col" {...stylex.props(s.th)}>
                Cold start
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["us-east-1", "N. Virginia", "~120 ms"],
              ["eu-west-2", "London", "~140 ms"],
              ["ap-south-1", "Mumbai", "~180 ms"],
            ].map(([region, location, cold]) => (
              <tr key={region}>
                <td {...stylex.props(s.td, s.tdFirst)}>{region}</td>
                <td {...stylex.props(s.td)}>{location}</td>
                <td {...stylex.props(s.td)}>{cold}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div {...stylex.props(s.callout, s.calloutWarn)}>
          <span aria-hidden="true" {...stylex.props(s.calloutIcon, s.calloutIconWarn)}>
            ▲
          </span>
          <div>
            <div {...stylex.props(s.calloutTitle)}>Region changes rebuild everything</div>
            <p {...stylex.props(s.calloutText)}>
              Moving a linked project to a new region invalidates the build cache and re-issues
              TLS certificates. Expect the first deploy after a move to take 3–4× longer.
            </p>
          </div>
        </div>

        <h2 {...stylex.props(s.h2)}>Configure the build</h2>
        <p {...stylex.props(s.p)}>
          Most projects need no configuration. If autodetection picks the wrong framework, set it
          explicitly and Nimbus will skip detection entirely.
        </p>
        <ol {...stylex.props(s.list, s.ol)}>
          <li {...stylex.props(s.li)}>
            Open <strong {...stylex.props(s.strong)}>Project → Build</strong> in the console.
          </li>
          <li {...stylex.props(s.li)}>
            Set the framework preset, or choose “Other” to supply raw commands.
          </li>
          <li {...stylex.props(s.li)}>
            Add environment variables scoped to preview, staging or production.
          </li>
          <li {...stylex.props(s.li)}>Save. The next push triggers a build with the new settings.</li>
        </ol>

        <h2 {...stylex.props(s.h2)}>Promote to production</h2>
        <p {...stylex.props(s.p)}>
          Every push produces an immutable deployment with its own URL. Promotion is a pointer
          swap — it never rebuilds — so rolling back is instantaneous and always safe.
        </p>
        <blockquote {...stylex.props(s.blockquote)}>
          Promotion changes which deployment the production domain resolves to. It does not change
          the deployment itself.
        </blockquote>

        <div {...stylex.props(s.docsFoot)}>
          <a href="/docs" {...stylex.props(s.footLink)}>
            <div {...stylex.props(s.footDir)}>Previous</div>
            <div {...stylex.props(s.footLabel)}>Installation</div>
          </a>
          <a href="/docs" {...stylex.props(s.footLink, s.footLinkNext)}>
            <div {...stylex.props(s.footDir)}>Next</div>
            <div {...stylex.props(s.footLabel)}>CLI reference</div>
          </a>
        </div>
      </article>

      <aside aria-label="On this page" {...stylex.props(s.docsToc)}>
        <div {...stylex.props(s.sectionLabel)}>On this page</div>
        <ul>
          {toc.map((item) => (
            <li key={item.label}>
              <a href="/docs" {...stylex.props(s.tocLink, item.depth > 0 && s.tocDeep)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

const s = stylex.create({
  docsGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "200px minmax(0, 1fr) 180px",
      [TOC_HIDE]: "190px minmax(0, 1fr)",
      [STACK]: "minmax(0, 1fr)",
    },
    gap: { default: 34, [STACK]: 20 },
    alignItems: "start",
  },
  docsNav: {
    position: { default: "sticky", [STACK]: "static" },
    top: size.navOffset,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 650,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: t.faint,
    marginBottom: 6,
  },
  navItem: {
    display: "block",
    paddingBlock: 5,
    paddingInline: 10,
    borderLeftWidth: 2,
    borderLeftStyle: "solid",
    borderLeftColor: "transparent",
    fontSize: 13,
    color: { default: t.muted, ":hover": t.text },
    transitionProperty: "color, border-color",
    transitionDuration: "0.15s",
  },
  navItemOn: {
    borderLeftColor: t.accent,
    color: { default: t.accent, ":hover": t.accent },
    fontWeight: 600,
  },
  docsToc: {
    position: "sticky",
    top: size.navOffset,
    display: { default: "block", [TOC_HIDE]: "none" },
  },
  tocLink: {
    display: "block",
    paddingBlock: 4,
    fontSize: 12.5,
    color: { default: t.muted, ":hover": t.accent },
    transitionProperty: "color",
    transitionDuration: "0.15s",
  },
  tocDeep: { paddingLeft: 12 },

  crumbs: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
    fontSize: 12.5,
    color: t.faint,
  },
  prose: { maxWidth: "72ch" },
  h1: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", marginBottom: 10 },
  h2: { fontSize: 19, fontWeight: 600, marginTop: 30, marginBottom: 10, paddingTop: 4 },
  h3: { fontSize: 15.5, fontWeight: 600, marginTop: 22, marginBottom: 8 },
  p: { fontSize: 14.5, lineHeight: 1.68, color: t.muted, marginBottom: 14 },
  lede: { fontSize: 16, color: t.text },
  strong: { color: t.text, fontWeight: 600 },
  link: {
    color: t.accent,
    textDecorationLine: "underline",
    textUnderlineOffset: 2,
  },
  list: {
    marginBottom: 14,
    paddingLeft: 20,
    fontSize: 14.5,
    lineHeight: 1.68,
    color: t.muted,
  },
  ul: { listStyleType: "disc" },
  ol: { listStyleType: "decimal" },
  li: { marginBottom: 5, "::marker": { color: t.faint } },
  code: {
    paddingBlock: 2,
    paddingInline: 5,
    borderRadius: 4,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    fontSize: 12.5,
    fontFamily: size.mono,
    color: t.text,
  },
  codeBlock: {
    marginBottom: 16,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rMd,
    overflow: "hidden",
  },
  codeHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 13,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    fontSize: 11.5,
    fontFamily: size.mono,
    color: t.faint,
  },
  pre: {
    padding: 13,
    fontSize: 12.5,
    fontFamily: size.mono,
    lineHeight: 1.62,
    overflowX: "auto",
    whiteSpace: "pre",
  },

  callout: {
    display: "flex",
    gap: 11,
    paddingBlock: 13,
    paddingInline: 15,
    marginBottom: 16,
    borderRadius: size.rMd,
    borderWidth: 1,
    borderStyle: "solid",
    fontSize: 13.5,
    lineHeight: 1.6,
  },
  calloutInfo: {
    backgroundColor: t.accentSoft,
    borderColor: `color-mix(in srgb, ${t.accent} 30%, transparent)`,
  },
  calloutWarn: {
    backgroundColor: t.warningSoft,
    borderColor: `color-mix(in srgb, ${t.warning} 34%, transparent)`,
  },
  calloutIcon: { flexShrink: 0, fontSize: 14, lineHeight: 1.45 },
  calloutIconInfo: { color: t.accent },
  calloutIconWarn: { color: t.warning },
  calloutTitle: { fontWeight: 650, marginBottom: 2 },
  calloutText: { fontSize: 13.5, lineHeight: 1.6 },

  table: { marginBottom: 16, fontSize: 13.5, width: "100%" },
  th: {
    paddingBlock: 9,
    paddingInline: 12,
    backgroundColor: t.surface2,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left",
  },
  td: {
    paddingBlock: 9,
    paddingInline: 12,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    color: t.muted,
  },
  tdFirst: { color: t.text, fontWeight: 550 },

  blockquote: {
    marginBottom: 16,
    paddingBlock: 10,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderLeftColor: t.borderStrong,
    fontSize: 14.5,
    lineHeight: 1.65,
    color: t.muted,
    fontStyle: "italic",
  },

  docsFoot: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    marginTop: 34,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: t.border,
  },
  footLink: {
    display: "block",
    paddingBlock: 11,
    paddingInline: 14,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: t.border, ":hover": t.accent },
    borderRadius: size.rMd,
    minWidth: 170,
    transitionProperty: "border-color",
    transitionDuration: "0.15s",
  },
  footLinkNext: { textAlign: "right" },
  footDir: { fontSize: 11.5, color: t.faint, marginBottom: 2 },
  footLabel: { fontSize: 13.5, fontWeight: 600 },
});
