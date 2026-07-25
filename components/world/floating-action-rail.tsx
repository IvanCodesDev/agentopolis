"use client";

import {
  BadgeCheck,
  Blocks,
  ScrollText,
  Swords,
  type LucideIcon,
} from "lucide-react";
import type { MouseEvent } from "react";

import type { DemoRole } from "@/lib/demo/types";

export type PanelId = "quests" | "current" | "passport" | "chain";

interface RailItem {
  id: PanelId;
  label: string;
  icon: LucideIcon;
}

const railItems: Record<DemoRole, RailItem[]> = {
  designer: [
    { id: "quests", label: "公告板", icon: ScrollText },
    { id: "current", label: "当前任务", icon: Swords },
    { id: "passport", label: "冒险护照", icon: BadgeCheck },
    { id: "chain", label: "演示状态", icon: Blocks },
  ],
  guild: [
    { id: "quests", label: "任务管理", icon: ScrollText },
    { id: "current", label: "待验收", icon: Swords },
    { id: "passport", label: "凭证管理", icon: BadgeCheck },
    { id: "chain", label: "演示状态", icon: Blocks },
  ],
  hr: [
    { id: "quests", label: "公开凭证", icon: ScrollText },
    { id: "current", label: "最新验证", icon: Swords },
    { id: "passport", label: "说明", icon: BadgeCheck },
    { id: "chain", label: "演示状态", icon: Blocks },
  ],
};

interface FloatingActionRailProps {
  activePanel: PanelId | null;
  onSelect: (panel: PanelId, trigger: HTMLButtonElement) => void;
  role: DemoRole;
}

export function FloatingActionRail({
  activePanel,
  onSelect,
  role,
}: FloatingActionRailProps) {
  return (
    <nav className="actionRail" aria-label="主要功能">
      {railItems[role].map(({ id, label, icon: Icon }) => {
        const isActive = activePanel === id;
        return (
          <button
            aria-controls="workspace-drawer"
            aria-expanded={isActive}
            className={isActive ? "railButton railButtonActive" : "railButton"}
            key={id}
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              onSelect(id, event.currentTarget)
            }
            type="button"
          >
            <span className="railIcon">
              <Icon aria-hidden="true" size={17} />
            </span>
            <span className="railLabel">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
