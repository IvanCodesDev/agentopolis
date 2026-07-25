"use client";

import { AlertTriangle, LoaderCircle, Plus, ScrollText } from "lucide-react";

import type { Quest, QuestFilter, QuestStatus } from "@/lib/demo/types";

import { QuestRow } from "./quest-row";

export type QuestBoardMode = "ready" | "loading" | "error";

interface QuestBoardProps {
  quests: Quest[];
  filter: QuestFilter;
  mode?: QuestBoardMode;
  onFilterChange: (filter: QuestFilter) => void;
  onCreate?: () => void;
  onOpenQuest?: (quest: Quest) => void;
}

const filters: Array<{ id: QuestFilter; label: string }> = [
  { id: "ALL", label: "全部" },
  { id: "INVITED", label: "待接受" },
  { id: "ACCEPTED", label: "进行中" },
  { id: "ISSUED", label: "已完成" },
];

function countFor(quests: Quest[], filter: QuestFilter) {
  if (filter === "ACCEPTED") {
    return quests.filter(
      (quest) => quest.status === "ACCEPTED" || quest.status === "SUBMITTED",
    ).length;
  }
  return filter === "ALL"
    ? quests.length
    : quests.filter((quest) => quest.status === filter).length;
}

export function QuestBoard({
  quests,
  filter,
  mode = "ready",
  onFilterChange,
  onCreate,
  onOpenQuest,
}: QuestBoardProps) {
  const visibleQuests =
    filter === "ALL"
      ? quests
      : quests.filter((quest) =>
          filter === "ACCEPTED"
            ? quest.status === "ACCEPTED" || quest.status === "SUBMITTED"
            : quest.status === (filter as QuestStatus),
        );

  return (
    <section className="questBoard" aria-label="公会任务">
      <div className="questBoardIntro">
        <div>
          <strong>{quests.length} 项任务</strong>
          <span>等待你在公会中处理</span>
        </div>
        <ScrollText aria-hidden="true" size={22} />
      </div>

      <div className="questFilters" aria-label="任务筛选">
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.id}
            className={filter === item.id ? "questFilterActive" : undefined}
            key={item.id}
            onClick={() => onFilterChange(item.id)}
            type="button"
          >
            {item.label} {countFor(quests, item.id)}
          </button>
        ))}
      </div>

      <div className="questList" aria-live="polite">
        {mode === "loading" ? (
          <div className="questState">
            <LoaderCircle aria-hidden="true" className="spin" size={24} />
            <strong>正在读取公会卷轴…</strong>
            <p>正在同步本地演示任务。</p>
          </div>
        ) : null}
        {mode === "error" ? (
          <div className="questState questStateError">
            <AlertTriangle aria-hidden="true" size={24} />
            <strong>任务读取失败</strong>
            <p>演示数据暂时无法读取，请重新尝试。</p>
            <button type="button">重新读取</button>
          </div>
        ) : null}
        {mode === "ready" && visibleQuests.length === 0 ? (
          <div className="questState">
            <ScrollText aria-hidden="true" size={24} />
            <strong>公告板上暂时没有任务</strong>
            <p>切换筛选，或发布一项新的匿名委托。</p>
          </div>
        ) : null}
        {mode === "ready"
          ? visibleQuests.map((quest) => (
              <QuestRow
                key={quest.id}
                onOpen={onOpenQuest}
                quest={quest}
              />
            ))
          : null}
      </div>

      {onCreate ? (
        <div className="questBoardFooter">
          <button className="createQuestButton" onClick={onCreate} type="button">
            <Plus aria-hidden="true" size={17} />
            发布新任务
          </button>
        </div>
      ) : null}
    </section>
  );
}
