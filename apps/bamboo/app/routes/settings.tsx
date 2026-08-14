import { useState } from "react";
import { css, cx } from "styled-system/css";

import {
  avatar,
  button,
  card,
  cardPad,
  pageActions,
  pageHead,
  pageSub,
  pageTitle,
  sectionNote,
  sectionTitle,
  sideLink,
  stack,
} from "../ui";

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

export function meta() {
  return [{ title: "Settings · Nimbus" }];
}

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [policy, setPolicy] = useState("balanced");
  const [toggles, setToggles] = useState(() => notifications.map((n) => n.on));

  return (
    <>
      <div className={pageHead}>
        <div>
          <h1 className={pageTitle}>Settings</h1>
          <p className={pageSub}>
            Organisation-wide preferences. Changes apply to all 34 workspaces unless a workspace
            overrides them.
          </p>
        </div>
      </div>

      <div className={s.settingsGrid}>
        <nav aria-label="Settings sections">
          <ul className={s.sideNav}>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={active === section.id ? "true" : undefined}
                  onClick={() => setActive(section.id)}
                  className={sideLink({ active: active === section.id })}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={stack}>
          <section id="profile" className={cx(card, cardPad)}>
            <h2 className={sectionTitle}>Profile</h2>
            <p className={sectionNote}>
              How your organisation appears on invoices, status pages and invitation emails.
            </p>

            <div className={s.identity}>
              <span aria-hidden="true" className={avatar({ size: "lg" })}>
                NS
              </span>
              <div>
                <div className={s.toggleName}>Nimbus Systems, Inc.</div>
                <p className={s.hint}>PNG or SVG, at least 256×256px, under 1 MB.</p>
                <div className={s.identityActions}>
                  <button type="button" className={button({ tone: "secondary" })}>
                    Upload
                  </button>
                  <button type="button" className={button({ tone: "ghost" })}>
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div className={s.formGrid}>
              <div className={s.formRow}>
                <label htmlFor="org-name" className={s.label}>
                  Organisation name
                </label>
                <input id="org-name" defaultValue="Nimbus Systems, Inc." className={s.input} />
              </div>
              <div className={s.formRow}>
                <label htmlFor="org-slug" className={s.label}>
                  URL slug
                </label>
                <input id="org-slug" defaultValue="nimbus" className={s.input} />
                <span className={s.hint}>nimbus.app/nimbus</span>
              </div>
              <div className={s.formRow}>
                <label htmlFor="billing-email" className={s.label}>
                  Billing email
                </label>
                <input
                  id="billing-email"
                  type="email"
                  defaultValue="billing@nimbus"
                  aria-invalid="true"
                  className={cx(s.input, s.inputError)}
                />
                <span className={s.error}>Enter a complete email address.</span>
              </div>
              <div className={s.formRow}>
                <label htmlFor="region" className={s.label}>
                  Default region
                </label>
                <select id="region" defaultValue="us-east-1" className={cx(s.input, s.select)}>
                  <option value="us-east-1">us-east-1 · N. Virginia</option>
                  <option value="eu-west-2">eu-west-2 · London</option>
                  <option value="ap-south-1">ap-south-1 · Mumbai</option>
                </select>
              </div>
              <div className={cx(s.formRow, s.formRowFull)}>
                <label htmlFor="description" className={s.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  defaultValue="Deployment and observability platform for multi-region teams."
                  className={cx(s.input, s.textarea)}
                />
                <span className={s.hint}>
                  Shown on your public status page. Markdown supported.
                </span>
              </div>
            </div>
          </section>

          <section id="notifications" className={cx(card, cardPad)}>
            <h2 className={sectionTitle}>Notifications</h2>
            <p className={sectionNote}>
              Delivery channels are configured per workspace. These switches control which events
              are eligible to send.
            </p>
            {notifications.map((item, i) => (
              <div
                key={item.name}
                className={cx(
                  s.toggleRow,
                  i === 0 && s.toggleRowFirst,
                  i === notifications.length - 1 && s.toggleRowLast,
                )}
              >
                <div className={s.toggleCopy}>
                  <div className={s.toggleName}>{item.name}</div>
                  <div className={s.toggleDesc}>{item.desc}</div>
                </div>
                <label className={s.switch}>
                  <input
                    type="checkbox"
                    checked={toggles[i]}
                    aria-label={item.name}
                    onChange={() => setToggles((prev) => prev.map((v, j) => (i === j ? !v : v)))}
                    className={s.switchInput}
                  />
                  {/* Driven by a sibling selector, not React state. */}
                  <span className={s.switchTrack} />
                </label>
              </div>
            ))}
          </section>

          <section id="security" className={cx(card, cardPad)}>
            <h2 className={sectionTitle}>Security</h2>
            <p className={sectionNote}>
              Session lifetime for every member of the organisation.
            </p>
            <div className={s.radioCards}>
              {sessionPolicies.map((option) => (
                /* Selected state comes from :has(), so no state plumbing. */
                <label key={option.id} className={s.radioCard}>
                  <input
                    type="radio"
                    name="session-policy"
                    value={option.id}
                    checked={policy === option.id}
                    onChange={() => setPolicy(option.id)}
                    className={s.radioInput}
                  />
                  <span>
                    <span className={s.radioName}>{option.name}</span>
                    <span className={s.radioDesc}>{option.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section id="danger" className={cx(card, cardPad)}>
            <h2 className={sectionTitle}>Danger zone</h2>
            <p className={sectionNote}>These actions are irreversible.</p>
            <div className={s.dangerZone}>
              <h3 className={s.dangerTitle}>Delete organisation</h3>
              <p className={s.dangerNote}>
                Permanently removes all 34 workspaces, deploy history and audit logs. Billing is
                settled at the end of the current period.
              </p>
              <button type="button" className={button({ tone: "danger" })}>
                Delete organisation
              </button>
            </div>
          </section>

          <div className={s.saveBar}>
            <span>1 unsaved change · billing email is invalid</span>
            <div className={pageActions}>
              <button type="button" className={button({ tone: "ghost" })}>
                Discard
              </button>
              <button type="button" className={button({ tone: "primary" })}>
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  settingsGrid: css({
    display: "grid",
    gridTemplateColumns: { base: "190px minmax(0, 1fr)", _stack: "minmax(0, 1fr)" },
    gap: { base: "28px", _stack: "18px" },
    alignItems: "start",
  }),
  sideNav: css({
    position: { base: "sticky", _stack: "static" },
    top: "navOffset",
  }),

  identity: css({
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingBottom: "16px",
    marginBottom: "16px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  }),
  identityActions: css({ display: "flex", gap: "8px", marginTop: "8px" }),

  formGrid: css({
    display: "grid",
    gridTemplateColumns: { base: "repeat(2, minmax(0, 1fr))", _form: "minmax(0, 1fr)" },
    gap: "14px",
  }),
  formRow: css({ display: "flex", flexDirection: "column", gap: "5px" }),
  formRowFull: css({ gridColumn: "1 / -1" }),
  label: css({ fontSize: "12.5px", fontWeight: 600, color: "text", cursor: "pointer" }),
  input: css({
    width: "100%",
    paddingBlock: "8px",
    paddingInline: "11px",
    bg: "surface",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: "borderStrong", _focus: "accent" },
    rounded: "sm",
    fontSize: "13.5px",
    color: "text",
    boxShadow: { base: "none", _focus: "0 0 0 3px token(colors.accentSoft)" },
    outlineStyle: "none",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "0.15s",
    _placeholder: { color: "faint", opacity: 1 },
  }),
  inputError: css({
    borderColor: { base: "danger", _focus: "danger" },
    boxShadow: { base: "none", _focus: "0 0 0 3px token(colors.dangerSoft)" },
  }),
  select: css({ appearance: "none", paddingRight: "24px" }),
  textarea: css({ minHeight: "80px", resize: "vertical" }),
  hint: css({ fontSize: "12px", color: "faint" }),
  error: css({ fontSize: "12px", color: "danger", fontWeight: 500 }),

  toggleRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "18px",
    paddingBlock: "13px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  }),
  toggleRowFirst: css({ paddingTop: "0" }),
  toggleRowLast: css({ borderBottomWidth: "0", paddingBottom: "0" }),
  toggleCopy: css({ minWidth: 0 }),
  toggleName: css({ fontSize: "13.5px", fontWeight: 550 }),
  toggleDesc: css({ fontSize: "12.5px", color: "muted", marginTop: "2px" }),

  switch: css({ position: "relative", flexShrink: 0, width: "38px", height: "22px", cursor: "pointer" }),
  switchInput: css({
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
    cursor: "pointer",
  }),
  // The knob and the checked state are both expressed in CSS — Bamboo can
  // target a preceding sibling, so no React state reaches the styling.
  switchTrack: css({
    display: "block",
    width: "100%",
    height: "100%",
    rounded: "full",
    bg: "borderStrong",
    pointerEvents: "none",
    transitionProperty: "background-color",
    transitionDuration: "0.18s",
    _after: {
      content: '""',
      position: "absolute",
      top: "3px",
      left: "3px",
      width: "16px",
      height: "16px",
      rounded: "full",
      bg: "#fff",
      boxShadow: "sm",
      transform: "translateX(0)",
      transitionProperty: "transform",
      transitionDuration: "0.18s",
    },
    "input:checked + &": {
      bg: "accent",
      _after: { transform: "translateX(16px)" },
    },
  }),

  radioCards: css({ display: "grid", gap: "10px" }),
  radioCard: css({
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "13px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { base: "borderStrong", _hover: "accent" },
    rounded: "md",
    cursor: "pointer",
    transitionProperty: "border-color, background-color",
    transitionDuration: "0.15s",
    "&:has(input:checked)": {
      borderColor: "accent",
      bg: "accentSoft",
    },
  }),
  radioInput: css({ marginTop: "2px", accentColor: "accent", flexShrink: 0, cursor: "pointer" }),
  radioName: css({ display: "block", fontSize: "13.5px", fontWeight: 600 }),
  radioDesc: css({ display: "block", fontSize: "12.5px", color: "muted", marginTop: "2px" }),

  dangerZone: css({
    padding: "16px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "dangerBorder",
    rounded: "md",
    bg: "dangerSoft",
  }),
  dangerTitle: css({ fontSize: "14px", fontWeight: 600, color: "danger", marginBottom: "4px" }),
  dangerNote: css({ fontSize: "12.5px", color: "muted", marginBottom: "12px", maxWidth: "56ch" }),

  saveBar: css({
    position: "sticky",
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    paddingBlock: "12px",
    paddingInline: "16px",
    bg: "surfaceGlassStrong",
    backdropFilter: "blur(10px)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "md",
    boxShadow: "md",
    fontSize: "12.5px",
    color: "muted",
  }),
};
