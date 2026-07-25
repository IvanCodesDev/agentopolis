import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  Sparkles,
} from "lucide-react";

import type { Quest, QuestStatus } from "@/lib/demo/types";

const statusPresentation: Record<
  QuestStatus,
  { label: string; icon: typeof Sparkles; className: string }
> = {
  INVITED: {
    label: "INVITED · 等待回应",
    icon: Sparkles,
    className: "questStatusInvited",
  },
  ACCEPTED: {
    label: "ACCEPTED · 进行中",
    icon: CircleCheck,
    className: "questStatusSuccess",
  },
  SUBMITTED: {
    label: "SUBMITTED · 待签发",
    icon: CircleCheck,
    className: "questStatusInvited",
  },
  V1_SUBMITTED: {
    label: "V1 · 待反馈",
    icon: CircleCheck,
    className: "questStatusInvited",
  },
  REVISION_REQUESTED: {
    label: "REVISION · 修改中",
    icon: CircleCheck,
    className: "questStatusInvited",
  },
  V2_SUBMITTED: {
    label: "V2 · 待验收",
    icon: CircleCheck,
    className: "questStatusInvited",
  },
  APPROVED: {
    label: "APPROVED · 待签发",
    icon: CircleCheck,
    className: "questStatusSuccess",
  },
  ISSUED: {
    label: "ISSUED · 已铭刻",
    icon: BadgeCheck,
    className: "questStatusSuccess",
  },
  REVOKED: {
    label: "REVOKED · 已撤销",
    icon: CircleCheck,
    className: "textDangerButton",
  },
};

export function QuestRow({
  quest,
  onOpen,
}: {
  quest: Quest;
  onOpen?: (quest: Quest) => void;
}) {
  const status = statusPresentation[quest.status];
  const StatusIcon = status.icon;

  return (
    <article className="questRow">
      <div aria-hidden="true" className="questScroll">
        <span>{quest.status === "ISSUED" ? "✓" : "✦"}</span>
      </div>
      <div className="questSummary">
        <h2>{quest.title}</h2>
        <p>
          {quest.industry} · {quest.dueDate.slice(5).replace("-", "/")} 截止
        </p>
        <span className={`questStatus ${status.className}`}>
          <StatusIcon aria-hidden="true" size={12} />
          {status.label}
        </span>
      </div>
      <button
        aria-label={`查看任务 ${quest.title}`}
        className="questOpenButton"
        onClick={() => onOpen?.(quest)}
        type="button"
      >
        <ArrowRight aria-hidden="true" size={16} />
      </button>
    </article>
  );
}
