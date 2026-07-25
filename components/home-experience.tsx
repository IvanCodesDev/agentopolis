"use client";

import { useCallback, useRef, useState } from "react";

import { ChainStatePanel } from "@/components/panels/chain-state-panel";
import { CredentialManagementPanel } from "@/components/panels/credential-management-panel";
import { CurrentQuestPanel } from "@/components/panels/current-quest-panel";
import { GuildReviewPanel } from "@/components/panels/guild-review-panel";
import { PassportPreviewPanel } from "@/components/panels/passport-preview-panel";
import { PublicCredentialsPanel } from "@/components/panels/public-credentials-panel";
import { CreateQuestForm } from "@/components/quests/create-quest-form";
import { QuestBoard } from "@/components/quests/quest-board";
import {
  DemoProvider,
  useDemo,
} from "@/components/providers/demo-provider";
import { ChainStatusBar } from "@/components/world/chain-status-bar";
import {
  FloatingActionRail,
  type PanelId,
} from "@/components/world/floating-action-rail";
import { PixelWorldView } from "@/components/world/pixel-world-view";
import { SceneHud } from "@/components/world/scene-hud";
import { WorkspaceDrawer } from "@/components/world/workspace-drawer";
import { WorldHeader } from "@/components/world/world-header";

export function HomeExperience() {
  return (
    <DemoProvider>
      <HomeExperienceContent />
    </DemoProvider>
  );
}

function HomeExperienceContent() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [isCreatingQuest, setIsCreatingQuest] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [questPinned, setQuestPinned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const {
    acceptQuest,
    addQuest,
    issueCredential,
    resetDemo,
    revokeCredential,
    selectedQuest,
    selectQuest,
    snapshot,
    setFilter,
    setRole,
    setWalletState,
    submitQuest,
  } = useDemo();
  const currentQuest =
    selectedQuest ??
    snapshot.quests.find(
      (quest) =>
        quest.status === "ACCEPTED" || quest.status === "SUBMITTED",
    );
  const currentCredential = currentQuest?.credentialId
    ? snapshot.credentials.find(
        (credential) => credential.id === currentQuest.credentialId,
      )
    : undefined;
  const reviewQuest =
    (selectedQuest?.status === "SUBMITTED" ? selectedQuest : undefined) ??
    snapshot.quests.find((quest) => quest.status === "SUBMITTED");
  const drawerTitles = {
    designer: {
      quests: "冒险公告板",
      current: "当前任务",
      passport: "冒险护照",
      chain: "演示状态",
    },
    guild: {
      quests: "公会任务管理",
      current: "待验收成果",
      passport: "凭证管理",
      chain: "演示状态",
    },
    hr: {
      quests: "公开凭证",
      current: "最新验证",
      passport: "查验说明",
      chain: "演示状态",
    },
  } as const;

  const closePanel = useCallback(() => {
    setActivePanel(null);
    setIsCreatingQuest(false);
    lastTrigger.current?.focus();
  }, []);

  const selectPanel = useCallback(
    (panel: PanelId, trigger: HTMLButtonElement) => {
      lastTrigger.current = trigger;
      if (panel === activePanel) {
        closePanel();
        return;
      }
      setActivePanel(panel);
    },
    [activePanel, closePanel],
  );

  const handleWalletAction = useCallback(() => {
    if (snapshot.walletState === "disconnected") {
      setWalletState("connected");
      setAnnouncement("模拟钱包已连接");
      return;
    }
    if (snapshot.walletState === "connected") {
      setWalletState("wrong-network");
      setAnnouncement("已切换为错误网络演示状态");
      return;
    }
    setWalletState("connected");
    setAnnouncement("已切换到 Monad Testnet");
  }, [setWalletState, snapshot.walletState]);

  return (
    <PixelWorldView questPinned={questPinned}>
      <WorldHeader
        onWalletAction={handleWalletAction}
        onToggleSound={() => setSoundEnabled((current) => !current)}
        soundEnabled={soundEnabled}
        walletState={snapshot.walletState}
        role={snapshot.currentRole}
        onRoleChange={(role) => {
          setRole(role);
          setActivePanel(null);
          setIsCreatingQuest(false);
        }}
      />
      <SceneHud />
      {activePanel ? (
        <WorkspaceDrawer
          activePanel={activePanel}
          onClose={closePanel}
          title={drawerTitles[snapshot.currentRole][activePanel]}
        >
          {activePanel === "quests" && snapshot.currentRole !== "hr" ? (
            isCreatingQuest ? (
              <CreateQuestForm
                onCancel={() => setIsCreatingQuest(false)}
                onCreated={(input) => {
                  addQuest(input);
                  setIsCreatingQuest(false);
                  setAnnouncement("新任务已张贴到公告板");
                  setQuestPinned(true);
                  window.setTimeout(() => setQuestPinned(false), 700);
                  if (soundEnabled) {
                    const audio = new Audio("/pixel/sounds/scroll.wav");
                    void audio.play().catch(() => undefined);
                  }
                }}
              />
            ) : (
              <QuestBoard
                filter={snapshot.filter}
                onCreate={
                  snapshot.currentRole === "guild"
                    ? () => setIsCreatingQuest(true)
                    : undefined
                }
                onFilterChange={setFilter}
                onOpenQuest={(quest) => {
                  selectQuest(quest.id);
                  setIsCreatingQuest(false);
                  setActivePanel("current");
                }}
                quests={snapshot.quests}
              />
            )
          ) : null}
          {activePanel === "quests" && snapshot.currentRole === "hr" ? (
            <PublicCredentialsPanel credentials={snapshot.credentials} />
          ) : null}
          {activePanel === "current" && snapshot.currentRole === "designer" ? (
            <CurrentQuestPanel
              credential={currentCredential}
              onAccept={
                currentQuest
                  ? () => {
                      acceptQuest(currentQuest.id);
                      setAnnouncement("任务已接受，可以提交成果");
                    }
                  : undefined
              }
              onSubmit={
                currentQuest
                  ? (submission) => {
                      submitQuest(currentQuest.id, submission);
                      setAnnouncement("成果已保存，等待公会验收");
                    }
                  : undefined
              }
              quest={currentQuest}
            />
          ) : null}
          {activePanel === "current" && snapshot.currentRole === "guild" ? (
            <GuildReviewPanel
              quest={reviewQuest}
              onIssue={
                reviewQuest
                  ? () => {
                      const credential = issueCredential(reviewQuest.id);
                      setAnnouncement("公会验收完成，演示凭证已签发");
                      return credential;
                    }
                  : undefined
              }
            />
          ) : null}
          {activePanel === "current" && snapshot.currentRole === "hr" ? (
            <PublicCredentialsPanel credentials={snapshot.credentials.slice(-1)} />
          ) : null}
          {activePanel === "passport" && snapshot.currentRole === "designer" ? (
            <PassportPreviewPanel credentials={snapshot.credentials} />
          ) : null}
          {activePanel === "passport" && snapshot.currentRole === "guild" ? (
            <CredentialManagementPanel
              credentials={snapshot.credentials}
              onRevoke={(id) => {
                revokeCredential(id);
                setAnnouncement("凭证已撤销，公开查验状态已更新");
              }}
            />
          ) : null}
          {activePanel === "passport" && snapshot.currentRole === "hr" ? (
            <section className="previewPanel">
              <div className="previewNote">
                HR 只能读取公开贡献摘要、签发方、接收地址和当前有效状态；任务原文件与保密信息不会公开。
              </div>
              <PublicCredentialsPanel credentials={snapshot.credentials} />
            </section>
          ) : null}
          {activePanel === "chain" ? (
            <ChainStatePanel
              onReset={() => {
                resetDemo();
                setActivePanel(null);
                setIsCreatingQuest(false);
                setAnnouncement("演示数据已重置");
              }}
            />
          ) : null}
        </WorkspaceDrawer>
      ) : null}
      <FloatingActionRail
        activePanel={activePanel}
        onSelect={selectPanel}
        role={snapshot.currentRole}
      />
      <div aria-live="polite" className="toastRegion" role="status">
        {announcement}
      </div>
      <ChainStatusBar />
    </PixelWorldView>
  );
}
