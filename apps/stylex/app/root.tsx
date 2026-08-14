import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { footerColumns, navLinks } from "./data";
import {
  BellIcon,
  LogoMark,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "./icons";
import "./reset.css";
import { darkTheme, lightTheme } from "./themes.stylex";
import { size, t } from "./tokens.stylex";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

const MOBILE = "@media (max-width: 900px)";
const NARROW = "@media (max-width: 860px)";
const TINY = "@media (max-width: 460px)";

type Theme = "system" | "light" | "dark";
const nextTheme: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const themeIcon: Record<Theme, React.ReactNode> = {
  system: <MonitorIcon />,
  light: <SunIcon />,
  dark: <MoonIcon />,
};

// StyleX has no token-level dark mode, so `color-scheme` — which is what
// makes native controls (checkboxes, scrollbars, pickers) follow the theme —
// has to be declared and switched by hand alongside the theme classes.
const schemes = stylex.create({
  system: { colorScheme: "light dark" },
  light: { colorScheme: "light" },
  dark: { colorScheme: "dark" },
});

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html
      lang="en"
      {...stylex.props(
        schemes[theme],
        theme === "light" && lightTheme,
        theme === "dark" && darkTheme,
      )}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Dev-only StyleX wiring. Both tags are created imperatively rather
            than server-rendered: Vite rewrites `<link>`/`<script src>` that it
            serves, and React then reports the rewritten attributes as a
            hydration mismatch. The runtime must also go through Vite's /@id/
            prefix — a bare `import('virtual:stylex:runtime')` is not resolved
            and the browser rejects it as cross-origin. */}
        {import.meta.env.DEV && (
          <script
            dangerouslySetInnerHTML={{
              __html:
                "var l=document.createElement('link');l.rel='stylesheet';l.href='/virtual:stylex.css';document.head.appendChild(l);" +
                "var s=document.createElement('script');s.type='module';s.src='/@id/virtual:stylex:runtime';document.head.appendChild(s);",
            }}
          />
        )}
      </head>
      <body>
        <div {...stylex.props(s.shell)}>
          <header {...stylex.props(s.nav)}>
            <div {...stylex.props(s.navInner)}>
              <a href="/" {...stylex.props(s.brand)}>
                <span {...stylex.props(s.brandMark)}>
                  <LogoMark />
                </span>
                Nimbus
              </a>

              <nav aria-label="Main">
                <ul {...stylex.props(s.navLinks, menuOpen && s.navLinksOpen)}>
                  {navLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.to === "/"}
                        className={({ isActive }) =>
                          stylex.props(s.navLink, isActive && s.navLinkActive).className ?? ""
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <span {...stylex.props(s.navSpacer)} />

              <div {...stylex.props(s.navSearch)}>
                <span {...stylex.props(s.navSearchIcon)}>
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  placeholder="Search projects…"
                  aria-label="Search projects"
                  {...stylex.props(s.navSearchInput)}
                />
              </div>

              <button
                type="button"
                aria-label={`Theme: ${theme}`}
                onClick={() => setTheme(nextTheme[theme])}
                {...stylex.props(s.iconBtn)}
              >
                {themeIcon[theme]}
              </button>

              <button type="button" aria-label="Notifications" {...stylex.props(s.iconBtn)}>
                <BellIcon />
              </button>

              <button
                type="button"
                aria-label="Toggle navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                {...stylex.props(s.iconBtn, s.navToggle)}
              >
                <MenuIcon />
              </button>

              <span aria-hidden="true" {...stylex.props(s.avatar)}>
                AO
              </span>
            </div>
          </header>

          <main {...stylex.props(s.main)}>{children}</main>

          <footer {...stylex.props(s.footer)}>
            <div {...stylex.props(s.footerInner)}>
              <div {...stylex.props(s.footerCols)}>
                <div>
                  <span {...stylex.props(s.brand)}>
                    <span {...stylex.props(s.brandMark)}>
                      <LogoMark />
                    </span>
                    Nimbus
                  </span>
                  <p {...stylex.props(s.footerBlurb)}>
                    Ship, observe and roll back multi-region deployments from one console.
                  </p>
                </div>
                {footerColumns.map((col) => (
                  <div key={col.title}>
                    <h3 {...stylex.props(s.footerColTitle)}>{col.title}</h3>
                    <ul {...stylex.props(s.footerColList)}>
                      {col.links.map((label) => (
                        <li key={label}>
                          <a href="/" {...stylex.props(s.footerColLink)}>
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div {...stylex.props(s.footerBar)}>
                <span>© 2026 Nimbus Systems, Inc.</span>
                <span>Built with StyleX</span>
              </div>
            </div>
          </footer>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div {...stylex.props(s.errorPage)}>
      <h1 {...stylex.props(s.errorTitle)}>{message}</h1>
      <p {...stylex.props(s.errorSub)}>{details}</p>
      {stack && (
        <pre {...stylex.props(s.errorPre)}>
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}

const s = stylex.create({
  shell: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: t.bg,
    color: t.text,
  },
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    height: size.navH,
    backgroundColor: `color-mix(in srgb, ${t.surface} 86%, transparent)`,
    backdropFilter: "saturate(180%) blur(12px)",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
  },
  navInner: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    height: "100%",
    maxWidth: size.shellMax,
    marginInline: "auto",
    paddingInline: 20,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    flexShrink: 0,
    fontWeight: 650,
    fontSize: 15,
    letterSpacing: "-0.02em",
  },
  brandMark: {
    display: "grid",
    placeItems: "center",
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundImage: `linear-gradient(140deg, ${t.accent}, color-mix(in srgb, ${t.accent} 55%, #22d3ee))`,
    color: "#fff",
  },
  navLinks: {
    display: { default: "flex", [MOBILE]: "none" },
    alignItems: { default: "center", [MOBILE]: "stretch" },
    flexDirection: { default: "row", [MOBILE]: "column" },
    gap: { default: 2, [MOBILE]: 0 },
    position: { default: "static", [MOBILE]: "absolute" },
    top: { default: "auto", [MOBILE]: size.navH },
    left: { default: "auto", [MOBILE]: 0 },
    right: { default: "auto", [MOBILE]: 0 },
    padding: { default: 0, [MOBILE]: 8 },
    backgroundColor: { default: "transparent", [MOBILE]: t.surface },
    borderBottomWidth: { default: 0, [MOBILE]: 1 },
    borderBottomStyle: "solid",
    borderBottomColor: t.border,
    boxShadow: { default: "none", [MOBILE]: t.shMd },
  },
  navLinksOpen: {
    display: "flex",
  },
  navLink: {
    display: "block",
    paddingBlock: 7,
    paddingInline: 11,
    borderRadius: size.rSm,
    fontSize: 14,
    fontWeight: 500,
    color: { default: t.muted, ":hover": t.text },
    backgroundColor: { default: "transparent", ":hover": t.surface2 },
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
  },
  navLinkActive: {
    backgroundColor: { default: t.accentSoft, ":hover": t.accentSoft },
    color: { default: t.accent, ":hover": t.accent },
    fontWeight: 600,
  },
  navSpacer: { flexGrow: 1 },
  navSearch: {
    position: "relative",
    width: 200,
    display: { default: "block", [MOBILE]: "none" },
  },
  navSearchInput: {
    width: "100%",
    paddingBlock: 7,
    paddingRight: 10,
    paddingLeft: 30,
    fontSize: 13,
    backgroundColor: t.surface2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: t.border,
    borderRadius: size.rSm,
    color: t.text,
    outlineColor: t.accent,
    "::placeholder": { color: t.faint, opacity: 1 },
  },
  navSearchIcon: {
    position: "absolute",
    left: 9,
    top: "50%",
    transform: "translateY(-50%)",
    color: t.faint,
    pointerEvents: "none",
    lineHeight: 0,
  },
  iconBtn: {
    display: "grid",
    placeItems: "center",
    width: 32,
    height: 32,
    padding: 0,
    flexShrink: 0,
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
  navToggle: {
    display: { default: "none", [MOBILE]: "grid" },
  },
  avatar: {
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: size.rFull,
    backgroundColor: t.accentSoft,
    color: t.accent,
    fontSize: 11,
    fontWeight: 650,
    letterSpacing: "0.02em",
  },
  main: {
    flexGrow: 1,
    width: "100%",
    maxWidth: size.shellMax,
    marginInline: "auto",
    paddingTop: 28,
    paddingInline: 20,
    paddingBottom: 64,
  },
  footer: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: t.border,
    backgroundColor: t.surface,
  },
  footerInner: {
    maxWidth: size.shellMax,
    marginInline: "auto",
    paddingTop: 34,
    paddingInline: 20,
    paddingBottom: 24,
  },
  footerCols: {
    display: "grid",
    gridTemplateColumns: {
      default: "1.4fr repeat(4, 1fr)",
      [NARROW]: "repeat(2, minmax(0, 1fr))",
      [TINY]: "minmax(0, 1fr)",
    },
    gap: { default: 26, [NARROW]: 22 },
    paddingBottom: 24,
  },
  footerBlurb: {
    fontSize: 12.5,
    lineHeight: 1.55,
    color: t.muted,
    marginTop: 9,
    maxWidth: "30ch",
  },
  footerColTitle: { fontSize: 12, fontWeight: 650, marginBottom: 9 },
  footerColList: { display: "flex", flexDirection: "column", gap: 6 },
  footerColLink: {
    fontSize: 12.5,
    color: { default: t.muted, ":hover": t.accent },
    transitionProperty: "color",
    transitionDuration: "0.15s",
  },
  footerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: t.border,
    fontSize: 12,
    color: t.faint,
  },
  errorPage: { maxWidth: size.shellMax, marginInline: "auto", paddingBlock: 60, paddingInline: 20 },
  errorTitle: { fontSize: 25, fontWeight: 600, letterSpacing: "-0.022em" },
  errorSub: { marginTop: 5, fontSize: 14, color: t.muted },
  errorPre: {
    width: "100%",
    padding: 16,
    marginTop: 16,
    overflowX: "auto",
    backgroundColor: t.surface2,
    borderRadius: size.rMd,
    fontSize: 12,
  },
});
