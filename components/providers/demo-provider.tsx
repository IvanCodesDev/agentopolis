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
import { createSeedSnapshot } from "@/lib/demo/seed";
import type {
  DemoCredential,
  DemoRole,
  DemoSnapshot,
  Quest,
  QuestFilter,
  QuestSubmission,
  WalletDemoState,
} from "@/lib/demo/types";
import type { CreateQuestInput } from "@/lib/demo/validation";

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
}

const DemoContext = createContext<DemoContextValue | null>(null);

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
        return {
          ...current,
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
          quest?.status !== "SUBMITTED" ||
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
        };

        return {
          ...current,
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
      addQuest,
      issueCredential,
      resetDemo,
      revokeCredential,
      selectedQuest,
      selectQuest: setSelectedQuestId,
      snapshot,
      setFilter,
      setRole,
      setWalletState,
      submitQuest,
    }),
    [
      acceptQuest,
      addQuest,
      issueCredential,
      resetDemo,
      revokeCredential,
      selectedQuest,
      snapshot,
      setFilter,
      setRole,
      setWalletState,
      submitQuest,
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
