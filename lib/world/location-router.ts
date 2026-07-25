import type { DemoRole, StoryStage } from "@/lib/demo/types";
import type { PanelId } from "@/components/world/floating-action-rail";
import type { WorldLocationId } from "@/lib/world/types";

export type WorkspaceMode =
  | "intro"
  | "invite"
  | "quest-board"
  | "accept"
  | "submit-v1"
  | "revision"
  | "submit-v2"
  | "review-v1"
  | "approve-v2"
  | "issue"
  | "passport"
  | "verify"
  | "credential"
  | "demo-state";

export interface WorldWorkspaceIntent {
  panel: PanelId | null;
  mode?: WorkspaceMode;
  requiredRole?: DemoRole;
  message?: string;
}

export function resolveWorldLocation(
  location: WorldLocationId,
  role: DemoRole,
  stage: StoryStage,
): WorldWorkspaceIntent {
  if (location === "home") {
    return stage === "INTRO"
      ? { panel: "current", mode: "intro" }
      : { panel: "passport", mode: "passport" };
  }

  if (location === "guild") {
    if (stage === "TASK_CREATED") {
      return role === "guild"
        ? { panel: "current", mode: "invite" }
        : {
            panel: null,
            requiredRole: "guild",
            message: "请切换至公会视角创建匿名邀请",
          };
    }
    if (stage === "DESIGNER_INVITED") {
      return role === "designer"
        ? { panel: "current", mode: "accept" }
        : {
            panel: null,
            requiredRole: "designer",
            message: "请切换至设计师视角接受匿名委托",
          };
    }
    return { panel: "quests", mode: "quest-board" };
  }

  if (location === "workshop") {
    if (role !== "designer") {
      return {
        panel: null,
        requiredRole: "designer",
        message: "只有设计师可以提交成果版本",
      };
    }
    if (stage === "QUEST_ACCEPTED") {
      return { panel: "current", mode: "submit-v1" };
    }
    if (stage === "REVISION_REQUESTED") {
      return { panel: "current", mode: "submit-v2" };
    }
    return { panel: "current", mode: "accept" };
  }

  if (location === "feedback") {
    return role === "designer"
      ? { panel: "current", mode: "revision" }
      : {
          panel: null,
          requiredRole: "designer",
          message: "请切换至设计师视角查看修改意见",
        };
  }

  if (location === "altar") {
    if (role !== "guild") {
      return {
        panel: null,
        requiredRole: "guild",
        message: "请切换至公会视角完成验收与签发",
      };
    }
    if (stage === "V1_SUBMITTED") {
      return { panel: "current", mode: "review-v1" };
    }
    if (stage === "V2_SUBMITTED") {
      return { panel: "current", mode: "approve-v2" };
    }
    return { panel: "current", mode: "issue" };
  }

  if (location === "archive") {
    return role === "designer"
      ? { panel: "passport", mode: "passport" }
      : {
          panel: null,
          requiredRole: "designer",
          message: "请切换至设计师视角管理冒险护照",
        };
  }

  if (location === "hr") {
    return role === "hr"
      ? { panel: "quests", mode: "verify" }
      : {
          panel: null,
          requiredRole: "hr",
          message: "请切换至 HR 视角进行公开核验",
        };
  }

  return { panel: "passport", mode: "credential" };
}

export function shortcutLocation(
  panel: PanelId,
  role: DemoRole,
  stage: StoryStage = "INTRO",
): WorldLocationId {
  if (panel === "chain") return "monument";
  if (panel === "passport") return role === "hr" ? "hr" : "archive";
  if (panel === "current") {
    if (role === "designer" && stage === "INTRO") return "home";
    return role === "guild" ? "altar" : role === "hr" ? "hr" : "workshop";
  }
  return role === "hr" ? "hr" : "guild";
}
