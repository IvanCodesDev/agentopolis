import { Board, Logo } from "../board";
import { BlueprintGrid, SurveyMarks, VoxelRender } from "../art";
import { Icon } from "../ui";
import { HOME_COORDS, HOME_NAV, HOME_STATS } from "../data";

/** Board 01 —「首页 / 首页 Dashboard」*/
export function HomePage() {
  return (
    <Board index="01" title="首页" sub="首页 Dashboard">
      <div className="cy-surface">
        <header className="cy-topbar">
          <Logo />
          <nav className="cy-topnav">
            {HOME_NAV.map((item, i) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: 26 }}>
                {i > 0 && <s className="cy-slash">/</s>}
                <a className="cy-mono-nav" href="#top">{item}</a>
              </span>
            ))}
          </nav>

          <div className="cy-topbar-end">
            <div className="cy-systime">
              <b>SYS.TIME</b>
              <span>23:47:12</span>
              <u>UTC+8<i /></u>
            </div>
            <div className="cy-topbar-actions">
              <button type="button" className="cy-cta">
                <Icon name="plus" size={20} strokeWidth={2.4} />
                创建项目
              </button>
              <button type="button" className="cy-dots" aria-label="更多">
                <i /><i /><i />
              </button>
            </div>
          </div>
        </header>

        <section className="cy-01-hero">
          <div className="cy-01-rail" aria-hidden="true">
            <div className="cy-01-ticks">
              <i /><i /><i /><i /><i /><i />
            </div>
            <span>WEB DESIGN REIMAGINED</span>
            <b>2024</b>
          </div>

          <div className="cy-01-copy">
            <span className="cy-01-index">/01</span>
            <h1 className="cy-01-title">
              让每一次
              <br />
              <em>真实贡献</em>
              <br />
              都有凭可循。
            </h1>
            <p className="cy-01-lead">
              为技术贡献者提供清晰的价值记录，
              <br />
              让协作的努力、复现的成果、被看见，被认可。
            </p>
            <div className="cy-01-actions">
              <button type="button" className="cy-cta">
                开始探索
                <Icon name="arrow" size={20} strokeWidth={2.2} />
              </button>
              <button type="button" className="cy-ghost-link">
                了解如何运行
                <Icon name="frame" size={22} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="cy-01-art">
            <BlueprintGrid className="cy-01-grid" />
            <VoxelRender className="cy-01-voxel" />
            <SurveyMarks />

            <div className="cy-01-badge">
              <div><i>&gt;</i>渲染中</div>
              <div><em />83%</div>
            </div>
            <span className="cy-01-globe"><Icon name="globe" size={40} strokeWidth={1.4} /></span>

            <div className="cy-01-coords">
              {HOME_COORDS.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <span className="cy-01-slug">//SCN_01</span>
          </div>
        </section>

        <footer className="cy-01-stats">
          {HOME_STATS.map((stat) => (
            <div key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </footer>
      </div>
    </Board>
  );
}
