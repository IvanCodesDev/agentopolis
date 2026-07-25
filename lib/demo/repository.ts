import { createSeedSnapshot } from "./seed";
import type {
  DemoCredential,
  DemoRole,
  DemoSnapshot,
  QuestFilter,
  StoryStage,
  WalletDemoState,
} from "./types";

export const DEMO_STORAGE_KEY = "proof-of-quest.demo.v1";

const walletStates = new Set<WalletDemoState>([
  "disconnected",
  "connected",
  "wrong-network",
]);
const filters = new Set<QuestFilter>([
  "ALL",
  "INVITED",
  "ACCEPTED",
  "SUBMITTED",
  "V1_SUBMITTED",
  "REVISION_REQUESTED",
  "V2_SUBMITTED",
  "APPROVED",
  "ISSUED",
  "REVOKED",
]);
const roles = new Set<DemoRole>(["designer", "guild", "hr"]);
const storyStages = new Set<StoryStage>([
  "INTRO",
  "TASK_CREATED",
  "DESIGNER_INVITED",
  "QUEST_ACCEPTED",
  "V1_SUBMITTED",
  "REVISION_REQUESTED",
  "V2_SUBMITTED",
  "WORK_APPROVED",
  "ATTESTING",
  "CREDENTIAL_ISSUED",
  "PORTFOLIO_SHARED",
  "HR_VERIFIED",
  "CREDENTIAL_REVOKED",
]);

function isDemoSnapshot(value: unknown): value is DemoSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DemoSnapshot>;
  return (
    Array.isArray(candidate.quests) &&
    walletStates.has(candidate.walletState as WalletDemoState) &&
    filters.has(candidate.filter as QuestFilter)
  );
}

export function loadDemoSnapshot(storage?: Storage): DemoSnapshot {
  const fallback = createSeedSnapshot();
  if (!storage) return fallback;

  try {
    const saved = storage.getItem(DEMO_STORAGE_KEY);
    if (!saved) return fallback;
    const parsed: unknown = JSON.parse(saved);
    if (!isDemoSnapshot(parsed)) return fallback;
    const credentials: DemoCredential[] = Array.isArray(parsed.credentials)
      ? parsed.credentials.map((credential) => ({
          ...credential,
          status: credential.status === "REVOKED" ? "REVOKED" : "VALID",
          inPassport: credential.inPassport ?? false,
          verificationCount: credential.verificationCount ?? 0,
        }))
      : [];
    const inferredStage: StoryStage =
      credentials.length > 0 ? "CREDENTIAL_ISSUED" : "INTRO";
    return {
      ...fallback,
      ...parsed,
      schemaVersion: 2,
      storyStage:
        parsed.schemaVersion === 2 &&
        storyStages.has(parsed.storyStage as StoryStage)
        ? (parsed.storyStage as StoryStage)
        : inferredStage,
      activeQuestId:
        typeof parsed.activeQuestId === "string"
          ? parsed.activeQuestId
          : fallback.activeQuestId,
      project: {
        ...fallback.project,
        ...(parsed.project && typeof parsed.project === "object"
          ? parsed.project
          : {}),
      },
      playerPosition:
        parsed.playerPosition &&
        typeof parsed.playerPosition.x === "number" &&
        typeof parsed.playerPosition.y === "number"
          ? { ...parsed.playerPosition }
          : { ...fallback.playerPosition },
      currentRole: roles.has(parsed.currentRole as DemoRole)
        ? parsed.currentRole
        : "designer",
      quests: parsed.quests.map((quest) => ({
        ...quest,
        submission: quest.submission ? { ...quest.submission } : undefined,
      })),
      credentials,
    };
  } catch {
    return fallback;
  }
}

export function findCredential(
  snapshot: DemoSnapshot,
  id: string,
): DemoCredential | undefined {
  return snapshot.credentials.find((credential) => credential.id === id);
}

export function saveDemoSnapshot(
  snapshot: DemoSnapshot,
  storage?: Storage,
): void {
  if (!storage) return;
  try {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Demo state remains usable in memory when persistence is unavailable.
  }
}

export function resetDemoSnapshot(storage?: Storage): DemoSnapshot {
  const fresh = createSeedSnapshot();
  if (!storage) return fresh;
  try {
    storage.removeItem(DEMO_STORAGE_KEY);
    saveDemoSnapshot(fresh, storage);
  } catch {
    // Reset still succeeds in memory when storage is unavailable.
  }
  return fresh;
}
