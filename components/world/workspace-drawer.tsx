"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import type { PanelId } from "./floating-action-rail";

const panelTitles: Record<PanelId, string> = {
  quests: "冒险公告板",
  current: "当前任务",
  passport: "冒险护照",
  chain: "链上状态",
};

interface WorkspaceDrawerProps {
  activePanel: PanelId;
  children: ReactNode;
  onClose: () => void;
  title?: string;
}

export function WorkspaceDrawer({
  activePanel,
  children,
  onClose,
  title: customTitle,
}: WorkspaceDrawerProps) {
  const title = customTitle ?? panelTitles[activePanel];
  const titleId = `workspace-title-${activePanel}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      aria-labelledby={titleId}
      className="workspaceDrawer"
      id="workspace-drawer"
      role="dialog"
    >
      <header className="drawerHeader">
        <div>
          <p className="drawerKicker">PROOF OF QUEST · DEMO</p>
          <h1 id={titleId}>{title}</h1>
        </div>
        <button
          aria-label={`关闭${title}`}
          className="drawerClose"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </header>
      <div className="drawerBody">{children}</div>
    </aside>
  );
}
