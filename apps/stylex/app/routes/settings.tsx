import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import { size, t } from "../tokens.stylex";
import { ui } from "../ui";

const sections = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "danger", label: "Danger zone" },
];

const notifications = [
  { name: "Deploy failures", desc: "Page the on-call rotation when a production deploy fails.", on: true },
  { name: "Budget thresholds", desc: "Email billing owners when a workspace passes 80% of its cap.", on: true },
  { name: "Weekly digest", desc: "A Monday summary of throughput, incidents and spend.", on: false },
  { name: "Member changes", desc: "Notify admins when someone joins or leaves the org.", on: false },
  { name: "Security advisories", desc: "Alert on newly disclosed CVEs affecting your dependencies.", on: true },
];

const sessionPolicies = [
  { id: "strict", name: "Strict — 8 hours", desc: "Re-authenticate every working day. Recommended for regulated workloads." },
  { id: "balanced", name: "Balanced — 7 days", desc: "Sessions persist for a week on trusted devices." },
  { id: "relaxed", name: "Relaxed — 30 days", desc: "Longest-lived sessions. Not available with SCIM enabled." },
];

const NARROW = "@media (max-width: 820px)";
const FORM = "@media (max-width: 620px)";

export function meta() {
  return [{ title: "Settings · Nimbus" }];
}

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [policy, setPolicy] = useState("balanced");
  const [toggles, setToggles] = useState(() => notifications.map((n) => n.on));

  return (
    <>
      <div {...stylex.props(ui.pageHead)}>
        <div>
          <h1 {...stylex.props(ui.pageTitle)}>Settings</h1>
          <p {...stylex.props(ui.pageSub)}>
            Organisation-wide preferences. Changes apply to all 34 workspaces unless a workspace
            overrides them.
          </p>
        </div>
      </div>

      <div {...stylex.props(s.settingsGrid)}>
        <nav aria-label="Settings sections">
          <ul {...stylex.props(s.sideNav)}>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active === section.id ? "true" : undefined}
                  onClick={() => setActive(section.id)}
                  {...stylex.props(s.sideLink, active === section.id && s.sideLinkOn)}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div {...stylex.props(ui.stack)}>
          <section id="profile" {...stylex.props(ui.card, ui.cardPad)}>
            <h2 {...stylex.props(ui.sectionTitle)}>Profile</h2>
            <p {...stylex.props(ui.sectionNote)}>
              How your organisation appears on invoices, status pages and invitation emails.
            </p>

            <div {...stylex.props(s.identity)}>
              <span aria-hidden="true" {...stylex.props(ui.avatar, ui.avatarLg)}>
                NS
              </span>
              <div>
                <div {...stylex.props(s.toggleName)}>Nimbus Systems, Inc.</div>
                <p {...stylex.props(s.hint)}>PNG or SVG, at least 256×256px, under 1 MB.</p>
                <div {...stylex.props(s.identityActions)}>
                  <button type="button" {...stylex.props(ui.btn, ui.btnSecondary)}>
                    Upload
                  </button>
                  <button type="button" {...stylex.props(ui.btn, ui.btnGhost)}>
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div {...stylex.props(s.formGrid)}>
              <div {...stylex.props(s.formRow)}>
                <label htmlFor="org-name" {...stylex.props(s.label)}>
                  Organisation name
                </label>
                <input
                  id="org-name"
                  defaultValue="Nimbus Systems, Inc."
                  {...stylex.props(s.input)}
                />
              </div>
              <div {...stylex.props(s.formRow)}>
                <label htmlFor="org-slug" {...stylex.props(s.label)}>
                  URL slug
                </label>
                <input id="org-slug" defaultValue="nimbus" {...stylex.props(s.input)} />
                <span {...stylex.props(s.hint)}>nimbus.app/nimbus</span>
              </div>
              <div {...stylex.props(s.formRow)}>
                <label htmlFor="billing-email" {...stylex.props(s.label)}>
                  Billing email
                </label>
                <input
                  id="billing-email"
                  type="email"
                  defaultValue="billing@nimbus"
                  aria-invalid="true"
                  {...stylex.props(s.input, s.inputError)}
                />
                <span {...stylex.props(s.error)}>Enter a complete email address.</span>
              </div>
              <div {...stylex.props(s.formRow)}>
                <label htmlFor="region" {...stylex.props(s.label)}>
                  Default region
                </label>
                <select id="region" defaultValue="us-east-1" {...stylex.props(s.input, ui.selectField)}>
                  <option value="us-east-1">us-east-1 · N. Virginia</option>
                  <option value="eu-west-2">eu-west-2 · London</option>
                  <option value="ap-south-1">ap-south-1 · Mumbai</option>
                </select>
              </div>
              <div {...stylex.props(s.formRow, s.formRowFull)}>
                <label htmlFor="description" {...stylex.props(s.label)}>
                  Description
                </label>
                <textarea
                  id="description"
                  defaultValue="Deployment and observability platform for multi-region teams."
                  {...stylex.props(s.input, s.textarea)}
                />
                <span {...stylex.props(s.hint)}>
                  Shown on your public status page. Markdown supported.
                </span>
              </div>
            </div>
          </section>

          <section id="notifications" {...stylex.props(ui.card, ui.cardPad)}>
            <h2 {...stylex.props(ui.sectionTitle)}>Notifications</h2>
            <p {...stylex.props(ui.sectionNote)}>
              Delivery channels are configured per workspace. These switches control which events
              are eligible to send.
            </p>
            {notifications.map((item, i) => (
              <div
                key={item.name}
                {...stylex.props(
                  s.toggleRow,
                  i === 0 && s.toggleRowFirst,
                  i === notifications.length - 1 && s.toggleRowLast,
                )}
              >
                <div {...stylex.props(s.toggleCopy)}>
                  <div {...stylex.props(s.toggleName)}>{item.name}</div>
                  <div {...stylex.props(s.toggleDesc)}>{item.desc}</div>
                </div>
                <label {...stylex.props(s.switch)}>
                  <input
                    type="checkbox"
                    checked={toggles[i]}
                    aria-label={item.name}
                    onChange={() => setToggles((prev) => prev.map((v, j) => (i === j ? !v : v)))}
                    {...stylex.props(s.switchInput)}
                  />
                  <span {...stylex.props(s.switchTrack, toggles[i] && s.switchTrackOn)} />
                </label>
              </div>
            ))}
          </section>

          <section id="security" {...stylex.props(ui.card, ui.cardPad)}>
            <h2 {...stylex.props(ui.sectionTitle)}>Security</h2>
            <p {...stylex.props(ui.sectionNote)}>
              Session lifetime for every member of the organisation.
            </p>
            <div {...stylex.props(s.radioCards)}>
              {sessionPolicies.map((option) => (
                <label
                  key={option.id}
                  {...stylex.props(s.radioCard, policy === option.id && s.radioCardOn)}
                >
                  <input
                    type="radio"
                    name="session-policy"
                    value={option.id}
                    checked={policy === option.id}
                    onChange={() => setPolicy(option.id)}
                    {...stylex.props(s.radioInput)}
                  />
                  <span>
                    <span {...stylex.props(s.radioName)}>{option.name}</span>
                    <span {...stylex.props(s.radioDesc)}>{option.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section id="danger" {...stylex.props(ui.card, ui.cardPad)}>
            <h2 {...stylex.props(ui.sectionTitle)}>Danger zone</h2>
            <p {...stylex.props(ui.sectionNote)}>These actions are irreversible.</p>
            <div {...stylex.props(s.dangerZone)}>
              <h3 {...stylex.props(s.dangerTitle)}>Delete organisation</h3>
              <p {...stylex.props(s.dangerNote)}>
                Permanently removes all 34 workspaces, deploy history and audit logs. Billing is
                settled at the end of the current period.
              </p>
              <button type="button" {...stylex.props(ui.btn, ui.btnDanger)}>
                Delete organisation
              </button>
            </div>
          </section>

          <div {...stylex.props(s.saveBar)}>
            <span>1 unsaved change · billing email is invalid</span>
            <div {...stylex.props(ui.pageActions)}>
              <button type="button" {...stylex.props(ui.btn, ui.btnGhost)}>
                Discard
              </button>
              <button type="button" {...stylex.props(ui.btn, ui.btnPrimary)}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const s = stylex.create({
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: { default: "190px minmax(0, 1fr)", [NARROW]: "minmax(0, 1fr)" },
    gap: { default: 28, [NARROW]: 18 },
    alignItems: "start",
  },
  sideNav: {
    position: { default: "sticky", [NARROW]: "static" },
    top: size.navOffset,
  },
  sideLink: {
    display: "block",
    paddingBlock: 7,
    paddingInline: 10,
    borderRadius: size.rSm,
    fontSize: 13.5,
    color: { default: t.muted, ":hover": t.text },
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  sideLinkOn: {
    backgroundColor: { default: t.accentSoft, ":hover": t.accentSoft },
    color: { default: t.accent, ":hover": t.accent },
    fontWeight: 600,
  },

  identity: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  identityActions: { display: "flex", gap: 8, marginTop: 8 },

  formGrid: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [FORM]: "minmax(0, 1fr)" },
    gap: 14,
  },
  formRow: { display: "flex", flexDirection: "column", gap: 5 },
  formRowFull: { gridColumn: "1 / -1" },
  label: { fontSize: 12.5, fontWeight: 600, color: t.text, cursor: "pointer" },
  input: {
    width: "100%",
    paddingBlock: 8,
    paddingInline: 11,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: t.borderStrong, ":focus": t.accent },
    borderRadius: size.rSm,
    fontSize: 13.5,
    color: t.text,
    boxShadow: { default: "none", ":focus": `0 0 0 3px ${t.accentSoft}` },
    outlineStyle: "none",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
    "::placeholder": { color: t.faint, opacity: 1 },
  },
  inputError: {
    borderColor: { default: t.danger, ":focus": t.danger },
    boxShadow: { default: "none", ":focus": `0 0 0 3px ${t.dangerSoft}` },
  },
  textarea: { minHeight: 80, resize: "vertical" },
  hint: { fontSize: 12, color: t.faint },
  error: { fontSize: 12, color: t.danger, fontWeight: 500 },

  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    paddingBlock: 13,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  toggleRowFirst: { paddingTop: 0 },
  toggleRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  toggleCopy: { minWidth: 0 },
  toggleName: { fontSize: 13.5, fontWeight: 550 },
  toggleDesc: { fontSize: 12.5, color: t.muted, marginTop: 2 },

  switch: { position: "relative", flexShrink: 0, width: 38, height: 22, cursor: "pointer" },
  switchInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
    cursor: "pointer",
  },
  switchTrack: {
    display: "block",
    width: "100%",
    height: "100%",
    borderRadius: size.rFull,
    backgroundColor: t.borderStrong,
    pointerEvents: "none",
    transitionProperty: "background-color",
    transitionDuration: "0.18s",
    "::after": {
      content: '""',
      position: "absolute",
      top: 3,
      left: 3,
      width: 16,
      height: 16,
      borderRadius: size.rFull,
      backgroundColor: "#fff",
      boxShadow: t.shSm,
      transform: "translateX(0)",
      transitionProperty: "transform",
      transitionDuration: "0.18s",
    },
  },
  switchTrackOn: {
    backgroundColor: t.accent,
    "::after": { transform: "translateX(16px)" },
  },

  radioCards: { display: "grid", gap: 10 },
  radioCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: t.borderStrong, ":hover": t.accent },
    borderRadius: size.rMd,
    cursor: "pointer",
    transitionProperty: "border-color, background-color",
    transitionDuration: "0.15s",
  },
  radioCardOn: {
    borderColor: { default: t.accent, ":hover": t.accent },
    backgroundColor: t.accentSoft,
  },
  radioInput: { marginTop: 2, accentColor: t.accent, flexShrink: 0, cursor: "pointer" },
  radioName: { display: "block", fontSize: 13.5, fontWeight: 600 },
  radioDesc: { display: "block", fontSize: 12.5, color: t.muted, marginTop: 2 },

  dangerZone: {
    padding: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: `color-mix(in srgb, ${t.danger} 40%, transparent)`,
    borderRadius: size.rMd,
    backgroundColor: t.dangerSoft,
  },
  dangerTitle: { fontSize: 14, fontWeight: 600, color: t.danger, marginBottom: 4 },
  dangerNote: { fontSize: 12.5, color: t.muted, marginBottom: 12, maxWidth: "56ch" },

  saveBar: {
    position: "sticky",
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    paddingBlock: 12,
    paddingInline: 16,
    backgroundColor: `color-mix(in srgb, ${t.surface} 92%, transparent)`,
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rMd,
    boxShadow: t.shMd,
    fontSize: 12.5,
    color: t.muted,
  },
});
