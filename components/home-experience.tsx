"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { ChainStatePanel } from "@/components/panels/chain-state-panel";
import { CredentialManagementPanel } from "@/components/panels/credential-management-panel";
import { QuestBoard } from "@/components/quests/quest-board";
import {
  DemoProvider,
  useDemo,
} from "@/components/providers/demo-provider";
import { StoryWorkspace } from "@/components/story/story-workspace";
import { ChainStatusBar } from "@/components/world/chain-status-bar";
import {
  FloatingActionRail,
  type PanelId,
} from "@/components/world/floating-action-rail";
import { PhaserWorld } from "@/components/world/phaser-world";
import { PixelWorldView } from "@/components/world/pixel-world-view";
import { StoryHud } from "@/components/world/story-hud";
import { WorkspaceDrawer } from "@/components/world/workspace-drawer";
import { WorldHeader } from "@/components/world/world-header";
import {
  resolveWorldLocation,
  shortcutLocation,
  type WorkspaceMode,
} from "@/lib/world/location-router";
import type { WorldLocationId } from "@/lib/world/types";

const drawerTitles: Record<PanelId, string> = {
  quests: "Adventure Board",
  current: "Quest Workspace",
  passport: "Adventure Passport",
  chain: "Demo State",
};

export function HomeExperience() {
  return (
    <DemoProvider>
      <HomeExperienceContent />
    </DemoProvider>
  );
}

function HomeExperienceContent() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [workspaceMode, setWorkspaceMode] =
    useState<WorkspaceMode>("intro");
  const [announcement, setAnnouncement] = useState("");
  const [questPinned, setQuestPinned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [nearestLocation, setNearestLocation] =
    useState<WorldLocationId | null>(null);
  const [worldFailed, setWorldFailed] = useState(false);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  const {
    addQuest,
    resetDemo,
    savePlayerPosition,
    selectQuest,
    setFilter,
    setRole,
    setWalletState,
    snapshot,
  } = useDemo();

  const quest = useMemo(
    () => snapshot.quests.find((item) => item.id === snapshot.activeQuestId),
    [snapshot.activeQuestId, snapshot.quests],
  );

  const closePanel = useCallback(() => {
    setActivePanel(null);
    lastTrigger.current?.focus();
  }, []);

  const openIntent = useCallback(
    (location: WorldLocationId) => {
      const intent = resolveWorldLocation(
        location,
        snapshot.currentRole,
        snapshot.storyStage,
      );
      if (!intent.panel || !intent.mode) {
        if (intent.requiredRole) setRole(intent.requiredRole);
        setAnnouncement(intent.message ?? "Switch role to continue.");
        return;
      }
      setActivePanel(intent.panel);
      setWorkspaceMode(intent.mode);
      setAnnouncement("");
    },
    [setRole, snapshot.currentRole, snapshot.storyStage],
  );

  const selectPanel = useCallback(
    (panel: PanelId, trigger: HTMLButtonElement) => {
      lastTrigger.current = trigger;
      if (panel === activePanel) {
        closePanel();
        return;
      }
      if (panel === "chain") {
        setActivePanel("chain");
        setWorkspaceMode("demo-state");
        return;
      }
      openIntent(
        shortcutLocation(panel, snapshot.currentRole, snapshot.storyStage),
      );
    },
    [
      activePanel,
      closePanel,
      openIntent,
      snapshot.currentRole,
      snapshot.storyStage,
    ],
  );

  const handleWalletAction = useCallback(() => {
    if (snapshot.walletState === "disconnected") {
      setWalletState("connected");
      setAnnouncement("Mock wallet connected.");
      return;
    }
    if (snapshot.walletState === "connected") {
      setWalletState("wrong-network");
      setAnnouncement("Switched to a wrong-network demo state.");
      return;
    }
    setWalletState("connected");
    setAnnouncement("Back on Monad Testnet.");
  }, [setWalletState, snapshot.walletState]);

  const handleRoleChange = useCallback(
    (role: typeof snapshot.currentRole) => {
      setRole(role);
      setActivePanel(null);
      setAnnouncement(`Role switched to ${role}.`);
    },
    [setRole],
  );

  const handleCreateQuest = useCallback(() => {
    const created = addQuest({
      category: "E-commerce visual system",
      role: "Visual designer",
      startDate: "2026-07-20",
      dueDate: "2026-07-28",
      confidentiality: 2,
      summary: "Private client brief, public contribution receipt.",
      recipient: "0x12ab...9ef",
    });
    selectQuest(created.id);
    setQuestPinned(true);
    setAnnouncement("Quest pinned to the board.");
    window.setTimeout(() => setQuestPinned(false), 700);
  }, [addQuest, selectQuest]);

  return (
    <PixelWorldView questPinned={questPinned}>
      {!worldFailed ? (
        <PhaserWorld
          actor={snapshot.currentRole}
          initialPosition={snapshot.playerPosition}
          onError={() => setWorldFailed(true)}
          onInteract={openIntent}
          onNearestLocationChange={setNearestLocation}
          onPositionChange={savePlayerPosition}
          onReady={() => undefined}
          stage={snapshot.storyStage}
        />
      ) : null}

      <WorldHeader
        onRoleChange={handleRoleChange}
        onToggleSound={() => setSoundEnabled((current) => !current)}
        onWalletAction={handleWalletAction}
        role={snapshot.currentRole}
        soundEnabled={soundEnabled}
        walletState={snapshot.walletState}
      />

      <StoryHud
        nearestLocation={nearestLocation}
        onInteract={() => nearestLocation && openIntent(nearestLocation)}
        stage={snapshot.storyStage}
      />

      {activePanel ? (
        <WorkspaceDrawer
          activePanel={activePanel}
          onClose={closePanel}
          title={drawerTitles[activePanel]}
        >
          {workspaceMode === "quest-board" ? (
            <section className="previewPanel storyPanel">
              <QuestBoard
                filter={snapshot.filter}
                onCreate={
                  snapshot.currentRole === "guild"
                    ? handleCreateQuest
                    : undefined
                }
                onFilterChange={setFilter}
                onOpenQuest={(selected) => {
                  selectQuest(selected.id);
                  setActivePanel("current");
                  setWorkspaceMode("invite");
                }}
                quests={snapshot.quests}
              />
            </section>
          ) : null}

          {workspaceMode !== "quest-board" &&
          workspaceMode !== "demo-state" &&
          !(workspaceMode === "credential" && snapshot.currentRole === "guild") ? (
            <StoryWorkspace
              mode={workspaceMode}
              onAnnouncement={setAnnouncement}
              onModeChange={setWorkspaceMode}
            />
          ) : null}

          {workspaceMode === "credential" && snapshot.currentRole === "guild" ? (
            <CredentialManagementPanel
              credentials={snapshot.credentials}
              onRevoke={(id) => {
                // Credential revocation is intentionally exposed only in the demo panel.
                setAnnouncement(`Credential ${id} marked for guild review.`);
              }}
            />
          ) : null}

          {workspaceMode === "demo-state" ? (
            <ChainStatePanel
              onReset={() => {
                resetDemo();
                setActivePanel(null);
                setWorkspaceMode("intro");
                setAnnouncement("Demo reset.");
              }}
            />
          ) : null}

          {!quest && workspaceMode !== "intro" ? (
            <p className="panelPreview">Main quest is not available yet.</p>
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
