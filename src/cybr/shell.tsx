import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "./ui";

const NAV = [
  { to: "/v2", label: "首页", en: "HOME", end: true },
  { to: "/v2/tasks", label: "任务", en: "TASKS" },
  { to: "/v2/projects/PRJ-2024-0618-001", label: "项目", en: "PROJECTS" },
  { to: "/v2/credentials/VC-0x7a0f", label: "凭证", en: "CREDENTIALS" },
  { to: "/v2/profile", label: "人才", en: "TALENT" },
  { to: "/v2/design", label: "设计语言", en: "SYSTEM" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <NavLink to="/v2" className="cy-logo" style={light ? { color: "#fff" } : undefined}>
      <i />
      CYBR_
    </NavLink>
  );
}

/** Top chrome shared by boards 01 / 02 / 03. */
export function TopBar({ actions }: { actions?: ReactNode }) {
  return (
    <header className="cy-topbar">
      <Logo />
      <nav className="cy-nav">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "on" : undefined)}>
            {item.label}
            <em>{item.en}</em>
          </NavLink>
        ))}
      </nav>
      <div className="cy-topbar-end">
        {actions ?? (
          <>
            <button type="button" className="cy-btn cy-btn-dark cy-btn-sm">
              <Icon name="plus" size={14} />
              创建项目
            </button>
            <button type="button" className="cy-icon-btn cy-icon-btn-plain" aria-label="更多">
              <Icon name="more" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

/** Compact chrome used by the credential / verification boards (04 / 06). */
export function SlimBar({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="cy-topbar">
      <Logo />
      <span className="cy-divider" style={{ width: 1, height: 20, background: "var(--cy-line)" }} />
      <strong style={{ fontSize: 14 }}>{title}</strong>
      <div className="cy-topbar-end">{actions}</div>
    </header>
  );
}

export function Shell({ children, bar }: { children: ReactNode; bar?: ReactNode }) {
  return (
    <div className="cybr">
      <div className="cy-shell">
        {bar ?? <TopBar />}
        {children}
      </div>
    </div>
  );
}
