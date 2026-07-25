import { Link } from "react-router-dom";
import { Shell } from "../shell";
import { Donut, Icon, Tag } from "../ui";
import { CREDENTIAL_MIX, DESIGNER, PROFILE_STATS, RECENT_TASKS, SKILLS } from "../data";

const TOTAL = CREDENTIAL_MIX.reduce((sum, slice) => sum + slice.value, 0);

/** Board 05 —「个人中心 / 设计师工作台」*/
export function ProfilePage() {
  return (
    <Shell>
        <main className="cy-page cy-talent-page">
          <header className="cy-talent-head">
            <span className="cy-avatar cy-avatar-lg cy-avatar-purple">{DESIGNER.name.slice(0, 1)}</span>
            <div className="cy-stack">
              <span className="cy-label">人才档案 / TALENT PROFILE</span>
              <h1 className="cy-d2">{DESIGNER.name}</h1>
              <p className="cy-body cy-dim">{DESIGNER.role} · <code>{DESIGNER.address}</code></p>
            </div>
            <Link to="/v2/credentials/VC-0x7a0f" className="cy-btn cy-btn-dark">查看凭证</Link>
          </header>

          <section className="cy-workbench-stats">
            {PROFILE_STATS.map((stat) => (
              <div key={stat.label} className="cy-card cy-card-pad cy-stat">
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </div>
            ))}
          </section>

          <div className="cy-workbench-grid">
            <section className="cy-card">
              <div className="cy-card-head">
                <h2>最近任务</h2>
                <div className="cy-card-head-end">
                  <Link to="/v2/tasks" className="cy-btn-text cy-sm">
                    查看全部
                  </Link>
                </div>
              </div>
              <ul className="cy-recent">
                {RECENT_TASKS.map((task) => (
                  <li key={task.title}>
                    <span className="cy-recent-dot" aria-hidden="true" />
                    <strong>{task.title}</strong>
                    <Tag status={task.status} />
                    <time className="cy-xs cy-muted">{task.at}</time>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cy-card">
              <div className="cy-card-head">
                <h2>凭证概览</h2>
              </div>
              <div className="cy-card-pad cy-overview">
                <Donut slices={CREDENTIAL_MIX} caption={TOTAL} sub="总凭证" />
                <div className="cy-legend">
                  {CREDENTIAL_MIX.map((slice) => (
                    <div key={slice.label}>
                      <i style={{ background: slice.color }} />
                      {slice.label}
                      <b>{slice.value}</b>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/v2/credentials/VC-0x7a0f" className="cy-overview-link">
                查看全部凭证
                <Icon name="right" size={14} />
              </Link>
            </section>
          </div>

          <section className="cy-card">
            <div className="cy-card-head">
              <h2>技能标签</h2>
            </div>
            <div className="cy-card-pad cy-pills" style={{ gap: 10 }}>
              {SKILLS.map((skill) => (
                <span key={skill} className="cy-chip">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </main>
    </Shell>
  );
}
