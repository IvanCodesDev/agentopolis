import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Icon } from "./ui";

const NAV = [
  { to: "/v2", label: "首页", en: "HOME", end: true },
  { to: "/v2/tasks", label: "任务", en: "TASKS" },
  { to: "/v2/projects/PRJ-2024-0618-001", label: "项目", en: "PROJECTS" },
  { to: "/v2/credentials/VC-0x7a0f", label: "凭证", en: "CREDENTIALS" },
  { to: "/v2/profile", label: "人才", en: "TALENT" },
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
  const [open, setOpen] = useState(false);
  return (
    <>
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
            <button type="button" className="cy-btn cy-btn-dark cy-btn-sm" onClick={() => setOpen(true)}>
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
    {open && <CreateProjectModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
  return <div className="cy-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="cy-modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="cy-modal-head"><div><span className="cy-label">NEW PROJECT / 01</span><h2 id="create-project-title">创建项目</h2></div><button className="cy-icon-btn" aria-label="关闭" onClick={onClose}>×</button></div>
        <div className="cy-modal-form">
          <label>项目名称<input placeholder="例如：电商品牌视觉设计" /></label>
          <label>项目类型<select defaultValue="视觉设计"><option>视觉设计</option><option>品牌设计</option><option>UI / UX 设计</option></select></label>
          <div className="cy-modal-row"><label>预算<input placeholder="¥ 80,000" /></label><label>交付日期<input type="date" defaultValue="2024-09-30" /></label></div>
        </div>
        <div className="cy-modal-foot"><span className="cy-sm cy-muted">创建后可在项目详情中继续配置流程。</span><div className="cy-row"><button className="cy-btn cy-btn-ghost" onClick={onClose}>取消</button><button className="cy-btn cy-btn-primary" onClick={onClose}><Icon name="plus" size={14} />创建项目</button></div></div>
      </section>
    </div>;
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

export function Shell({ children, bar, index = "", title = "", sub = "" }: { children: ReactNode; bar?: ReactNode; index?: string; title?: string; sub?: string }) {
  return (
    <div className="cybr cy-stage">
      <div className="cy-board cy-shell-board">
        <div className="cy-surface cy-shell">
          {bar ?? <TopBar />}
          {children}
        </div>
      </div>
    </div>
  );
}
