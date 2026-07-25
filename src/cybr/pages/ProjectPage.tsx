import { useState } from "react";
import { Shell } from "../shell";
import { Icon, PixelPlate, Seal, Tag } from "../ui";
import { PROJECT, PROJECT_FLOW, PROJECT_PARTIES, PROJECT_TABS } from "../data";

/** Board 03 —「项目详情 / 项目详情页」*/
export function ProjectPage() {
  const [tab, setTab] = useState("任务流程");

  return (
    <Shell>
      <main className="cy-page">
        <section className="cy-card cy-project-head">
          <div className="cy-project-head-main">
            <div className="cy-row">
              <h1 className="cy-d2">{PROJECT.title}</h1>
              <Tag status={PROJECT.status} />
            </div>
            <dl className="cy-project-meta">
              <div>
                <dt>项目编号</dt>
                <dd className="cy-mono">{PROJECT.code}</dd>
              </div>
              <div>
                <dt>分类</dt>
                <dd>{PROJECT.category}</dd>
              </div>
              <div>
                <dt>周期</dt>
                <dd>{PROJECT.period}</dd>
              </div>
            </dl>
          </div>

          <div className="cy-project-publisher">
            <span className="cy-label">发布方</span>
            <div className="cy-row">
              <span className="cy-pixel-frame cy-publisher-mark">
                <PixelPlate seed={PROJECT.publisher} cols={14} rows={14} className="cy-pixel" />
              </span>
              <div className="cy-stack">
                <strong style={{ fontSize: 14 }}>{PROJECT.publisher}</strong>
                <span style={{ marginTop: 5 }}>
                  <Seal />
                </span>
              </div>
            </div>
          </div>
        </section>

        <nav className="cy-tabs cy-project-tabs">
          {PROJECT_TABS.map((item) => (
            <button key={item} type="button" className={item === tab ? "on" : undefined} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="cy-project-grid">
          <section className="cy-card">
            <div className="cy-card-head">
              <h2>任务流程</h2>
              <div className="cy-card-head-end">
                <span className="cy-xs cy-muted">共 {PROJECT_FLOW.length} 个节点</span>
              </div>
            </div>
            <ol className="cy-timeline">
              {PROJECT_FLOW.map((row) => (
                <li key={row.title} className={row.active ? "on" : undefined}>
                  <span className="cy-timeline-dot" aria-hidden="true" />
                  <strong>{row.title}</strong>
                  <span className="cy-timeline-actor">{row.actor}</span>
                  <time className="cy-mono">{row.at}</time>
                </li>
              ))}
            </ol>
            <button type="button" className="cy-timeline-add">
              <Icon name="plus" size={14} />
              添加流程节点
            </button>
          </section>

          <aside className="cy-project-aside">
            <section className="cy-card">
              <div className="cy-card-head">
                <h2>项目信息</h2>
              </div>
              <dl className="cy-card-pad" style={{ paddingTop: 4, paddingBottom: 8 }}>
                <div className="cy-kv">
                  <dt>项目名称</dt>
                  <dd>{PROJECT.title}</dd>
                </div>
                <div className="cy-kv">
                  <dt>主理方</dt>
                  <dd>{PROJECT.publisher}</dd>
                </div>
                <div className="cy-kv">
                  <dt>预算</dt>
                  <dd>{PROJECT.budget}</dd>
                </div>
                <div className="cy-kv">
                  <dt>结算方式</dt>
                  <dd>{PROJECT.settle}</dd>
                </div>
                <div className="cy-kv">
                  <dt>签约状态</dt>
                  <dd>{PROJECT.contract}</dd>
                </div>
              </dl>
            </section>

            <section className="cy-card">
              <div className="cy-card-head">
                <h2>参与方（{PROJECT_PARTIES.length}）</h2>
              </div>
              <ul className="cy-party-list">
                {PROJECT_PARTIES.map((party) => (
                  <li key={party.name}>
                    <span className={`cy-avatar cy-avatar-sm cy-avatar-${party.tone}`}>{party.name.slice(-1)}</span>
                    <div className="cy-stack">
                      <strong>{party.name}</strong>
                      <span className="cy-xs cy-muted">{party.role}</span>
                    </div>
                    <button type="button" className="cy-icon-btn cy-icon-btn-plain" aria-label={`联系 ${party.name}`}>
                      <Icon name="send" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
