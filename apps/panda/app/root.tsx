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
import { css, cx } from "styled-system/css";

import type { Route } from "./+types/root";
import "./index.css";
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
import { avatar, iconButton, navLink } from "./ui";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

type Theme = "system" | "light" | "dark";
const nextTheme: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const themeIcon: Record<Theme, React.ReactNode> = {
  system: <MonitorIcon />,
  light: <SunIcon />,
  dark: <MoonIcon />,
};

// Panda emits `_osDark` as a media query and `_dark`/`_light` as `.dark &` /
// `.light &` class selectors, so the explicit override is a class on the root
// element rather than a `color-scheme` declaration.
const schemes: Record<Theme, string> = {
  system: "",
  light: "light",
  dark: "dark",
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en" className={schemes[theme]}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className={s.shell}>
          <header className={s.nav}>
            <div className={s.navInner}>
              <a href="/" className={s.brand}>
                <span className={s.brandMark}>
                  <LogoMark />
                </span>
                Nimbus
              </a>

              <nav aria-label="Main">
                <ul className={cx(s.navLinks, menuOpen && s.navLinksOpen)}>
                  {navLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.to === "/"}
                        className={({ isActive }) => navLink({ active: isActive })}
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <span className={s.navSpacer} />

              <div className={s.navSearch}>
                <span className={s.navSearchIcon}>
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  placeholder="Search projects…"
                  aria-label="Search projects"
                  className={s.navSearchInput}
                />
              </div>

              <button
                type="button"
                aria-label={`Theme: ${theme}`}
                onClick={() => setTheme(nextTheme[theme])}
                className={iconButton}
              >
                {themeIcon[theme]}
              </button>

              <button type="button" aria-label="Notifications" className={iconButton}>
                <BellIcon />
              </button>

              <button
                type="button"
                aria-label="Toggle navigation"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={cx(iconButton, s.navToggle)}
              >
                <MenuIcon />
              </button>

              <span aria-hidden="true" className={avatar()}>
                AO
              </span>
            </div>
          </header>

          <main className={s.main}>{children}</main>

          <footer className={s.footer}>
            <div className={s.footerInner}>
              <div className={s.footerCols}>
                <div>
                  <span className={s.brand}>
                    <span className={s.brandMark}>
                      <LogoMark />
                    </span>
                    Nimbus
                  </span>
                  <p className={s.footerBlurb}>
                    Ship, observe and roll back multi-region deployments from one console.
                  </p>
                </div>
                {footerColumns.map((col) => (
                  <div key={col.title}>
                    <h3 className={s.footerColTitle}>{col.title}</h3>
                    <ul className={s.footerColList}>
                      {col.links.map((label) => (
                        <li key={label}>
                          <a href="/" className={s.footerColLink}>
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className={s.footerBar}>
                <span>© 2026 Nimbus Systems, Inc.</span>
                <span>Built with Panda</span>
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
    <div className={s.errorPage}>
      <h1 className={s.errorTitle}>{message}</h1>
      <p className={s.errorSub}>{details}</p>
      {stack && (
        <pre className={s.errorPre}>
          <code>{stack}</code>
        </pre>
      )}
    </div>
  );
}

const s = {
  shell: css({
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    bg: "bg",
    color: "text",
  }),
  nav: css({
    position: "sticky",
    top: 0,
    zIndex: 50,
    height: "navH",
    bg: "surfaceGlass",
    backdropFilter: "saturate(180%) blur(12px)",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border",
  }),
  navInner: css({
    display: "flex",
    alignItems: "center",
    gap: "20px",
    height: "100%",
    maxWidth: "shellMax",
    marginInline: "auto",
    paddingInline: "20px",
  }),
  brand: css({
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flexShrink: 0,
    fontWeight: 650,
    fontSize: "15px",
    letterSpacing: "-0.02em",
  }),
  brandMark: css({
    display: "grid",
    placeItems: "center",
    width: "26px",
    height: "26px",
    rounded: "7px",
    backgroundImage:
      "linear-gradient(140deg, {colors.accent}, color-mix(in srgb, {colors.accent} 55%, #22d3ee))",
    color: "#fff",
  }),
  navLinks: css({
    display: { base: "flex", _tablet: "none" },
    alignItems: { base: "center", _tablet: "stretch" },
    flexDirection: { base: "row", _tablet: "column" },
    gap: { base: "2px", _tablet: "0" },
    position: { base: "static", _tablet: "absolute" },
    top: { base: "auto", _tablet: "navH" },
    left: { base: "auto", _tablet: "0" },
    right: { base: "auto", _tablet: "0" },
    padding: { base: "0", _tablet: "8px" },
    bg: { base: "transparent", _tablet: "surface" },
    borderBottomWidth: { base: "0", _tablet: "1px" },
    borderBottomStyle: "solid",
    borderBottomColor: "border",
    boxShadow: { base: "none", _tablet: "md" },
  }),
  navLinksOpen: css({ display: "flex" }),
  navSpacer: css({ flexGrow: 1 }),
  navSearch: css({
    position: "relative",
    width: "200px",
    display: { base: "block", _tablet: "none" },
  }),
  navSearchInput: css({
    width: "100%",
    paddingBlock: "7px",
    paddingRight: "10px",
    paddingLeft: "30px",
    fontSize: "13px",
    bg: "surface2",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    rounded: "sm",
    color: "text",
    outlineColor: "accent",
    _placeholder: { color: "faint", opacity: 1 },
  }),
  navSearchIcon: css({
    position: "absolute",
    left: "9px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "faint",
    pointerEvents: "none",
    lineHeight: 0,
  }),
  navToggle: css({ display: { base: "none", _tablet: "grid" } }),
  main: css({
    flexGrow: 1,
    width: "100%",
    maxWidth: "shellMax",
    marginInline: "auto",
    paddingTop: "28px",
    paddingInline: "20px",
    paddingBottom: "64px",
  }),
  footer: css({
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border",
    bg: "surface",
  }),
  footerInner: css({
    maxWidth: "shellMax",
    marginInline: "auto",
    paddingTop: "34px",
    paddingInline: "20px",
    paddingBottom: "24px",
  }),
  footerCols: css({
    display: "grid",
    gridTemplateColumns: {
      base: "1.4fr repeat(4, 1fr)",
      _narrow: "repeat(2, minmax(0, 1fr))",
      _tiny: "minmax(0, 1fr)",
    },
    gap: { base: "26px", _narrow: "22px" },
    paddingBottom: "24px",
  }),
  footerBlurb: css({
    fontSize: "12.5px",
    lineHeight: 1.55,
    color: "muted",
    marginTop: "9px",
    maxWidth: "30ch",
  }),
  footerColTitle: css({ fontSize: "12px", fontWeight: 650, marginBottom: "9px" }),
  footerColList: css({ display: "flex", flexDirection: "column", gap: "6px" }),
  footerColLink: css({
    fontSize: "12.5px",
    color: { base: "muted", _hover: "accent" },
    transitionProperty: "color",
    transitionDuration: "0.15s",
  }),
  footerBar: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    paddingTop: "18px",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border",
    fontSize: "12px",
    color: "faint",
  }),
  errorPage: css({
    maxWidth: "shellMax",
    marginInline: "auto",
    paddingBlock: "60px",
    paddingInline: "20px",
  }),
  errorTitle: css({ fontSize: "25px", fontWeight: 600, letterSpacing: "-0.022em" }),
  errorSub: css({ marginTop: "5px", fontSize: "14px", color: "muted" }),
  errorPre: css({
    width: "100%",
    padding: "16px",
    marginTop: "16px",
    overflowX: "auto",
    bg: "surface2",
    rounded: "md",
    fontSize: "12px",
  }),
};
