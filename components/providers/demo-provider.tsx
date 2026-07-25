"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  loadDemoSnapshot,
  resetDemoSnapshot,
  saveDemoSnapshot,
} from "@/lib/demo/repository";
import { createEvidenceHash } from "@/lib/demo/evidence";
import { createSeedSnapshot } from "@/lib/demo/seed";
import type {
  DemoCredential,
  DemoRole,
  DemoSnapshot,
  Quest,
  QuestFilter,
  QuestSubmission,
  PlayerPosition,
  WalletDemoState,
} from "@/lib/demo/types";
import type { CreateQuestInput } from "@/lib/demo/validation";

export type DemoActionResult =
  | { ok: true }
  | { ok: false; message: string };

interface DemoContextValue {
  snapshot: DemoSnapshot;
  setFilter: (filter: QuestFilter) => void;
  setWalletState: (state: WalletDemoState) => void;
  addQuest: (input: CreateQuestInput) => Quest;
  selectedQuest?: Quest;
  selectQuest: (id: string) => void;
  acceptQuest: (id: string) => void;
  submitQuest: (id: string, submission: QuestSubmission) => void;
  issueCredential: (id: string) => DemoCredential;
  revokeCredential: (id: string) => DemoCredential;
  resetDemo: () => void;
  setRole: (role: DemoRole) => void;
  startStory: () => DemoActionResult;
  inviteDesigner: () => DemoActionResult;
  submitVersion: (
    id: string,
    version: 1 | 2,
    submission: QuestSubmission,
  ) => Promise<DemoActionResult>;
  requestRevision: (id: string, feedback: string) => DemoActionResult;
  approveQuest: (id: string) => DemoActionResult;
  addCredentialToPassport: (id: string) => DemoActionResult;
  verifyCredential: (id: string) => DemoActionResult;
  savePlayerPosition: (position: PlayerPosition) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const accepted: DemoActionResult = { ok: true };

function rejected(message: string): DemoActionResult {
  return { ok: false, message };
}

export function DemoProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot>(createSeedSnapshot);
  const snapshotRef = useRef<DemoSnapshot>(createSeedSnapshot());
  const [selectedQuestId, setSelectedQuestId] = useState<string>();

  useEffect(() => {
    const restored = loadDemoSnapshot(window.localStorage);
    snapshotRef.current = restored;
    setSnapshot(restored);
  }, []);

  const updateSnapshot = useCallback(
    (updater: (current: DemoSnapshot) => DemoSnapshot) => {
      const next = updater(snapshotRef.current);
      snapshotRef.current = next;
      saveDemoSnapshot(next, window.localStorage);
      setSnapshot(next);
    },
    [],
  );

  const setFilter = useCallback(
    (filter: QuestFilter) => {
      updateSnapshot((current) => ({ ...current, filter }));
    },
    [updateSnapshot],
  );

  const setWalletState = useCallback(
    (walletState: WalletDemoState) => {
      updateSnapshot((current) => ({ ...current, walletState }));
    },
    [updateSnapshot],
  );

  const setRole = useCallback(
    (currentRole: DemoRole) => {
      updateSnapshot((current) => ({ ...current, currentRole }));
    },
    [updateSnapshot],
  );

  const startStory = useCallback(() => {
    let result: DemoActionResult = rejected("当前无法开始故事");
    updateSnapshot((current) => {
      if (
        current.currentRole !== "designer" ||
        current.storyStage !== "INTRO"
      ) {
        return current;
      }
      result = accepted;
      return { ...current, storyStage: "TASK_CREATED" };
    });
    return result;
  }, [updateSnapshot]);

  const inviteDesigner = useCallback(() => {
    let result: DemoActionResult = rejected("请以公会身份创建邀请");
    updateSnapshot((current) => {
      if (
        current.currentRole !== "guild" ||
        current.storyStage !== "TASK_CREATED"
      ) {
        return current;
      }
      result = accepted;
      return { ...current, storyStage: "DESIGNER_INVITED" };
    });
    return result;
  }, [updateSnapshot]);

  const addQuest = useCallback(
    (input: CreateQuestInput) => {
      let createdQuest: Quest | null = null;
      updateSnapshot((current) => {
        if (current.currentRole !== "guild") return current;
        const nextNumber =
          Math.max(
            ...current.quests.map((quest) =>
              Number.parseInt(quest.id.replace(/\D/g, ""), 10),
            ),
          ) + 1;
        createdQuest = {
          id: `PQ-${nextNumber}`,
          title: `${input.category} · ${input.role}`,
          industry: "匿名项目",
          category: input.category,
          role: input.role,
          startDate: input.startDate,
          dueDate: input.dueDate,
          confidentiality: input.confidentiality,
          summary: input.summary,
          recipient: input.recipient,
          status: "INVITED",
          createdByUser: true,
        };
        return {
          ...current,
          filter: "ALL",
          quests: [...current.quests, createdQuest],
        };
      });
      return createdQuest as unknown as Quest;
    },
    [updateSnapshot],
  );

  const acceptQuest = useCallback(
    (id: string) => {
      updateSnapshot((current) => {
        if (current.currentRole !== "designer") return current;
        const canAdvanceStory =
          current.storyStage === "DESIGNER_INVITED" &&
          id === current.activeQuestId;
        return {
          ...current,
          storyStage: canAdvanceStory
            ? "QUEST_ACCEPTED"
            : current.storyStage,
          quests: current.quests.map((quest) =>
            quest.id === id && quest.status === "INVITED"
              ? { ...quest, status: "ACCEPTED" }
              : quest,
          ),
        };
      });
    },
    [updateSnapshot],
  );

  const submitVersion = useCallback(
    async (
      id: string,
      version: 1 | 2,
      submission: QuestSubmission,
    ): Promise<DemoActionResult> => {
      const current = snapshotRef.current;
      const expectedStage =
        version === 1 ? "QUEST_ACCEPTED" : "REVISION_REQUESTED";
      const expectedStatus =
        version === 1 ? "ACCEPTED" : "REVISION_REQUESTED";
      const quest = current.quests.find((item) => item.id === id);
      if (
        current.currentRole !== "designer" ||
        current.storyStage !== expectedStage ||
        quest?.status !== expectedStatus
      ) {
        return rejected(
          version === 1
            ? "请先接受主线任务"
            : "请先查看公会的修改意见",
        );
      }
      const evidenceHash = await createEvidenceHash(
        id,
        version,
        submission.fileName,
        submission.publicSummary,
      );
      updateSnapshot((latest) => ({
        ...latest,
        storyStage: version === 1 ? "V1_SUBMITTED" : "V2_SUBMITTED",
        project: {
          ...latest.project,
          currentVersion: version,
          evidenceHash,
          ...(version === 1
            ? { v1EvidenceHash: evidenceHash }
            : { v2EvidenceHash: evidenceHash }),
        },
        quests: latest.quests.map((item) =>
          item.id === id
            ? {
                ...item,
                status:
                  version === 1 ? "V1_SUBMITTED" : "V2_SUBMITTED",
                submission: { ...submission, version, evidenceHash },
              }
            : item,
        ),
      }));
      return accepted;
    },
    [updateSnapshot],
  );

  const requestRevision = useCallback(
    (id: string, feedback: string) => {
      let result: DemoActionResult = rejected("当前没有等待反馈的 V1");
      updateSnapshot((current) => {
        const quest = current.quests.find((item) => item.id === id);
        if (
          current.currentRole !== "guild" ||
          current.storyStage !== "V1_SUBMITTED" ||
          quest?.status !== "V1_SUBMITTED"
        ) {
          return current;
        }
        result = accepted;
        return {
          ...current,
          storyStage: "REVISION_REQUESTED",
          project: { ...current.project, revisionFeedback: feedback },
          quests: current.quests.map((item) =>
            item.id === id
              ? { ...item, status: "REVISION_REQUESTED" }
              : item,
          ),
        };
      });
      return result;
    },
    [updateSnapshot],
  );

  const approveQuest = useCallback(
    (id: string) => {
      let result: DemoActionResult = rejected("当前没有等待验收的 V2");
      updateSnapshot((current) => {
        const quest = current.quests.find((item) => item.id === id);
        if (
          current.currentRole !== "guild" ||
          current.storyStage !== "V2_SUBMITTED" ||
          quest?.status !== "V2_SUBMITTED"
        ) {
          return current;
        }
        result = accepted;
        return {
          ...current,
          storyStage: "WORK_APPROVED",
          quests: current.quests.map((item) =>
            item.id === id ? { ...item, status: "APPROVED" } : item,
          ),
        };
      });
      return result;
    },
    [updateSnapshot],
  );

  const submitQuest = useCallback(
    (id: string, submission: QuestSubmission) => {
      updateSnapshot((current) => {
        if (current.currentRole !== "designer") return current;
        return {
          ...current,
          quests: current.quests.map((quest) =>
            quest.id === id && quest.status === "ACCEPTED"
              ? {
                  ...quest,
                  status: "SUBMITTED",
                  submission: { ...submission },
                }
              : quest,
          ),
        };
      });
    },
    [updateSnapshot],
  );

  const issueCredential = useCallback(
    (id: string) => {
      let issuedCredential: DemoCredential | undefined;
      updateSnapshot((current) => {
        const quest = current.quests.find((item) => item.id === id);
        if (
          current.currentRole !== "guild" ||
          (quest?.status !== "SUBMITTED" && quest?.status !== "APPROVED") ||
          !quest.submission
        ) {
          throw new Error("Quest must be submitted before issuing");
        }

        const issuedAt = new Date().toISOString();
        const credentialId = `PQ-${id.replace(/\D/g, "")}-${Date.now()
          .toString(36)
          .toUpperCase()}`;
        const hashSeed = `${id}-${issuedAt}-${quest.recipient}`;
        const hashBody = Array.from(hashSeed)
          .map((character) => character.charCodeAt(0).toString(16))
          .join("")
          .repeat(2)
          .slice(0, 64)
          .padEnd(64, "0");
        issuedCredential = {
          id: credentialId,
          questId: quest.id,
          category: quest.category,
          role: quest.role,
          publicSummary: quest.submission.publicSummary,
          issuer: "0xA71C3A00000000000000000000000000000084F2",
          recipient: quest.recipient,
          issuedAt,
          transactionHash: `0x${hashBody}`,
          status: "VALID",
          evidenceHash:
            quest.submission.evidenceHash ?? current.project.v2EvidenceHash,
          inPassport: false,
          verificationCount: 0,
        };

        return {
          ...current,
          storyStage:
            current.storyStage === "WORK_APPROVED"
              ? "CREDENTIAL_ISSUED"
              : current.storyStage,
          credentials: [...current.credentials, issuedCredential],
          quests: current.quests.map((item) =>
            item.id === id
              ? { ...item, status: "ISSUED", credentialId }
              : item,
          ),
        };
      });
      return issuedCredential as DemoCredential;
    },
    [updateSnapshot],
  );

  const addCredentialToPassport = useCallback(
    (id: string) => {
      let result: DemoActionResult = rejected("当前没有可加入护照的凭证");
      updateSnapshot((current) => {
        const credential = current.credentials.find((item) => item.id === id);
        if (
          current.currentRole !== "designer" ||
          current.storyStage !== "CREDENTIAL_ISSUED" ||
          credential?.status !== "VALID"
        ) {
          return current;
        }
        result = accepted;
        return {
          ...current,
          storyStage: "PORTFOLIO_SHARED",
          credentials: current.credentials.map((item) =>
            item.id === id ? { ...item, inPassport: true } : item,
          ),
        };
      });
      return result;
    },
    [updateSnapshot],
  );

  const verifyCredential = useCallback(
    (id: string) => {
      let result: DemoActionResult = rejected("当前凭证尚未公开");
      updateSnapshot((current) => {
        const credential = current.credentials.find((item) => item.id === id);
        if (
          current.currentRole !== "hr" ||
          current.storyStage !== "PORTFOLIO_SHARED" ||
          !credential?.inPassport
        ) {
          return current;
        }
        result = accepted;
        return {
          ...current,
          storyStage: "HR_VERIFIED",
          credentials: current.credentials.map((item) =>
            item.id === id
              ? {
                  ...item,
                  verificationCount: (item.verificationCount ?? 0) + 1,
                }
              : item,
          ),
        };
      });
      return result;
    },
    [updateSnapshot],
  );

  const savePlayerPosition = useCallback(
    (playerPosition: PlayerPosition) => {
      updateSnapshot((current) => ({ ...current, playerPosition }));
    },
    [updateSnapshot],
  );

  const revokeCredential = useCallback(
    (id: string) => {
      let revokedCredential: DemoCredential | undefined;
      updateSnapshot((current) => {
        const credential = current.credentials.find((item) => item.id === id);
        if (
          current.currentRole !== "guild" ||
          credential?.status !== "VALID"
        ) {
          throw new Error("Only a valid credential can be revoked");
        }
        const revokedAt = new Date().toISOString();
        revokedCredential = {
          ...credential,
          status: "REVOKED",
          revokedAt,
          revocationReason: "演示撤销：贡献记录状态更新",
        };
        return {
          ...current,
          storyStage:
            current.storyStage === "HR_VERIFIED" ||
            current.storyStage === "PORTFOLIO_SHARED" ||
            current.storyStage === "CREDENTIAL_ISSUED"
              ? "CREDENTIAL_REVOKED"
              : current.storyStage,
          credentials: current.credentials.map((item) =>
            item.id === id ? revokedCredential! : item,
          ),
          quests: current.quests.map((quest) =>
            quest.id === credential.questId && quest.status === "ISSUED"
              ? { ...quest, status: "REVOKED" }
              : quest,
          ),
        };
      });
      return revokedCredential as DemoCredential;
    },
    [updateSnapshot],
  );

  const resetDemo = useCallback(() => {
    const fresh = resetDemoSnapshot(window.localStorage);
    snapshotRef.current = fresh;
    setSnapshot(fresh);
    setSelectedQuestId(undefined);
  }, []);

  const selectedQuest = snapshot.quests.find(
    (quest) => quest.id === selectedQuestId,
  );

  const value = useMemo(
    () => ({
      acceptQuest,
      addCredentialToPassport,
      addQuest,
      approveQuest,
      inviteDesigner,
      issueCredential,
      resetDemo,
      revokeCredential,
      requestRevision,
      savePlayerPosition,
      selectedQuest,
      selectQuest: setSelectedQuestId,
      snapshot,
      setFilter,
      setRole,
      setWalletState,
      startStory,
      submitQuest,
      submitVersion,
      verifyCredential,
    }),
    [
      acceptQuest,
      addCredentialToPassport,
      addQuest,
      approveQuest,
      inviteDesigner,
      issueCredential,
      resetDemo,
      revokeCredential,
      requestRevision,
      savePlayerPosition,
      selectedQuest,
      snapshot,
      setFilter,
      setRole,
      setWalletState,
      startStory,
      submitQuest,
      submitVersion,
      verifyCredential,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemo must be used inside DemoProvider");
  }
  return value;
}
