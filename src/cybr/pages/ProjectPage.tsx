import { useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../shell";
import { Icon, PixelPlate, Seal, Tag } from "../ui";
import { PROJECT, PROJECT_FLOW, PROJECT_PARTIES, PROJECT_TABS } from "../data";

/** Board 03 —「项目详情 / 项目详情页」*/
export function ProjectPage() {
  const [tab, setTab] = useState("任务流程");

  const renderTabContent = () => {
    if (tab === "任务流程") return <section className="cy-card">
      <div className="cy-card-head"><h2>任务流程</h2><div className="cy-card-head-end"><span className="cy-xs cy-muted">共 {PROJECT_FLOW.length} 个节点</span></div></div>
      <ol className="cy-timeline">{PROJECT_FLOW.map((row) => <li key={row.title} className={row.active ? "on" : undefined}><span className="cy-timeline-dot" aria-hidden="true" /><strong>{row.title}</strong><span className="cy-timeline-actor">{row.actor}</span><time className="cy-mono">{row.at}</time></li>)}</ol>
      <button type="button" className="cy-timeline-add"><Icon name="plus" size={14} />添加流程节点</button>
    </section>;

    if (tab === "项目详情") return <section className="cy-card cy-project-overview">
      <div className="cy-card-head"><h2>项目概览</h2><span className="cy-xs cy-muted">最后更新 2024.06.24</span></div>
      <div className="cy-card-pad"><p className="cy-body cy-dim">本项目为电商品牌建立完整的视觉识别与线上推广素材，包含品牌调性、主视觉系统和多端适配规范。</p><div className="cy-overview-metrics"><div><b>60%</b><span>整体进度</span></div><div><b>12</b><span>交付文件</span></div><div><b>46 天</b><span>项目周期</span></div></div><dl className="cy-kv-list"><div className="cy-kv"><dt>当前阶段</dt><dd>设计执行中</dd></div><div className="cy-kv"><dt>下一节点</dt><dd>提交中期方案确认</dd></div><div className="cy-kv"><dt>项目状态</dt><dd><Tag status="run">进行中</Tag></dd></div></dl></div>
    </section>;

    if (tab === "交付物") return <section className="cy-card"><div className="cy-card-head"><h2>交付物清单</h2><span className="cy-xs cy-muted">4 个文件</span></div><ul className="cy-file-list">{["品牌视觉主方案.pdf", "电商首页视觉稿.fig", "社交媒体延展规范.pdf", "品牌色彩与字体规范.pdf"].map((name, i) => <li key={name}><span className="cy-file-icon"><Icon name="file" size={16} /></span><div className="cy-stack"><strong>{name}</strong><span className="cy-xs cy-muted">{i < 2 ? "已审核 · 2024.06.24" : "待验收 · 2024.06.25"}</span></div><Tag status={i < 2 ? "done" : "wait"}>{i < 2 ? "已提交" : "待验收"}</Tag><button className="cy-icon-btn" aria-label={`查看 ${name}`}><Icon name="right" size={14} /></button></li>)}</ul></section>;

    if (tab === "文件交付") return <section className="cy-card"><div className="cy-card-head"><h2>文件交付</h2><button className="cy-btn cy-btn-dark cy-btn-sm"><Icon name="upload" size={14} />上传文件</button></div><div className="cy-upload-state"><span className="cy-upload-icon"><Icon name="folder" size={22} /></span><strong>拖入文件或点击上传</strong><span className="cy-sm cy-muted">支持 PDF、FIG、PNG，单个文件不超过 50MB</span></div><div className="cy-file-history"><div><span>最近一次提交</span><b>2024.06.24 14:15</b></div><div><span>提交人</span><b>设计师-张三</b></div><div><span>文件数量</span><b>8 个</b></div></div></section>;

    if (tab === "验证记录") return <section className="cy-card"><div className="cy-card-head"><h2>验证记录</h2><span className="cy-xs cy-muted">链上存证</span></div><ul className="cy-verification-list">{["项目签约已确认", "发布方身份已认证", "设计师贡献已记录", "交付文件完整性校验"].map((item, i) => <li key={item}><span className="cy-check-dot"><Icon name="check" size={11} /></span><div className="cy-stack"><strong>{item}</strong><span className="cy-xs cy-muted">Base Sepolia · 0x7a0f...c3c9b2</span></div><time className="cy-mono">06.{18 + i}.2024</time></li>)}</ul></section>;

    return <section className="cy-card"><div className="cy-card-head"><h2>凭证签发</h2><Tag status="wait">待签发</Tag></div><div className="cy-issue-panel"><div className="cy-issue-icon"><Icon name="award" size={24} /></div><div className="cy-stack"><h3>职业贡献凭证</h3><p className="cy-body cy-dim">项目完成并通过验收后，将为参与成员签发可验证的职业贡献凭证。</p><div className="cy-issue-meta"><span>预计签发：2024.06.30</span><span>签发对象：设计师-张三</span></div></div><Link to="/v2/credentials/VC-0x7a0f" className="cy-btn cy-btn-primary">查看凭证模板</Link></div></section>;
  };

  return (
    <Shell index="03" title="项目详情" sub="项目详情页">
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
            <Link className="cy-btn cy-btn-dark cy-btn-sm" to="/v2/credentials/VC-0x7a0f">查看凭证</Link>
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
          {renderTabContent()}

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
