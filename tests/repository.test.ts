import {
  DEMO_STORAGE_KEY,
  findCredential,
  loadDemoSnapshot,
  resetDemoSnapshot,
  saveDemoSnapshot,
} from "@/lib/demo/repository";
import type { DemoSnapshot } from "@/lib/demo/types";

describe("demo repository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the three seed quests when no saved demo exists", () => {
    const snapshot = loadDemoSnapshot(localStorage);

    expect(snapshot.quests).toHaveLength(3);
    expect(snapshot.quests.map((quest) => quest.status)).toEqual([
      "INVITED",
      "ACCEPTED",
      "ISSUED",
    ]);
    expect(snapshot.walletState).toBe("disconnected");
    expect(snapshot.credentials).toEqual([]);
    expect(snapshot.currentRole).toBe("designer");
  });

  it("restores a saved created quest without duplicating the seeds", () => {
    const snapshot = loadDemoSnapshot(localStorage);
    snapshot.quests.push({
      id: "PQ-104",
      title: "插画设计 · 活动主视觉",
      industry: "匿名文化行业",
      category: "插画设计",
      role: "主视觉设计师",
      startDate: "2026-07-25",
      dueDate: "2026-08-03",
      confidentiality: 1,
      summary: "完成活动主视觉与两个延展尺寸",
      recipient: "0x1234567890123456789012345678901234567890",
      status: "INVITED",
      createdByUser: true,
    });
    saveDemoSnapshot(snapshot, localStorage);

    const restored = loadDemoSnapshot(localStorage);

    expect(restored.quests).toHaveLength(4);
    expect(restored.quests.at(-1)?.id).toBe("PQ-104");
  });

  it("falls back to safe seed data when persisted JSON is malformed", () => {
    localStorage.setItem(DEMO_STORAGE_KEY, "{invalid");

    expect(loadDemoSnapshot(localStorage).quests).toHaveLength(3);
  });

  it("falls back to memory-safe seed data when storage access throws", () => {
    const brokenStorage = {
      getItem: () => {
        throw new DOMException("blocked");
      },
      setItem: () => {
        throw new DOMException("blocked");
      },
    } as unknown as Storage;

    expect(loadDemoSnapshot(brokenStorage).walletState).toBe("disconnected");
    expect(() =>
      saveDemoSnapshot(loadDemoSnapshot(), brokenStorage),
    ).not.toThrow();
  });

  it("persists submitted quests and public credentials", () => {
    const snapshot = loadDemoSnapshot(localStorage);
    snapshot.quests[0] = {
      ...snapshot.quests[0],
      status: "SUBMITTED",
      submission: {
        publicSummary: "完成公开成果摘要",
        fileName: "final-layout.fig",
      },
    };
    snapshot.credentials.push({
      id: "PQ-CRED-001",
      questId: "PQ-101",
      category: "电商视觉",
      role: "详情页执行设计师",
      publicSummary: "完成公开成果摘要",
      issuer: "0x1111111111111111111111111111111111111111",
      recipient: "0x12ab3456789012345678901234567890123489ef",
      issuedAt: "2026-07-25T12:00:00.000Z",
      transactionHash:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      status: "REVOKED",
      revokedAt: "2026-07-26T12:00:00.000Z",
      revocationReason: "演示撤销：贡献记录状态更新",
    });

    saveDemoSnapshot(snapshot, localStorage);
    const restored = loadDemoSnapshot(localStorage);

    expect(restored.quests[0].status).toBe("SUBMITTED");
    expect(restored.credentials[0].id).toBe("PQ-CRED-001");
    expect(restored.credentials[0].status).toBe("REVOKED");
    expect(restored.credentials[0].revocationReason).toBe(
      "演示撤销：贡献记录状态更新",
    );
    expect(findCredential(restored, "PQ-CRED-001")?.questId).toBe("PQ-101");
    expect(findCredential(restored, "missing")).toBeUndefined();
  });

  it("migrates an older saved snapshot without credentials", () => {
    const legacySnapshot = loadDemoSnapshot();
    const { credentials: _credentials, ...withoutCredentials } = legacySnapshot;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(withoutCredentials));

    expect(loadDemoSnapshot(localStorage).credentials).toEqual([]);
  });

  it("migrates legacy role and credential status fields", () => {
    const legacySnapshot = loadDemoSnapshot();
    const { currentRole: _role, ...withoutRole } = legacySnapshot;
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        ...withoutRole,
        credentials: [
          {
            id: "PQ-LEGACY",
            questId: "PQ-101",
            category: "电商视觉",
            role: "详情页执行设计师",
            publicSummary: "历史贡献",
            issuer: "0xA71C3A00000000000000000000000000000084F2",
            recipient: "0x12ab3456789012345678901234567890123489ef",
            issuedAt: "2026-07-25T12:00:00.000Z",
            transactionHash:
              "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
        ],
      }),
    );

    const restored = loadDemoSnapshot(localStorage);

    expect(restored.currentRole).toBe("designer");
    expect(restored.credentials[0].status).toBe("VALID");
  });

  it("migrates a v1 snapshot into the intro story schema", () => {
    const legacy = loadDemoSnapshot();
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        quests: legacy.quests,
        credentials: legacy.credentials,
        currentRole: legacy.currentRole,
        walletState: legacy.walletState,
        filter: legacy.filter,
      }),
    );

    const restored = loadDemoSnapshot(localStorage) as DemoSnapshot & {
      schemaVersion?: number;
      storyStage?: string;
      project?: { currentVersion?: number };
      playerPosition?: { x: number; y: number };
    };

    expect(restored.schemaVersion).toBe(2);
    expect(restored.storyStage).toBe("INTRO");
    expect(restored.project?.currentVersion).toBe(0);
    expect(restored.playerPosition).toEqual({ x: 210, y: 410 });
  });

  it("infers an issued stage from a legacy credential", () => {
    const legacy = loadDemoSnapshot();
    const {
      schemaVersion: _schemaVersion,
      storyStage: _storyStage,
      project: _project,
      playerPosition: _playerPosition,
      activeQuestId: _activeQuestId,
      ...legacyFields
    } = legacy;
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        ...legacyFields,
        credentials: [
          {
            id: "PQ-LEGACY-STORY",
            questId: "PQ-103",
            category: "UI 界面",
            role: "主设计师",
            publicSummary: "完成数据看板设计",
            issuer: "0xissuer",
            recipient: "0xrecipient",
            issuedAt: "2026-07-25T00:00:00.000Z",
            transactionHash: "0xhash",
            status: "VALID",
          },
        ],
      }),
    );

    const restored = loadDemoSnapshot(localStorage) as DemoSnapshot & {
      storyStage?: string;
    };

    expect(restored.storyStage).toBe("CREDENTIAL_ISSUED");
  });

  it("resets only the demo snapshot to fresh seed data", () => {
    const snapshot = loadDemoSnapshot();
    snapshot.currentRole = "guild";
    snapshot.credentials.push({
      id: "PQ-RESET",
      questId: "PQ-101",
      category: "电商视觉",
      role: "详情页执行设计师",
      publicSummary: "待清除贡献",
      issuer: "0xA71C3A00000000000000000000000000000084F2",
      recipient: "0x12ab3456789012345678901234567890123489ef",
      issuedAt: "2026-07-25T12:00:00.000Z",
      transactionHash:
        "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      status: "VALID",
    });
    saveDemoSnapshot(snapshot, localStorage);
    localStorage.setItem("unrelated-key", "keep");

    const reset = resetDemoSnapshot(localStorage);

    expect(reset.currentRole).toBe("designer");
    expect(reset.quests).toHaveLength(3);
    expect(reset.credentials).toEqual([]);
    expect(localStorage.getItem("unrelated-key")).toBe("keep");
  });
});
