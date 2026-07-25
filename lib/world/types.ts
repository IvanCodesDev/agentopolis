import type {
  DemoRole,
  PlayerPosition,
  StoryStage,
} from "@/lib/demo/types";

export type WorldLocationId =
  | "home"
  | "guild"
  | "workshop"
  | "feedback"
  | "altar"
  | "archive"
  | "hr"
  | "monument";

export type WorldDirection = "up" | "down" | "left" | "right";

export interface WorldGameOptions {
  parent: HTMLElement;
  actor: DemoRole;
  stage: StoryStage;
  initialPosition: PlayerPosition;
  onInteract: (locationId: WorldLocationId) => void;
  onNearestLocationChange: (locationId: WorldLocationId | null) => void;
  onPositionChange: (position: PlayerPosition) => void;
  onReady: () => void;
  onError: (error: Error) => void;
}

export interface WorldGameHandle {
  destroy: () => void;
  setDirection: (direction: WorldDirection, active: boolean) => void;
  interact: () => void;
  updateContext: (actor: DemoRole, stage: StoryStage) => void;
}
