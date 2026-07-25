import { useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../shell";
import { Icon, PixelPlate, Tag } from "../ui";
import { TASKS, TASK_FILTERS } from "../data";

const FILTER_STATUS: Record<string, string> = {
  进行中: "run",
  待提交: "wait",
  待验收: "check",
  已完成: "done",
  已撤销: "revoked",
};

/** Board 02 —「任务中心 / 任务列表」*/
export function TasksPage() {
  const [filter, setFilter] = useState("全部");
  const visible = filter === "全部" ? TASKS : TASKS.filter((task) => task.status === FILTER_STATUS[filter]);

  return (
    <Shell>
      <main className="cy-page">
        <div className="cy-spread cy-tasks-head">
          <h1 className="cy-d1">我的任务</h1>
          <div className="cy-row">
            <label className="cy-search">
              <Icon name="search" size={14} />
              <input placeholder="搜索任务名称" aria-label="搜索任务名称" />
            </label>
            <button type="button" className="cy-icon-btn" aria-label="筛选">
              <Icon name="filter" />
            </button>
          </div>
        </div>

        <div className="cy-pills cy-tasks-filters">
          {TASK_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={item === filter ? "on" : undefined}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="cy-task-list">
          {visible.map((task) => (
            <li key={task.id}>
              <Link to={`/v2/projects/${task.code}`} className="cy-card cy-card-hover cy-task">
                <span className="cy-pixel-frame cy-task-art">
                  <PixelPlate seed={task.code} cols={22} rows={22} className="cy-pixel" />
                </span>

                <div className="cy-task-body">
                  <div className="cy-row cy-task-title">
                    <strong className="cy-h3">{task.title}</strong>
                    <Tag status={task.status} />
                  </div>
                  <dl className="cy-task-meta">
                    <div>
                      <dt>主理机构</dt>
                      <dd>{task.studio}</dd>
                    </div>
                    <div>
                      <dt>项目编号</dt>
                      <dd className="cy-mono">{task.code}</dd>
                    </div>
                    <div>
                      <dt>更新</dt>
                      <dd>{task.updated}</dd>
                    </div>
                  </dl>
                  <div className="cy-task-progress">
                    <span className="cy-bar">
                      <i style={{ width: `${task.progress}%` }} />
                    </span>
                    <b>{task.progress}%</b>
                  </div>
                </div>

                <span className="cy-icon-btn cy-task-go" aria-hidden="true">
                  <Icon name="arrow" size={15} />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {visible.length === 0 && <p className="cy-empty cy-body cy-muted">当前筛选条件下暂无任务。</p>}
      </main>
    </Shell>
  );
}
