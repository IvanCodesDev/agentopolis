# Agentopolis Phaser World Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the movable Phaser world and V1/V2 narrative from `agentopolis-v2` into the existing Next.js `agentopolis` application, with one persisted React state machine and a static-map fallback.

**Architecture:** Next.js remains the only application. A dynamically imported Phaser adapter renders the existing Alicization Town assets and emits typed location interactions; `DemoProvider` owns all story, quest, credential, and persistence state. React routes both map interactions and shortcut buttons through the same location router and renders all business UI in accessible drawers.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Phaser 3.90, React Hook Form, Zod, Vitest, Testing Library, Playwright

## Global Constraints

- Modify only `D:\Desktop\monad\agentopolis`; keep `agentopolis-v2` unchanged.
- Keep one `npm run dev` entry point and one deployable Next.js application.
- Continue using local simulated credentials; do not call a wallet, RPC, or live Monad contract.
- Reuse `public/pixel/town-map.gif`, `player.png`, `npc.png`, `quest-board.png`, and existing sounds.
- Phaser owns rendering and movement only; it must not mutate business state.
- `DemoProvider` is the single source of story, quest, credential, role, and persistence state.
- The existing `/verify/[credentialId]` route remains the public verification route.
- Preserve full-screen, zero-outer-margin layout and static-map fallback.
- Keep `agentopolis-v2/contracts` as a separate future-integration module.

---

## File Structure

### New world boundary

- `lib/world/types.ts`: world location, player position, and Phaser adapter types.
- `lib/world/location-router.ts`: pure mapping from location, role, and stage to React workspace intent.
- `lib/world/create-world-game.ts`: Phaser scene, asset loading, movement, hot zones, and callbacks.
- `components/world/phaser-world.tsx`: client-only dynamic Phaser lifecycle adapter.
- `components/world/mobile-world-controls.tsx`: touch direction and interaction controls.
- `components/world/story-hud.tsx`: chapter, objective, and interaction guidance.

### New workflow UI

- `components/story/story-intro-panel.tsx`: opening narrative and story start.
- `components/story/workshop-panel.tsx`: V1/V2 submission and evidence summary.
- `components/story/revision-panel.tsx`: guild feedback display.
- `components/story/world-workspace-content.tsx`: role/stage-aware drawer content router.

### Existing files to extend

- `lib/demo/types.ts`: story and project data model.
- `lib/demo/seed.ts`: versioned initial story state.
- `lib/demo/repository.ts`: schema migration and safe parsing.
- `components/providers/demo-provider.tsx`: guarded atomic story actions.
- `components/home-experience.tsx`: shared map/shortcut workspace orchestration.
- `components/world/pixel-world-view.tsx`: Phaser host and fallback.
- `components/panels/guild-review-panel.tsx`: V1 rejection, V2 approval, issue.
- `components/panels/passport-preview-panel.tsx`: add-to-passport action.
- `app/globals.css`: Phaser, HUD, prompts, mobile controls, and fallback styles.

---

### Task 1: Restore Integration Tooling and Define the Versioned Story Model

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `lib/demo/types.ts`
- Modify: `lib/demo/seed.ts`
- Modify: `lib/demo/repository.ts`
- Modify: `tests/repository.test.ts`
- Create: `lib/world/types.ts`

**Interfaces:**
- Produces: `StoryStage`, `StoryProject`, `PlayerPosition`, `WorldLocationId`, `WorldGameOptions`, and `schemaVersion: 2`.
- Preserves: existing `DemoRole`, `DemoCredential`, `Quest`, and `DemoSnapshot` consumers.

- [ ] **Step 1: Add runtime and test dependencies**

Update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "phaser": "3.90.0"
  },
  "devDependencies": {
    "@playwright/test": "1.62.0",
    "@testing-library/jest-dom": "7.0.0",
    "@testing-library/react": "16.3.2",
    "@vitejs/plugin-react": "6.0.4",
    "jsdom": "29.1.1",
    "vitest": "4.1.10"
  }
}
```

Keep all current dependencies and TypeScript type packages. Run:

```powershell
npm.cmd install
```

Expected: lockfile updates and install exits `0`.

- [ ] **Step 2: Write migration tests**

Add to `tests/repository.test.ts`:

```ts
it("migrates a v1 snapshot into the intro story schema", () => {
  localStorage.setItem(
    DEMO_STORAGE_KEY,
    JSON.stringify({
      ...createSeedSnapshot(),
      schemaVersion: undefined,
      storyStage: undefined,
      project: undefined,
    }),
  );

  const restored = loadDemoSnapshot(localStorage);

  expect(restored.schemaVersion).toBe(2);
  expect(restored.storyStage).toBe("INTRO");
  expect(restored.project.currentVersion).toBe(0);
  expect(restored.playerPosition).toEqual({ x: 210, y: 410 });
});

it("infers an issued story stage from an existing credential", () => {
  const legacy = createSeedSnapshot();
  legacy.credentials = [
    {
      id: "PQ-LEGACY",
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
  ];
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(legacy));

  expect(loadDemoSnapshot(localStorage).storyStage).toBe("CREDENTIAL_ISSUED");
});
```

- [ ] **Step 3: Run the migration tests and verify RED**

Run:

```powershell
npm.cmd test -- --run tests/repository.test.ts
```

Expected: failures for missing `schemaVersion`, `storyStage`, `project`, and `playerPosition`.

- [ ] **Step 4: Add story and world types**

Add to `lib/demo/types.ts`:

```ts
export type StoryStage =
  | "INTRO"
  | "TASK_CREATED"
  | "DESIGNER_INVITED"
  | "QUEST_ACCEPTED"
  | "V1_SUBMITTED"
  | "REVISION_REQUESTED"
  | "V2_SUBMITTED"
  | "WORK_APPROVED"
  | "ATTESTING"
  | "CREDENTIAL_ISSUED"
  | "PORTFOLIO_SHARED"
  | "HR_VERIFIED"
  | "CREDENTIAL_REVOKED";

export interface StoryProject {
  currentVersion: 0 | 1 | 2;
  evidenceHash?: string;
  v1EvidenceHash?: string;
  v2EvidenceHash?: string;
  revisionFeedback: string;
}

export interface PlayerPosition {
  x: number;
  y: number;
}
```

Extend `QuestStatus` with:

```ts
"V1_SUBMITTED" | "REVISION_REQUESTED" | "V2_SUBMITTED" | "APPROVED"
```

Extend `QuestSubmission` with:

```ts
version?: 1 | 2;
evidenceHash?: string;
```

Extend `DemoCredential` with:

```ts
evidenceHash?: string;
inPassport?: boolean;
verificationCount?: number;
```

Extend `DemoSnapshot` with:

```ts
schemaVersion: 2;
storyStage: StoryStage;
activeQuestId: string;
project: StoryProject;
playerPosition: PlayerPosition;
```

Create `lib/world/types.ts`:

```ts
import type { DemoRole, PlayerPosition, StoryStage } from "@/lib/demo/types";

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
```

- [ ] **Step 5: Seed and migrate schema v2**

Set the seed additions in `lib/demo/seed.ts`:

```ts
schemaVersion: 2,
storyStage: "INTRO",
activeQuestId: "PQ-101",
project: {
  currentVersion: 0,
  revisionFeedback:
    "首屏卖点不够突出；参数区统一为三列网格；降低装饰元素对商品主体的干扰。",
},
playerPosition: { x: 210, y: 410 },
```

In `lib/demo/repository.ts`, add `migrateSnapshot(parsed)` that:

1. starts from `createSeedSnapshot()`;
2. preserves recognized quests, credentials, wallet, filter, and role;
3. sets `storyStage` to `CREDENTIAL_ISSUED` when a credential exists, otherwise `INTRO`;
4. fills the new project, player, and credential fields;
5. always returns `schemaVersion: 2`.

- [ ] **Step 6: Run focused and full tests**

Run:

```powershell
npm.cmd test -- --run tests/repository.test.ts
npm.cmd test -- --run
```

Expected: repository migration tests and the existing suite pass.

- [ ] **Step 7: Commit the model boundary**

```powershell
git add package.json package-lock.json lib/demo/types.ts lib/demo/seed.ts lib/demo/repository.ts lib/world/types.ts tests/repository.test.ts
git commit -m "Add versioned story state"
```

---

### Task 2: Implement the Guarded Story State Machine

**Files:**
- Modify: `components/providers/demo-provider.tsx`
- Create: `lib/demo/evidence.ts`
- Create: `tests/story-provider.test.tsx`
- Modify: `tests/role-provider.test.tsx`

**Interfaces:**
- Consumes: `StoryStage`, expanded Quest states, and schema v2 snapshot from Task 1.
- Produces: atomic story actions returning `DemoActionResult`.

- [ ] **Step 1: Write failing provider transition tests**

Create `tests/story-provider.test.tsx` with a harness that exposes all actions and current stage. Cover this exact flow:

```ts
expect(stage()).toBe("INTRO");
click("startStory");
expect(stage()).toBe("TASK_CREATED");
click("inviteDesigner"); // wrong designer role
expect(stage()).toBe("TASK_CREATED");
click("setGuild");
click("inviteDesigner");
expect(stage()).toBe("DESIGNER_INVITED");
click("setDesigner");
click("accept");
expect(stage()).toBe("QUEST_ACCEPTED");
await clickAsync("submitV1");
expect(stage()).toBe("V1_SUBMITTED");
click("setGuild");
click("requestRevision");
expect(stage()).toBe("REVISION_REQUESTED");
click("setDesigner");
await clickAsync("submitV2");
expect(stage()).toBe("V2_SUBMITTED");
click("setGuild");
click("approve");
expect(stage()).toBe("WORK_APPROVED");
```

Add separate assertions that:

- V2 cannot be submitted before `REVISION_REQUESTED`;
- issue cannot happen before `WORK_APPROVED`;
- HR verification cannot happen before `PORTFOLIO_SHARED`;
- only guild can revoke a valid credential.

- [ ] **Step 2: Run the provider test and verify RED**

```powershell
npm.cmd test -- --run tests/story-provider.test.tsx
```

Expected: missing action/type failures.

- [ ] **Step 3: Add deterministic evidence hashing**

Create `lib/demo/evidence.ts`:

```ts
export async function createEvidenceHash(
  questId: string,
  version: 1 | 2,
  fileName: string,
  publicSummary: string,
) {
  const source = `${questId}:v${version}:${fileName}:${publicSummary.trim()}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}
```

- [ ] **Step 4: Add guarded action results and actions**

In `demo-provider.tsx`, define:

```ts
export type DemoActionResult =
  | { ok: true }
  | { ok: false; message: string };
```

Add these context methods:

```ts
startStory(): DemoActionResult;
inviteDesigner(): DemoActionResult;
submitVersion(
  id: string,
  version: 1 | 2,
  submission: QuestSubmission,
): Promise<DemoActionResult>;
requestRevision(id: string, feedback: string): DemoActionResult;
approveQuest(id: string): DemoActionResult;
addCredentialToPassport(id: string): DemoActionResult;
verifyCredential(id: string): DemoActionResult;
savePlayerPosition(position: PlayerPosition): void;
```

Use a shared helper:

```ts
function reject(message: string): DemoActionResult {
  return { ok: false, message };
}
```

Every legal action updates `storyStage`, Quest status, and project/credential fields in one `updateSnapshot` call. Preserve existing public method names where current components depend on them.

- [ ] **Step 5: Make issue simulation stage-aware**

`issueCredential` must:

- require role `guild`;
- require stage `WORK_APPROVED`;
- set stage `ATTESTING`;
- retain `APPROVED` if simulation fails;
- on success create a credential with V2 evidence hash, set Quest `ISSUED`, and set stage `CREDENTIAL_ISSUED`.

Keep the existing transaction delay in the presentation component, not in the provider.

- [ ] **Step 6: Run provider and full unit tests**

```powershell
npm.cmd test -- --run tests/story-provider.test.tsx tests/role-provider.test.tsx
npm.cmd test -- --run
```

Expected: all state-guard tests pass without changing illegal state.

- [ ] **Step 7: Commit the state machine**

```powershell
git add components/providers/demo-provider.tsx lib/demo/evidence.ts tests/story-provider.test.tsx tests/role-provider.test.tsx
git commit -m "Add guarded quest story flow"
```

---

### Task 3: Build the Phaser Adapter with Existing Pixel Assets

**Files:**
- Create: `lib/world/create-world-game.ts`
- Create: `components/world/phaser-world.tsx`
- Create: `components/world/mobile-world-controls.tsx`
- Modify: `components/world/pixel-world-view.tsx`
- Create: `tests/phaser-world.test.tsx`

**Interfaces:**
- Consumes: `WorldGameOptions` from Task 1.
- Produces: `<PhaserWorld />` with typed interaction, readiness, fallback, direction, and position callbacks.

- [ ] **Step 1: Write failing adapter lifecycle tests**

Create `tests/phaser-world.test.tsx`. Mock `@/lib/world/create-world-game` and assert:

```ts
expect(createWorldGame).toHaveBeenCalledWith(
  expect.objectContaining({
    actor: "designer",
    stage: "INTRO",
    initialPosition: { x: 210, y: 410 },
  }),
);
```

Also assert:

- returned `destroy()` is called on unmount;
- `onError` shows a static fallback marker;
- clicking a mobile direction button calls the adapter `setDirection("left", true)` and release calls `setDirection("left", false)`;
- clicking “互动” calls adapter `interact()`.

- [ ] **Step 2: Run the adapter test and verify RED**

```powershell
npm.cmd test -- --run tests/phaser-world.test.tsx
```

Expected: missing module/component failures.

- [ ] **Step 3: Implement the Phaser scene**

Create `lib/world/create-world-game.ts` with a dynamic-only `import Phaser from "phaser"`.

Load:

```ts
this.load.image("town-map", "/pixel/town-map.gif");
this.load.image("player", "/pixel/player.png");
this.load.image("npc", "/pixel/npc.png");
this.load.image("quest-board", "/pixel/quest-board.png");
this.load.audio("interact", "/pixel/sounds/scroll.wav");
```

Use a 1616×1276 world matching the map asset. Define eight hot zones with stable IDs and labels. Render the background with `image-rendering: pixelated`, place a 64×64 player image, clamp movement to the world, follow the player with the camera, and calculate the nearest location within 95 pixels.

Return:

```ts
export interface WorldGameHandle {
  destroy(): void;
  setDirection(direction: WorldDirection, active: boolean): void;
  interact(): void;
  updateContext(actor: DemoRole, stage: StoryStage): void;
}
```

Throttle `onPositionChange` to at most once every 500 ms.

- [ ] **Step 4: Implement the React lifecycle adapter**

`phaser-world.tsx` must dynamically import the game factory inside `useEffect`:

```ts
const module = await import("@/lib/world/create-world-game");
handle = module.createWorldGame(options);
```

Do not statically import Phaser from any server-rendered module. Catch import, WebGL, and asset errors and invoke `onError`.

- [ ] **Step 5: Add mobile controls**

Render four direction buttons and one interaction button with exact accessible names:

- `向上移动`
- `向下移动`
- `向左移动`
- `向右移动`
- `与附近地点互动`

Handle pointer down/up/cancel so movement never remains stuck.

- [ ] **Step 6: Add static fallback in PixelWorldView**

`PixelWorldView` receives:

```ts
worldEnabled: boolean;
world: ReactNode;
onWorldError: () => void;
```

When Phaser is ready, visually hide the static `<img>` but retain it as fallback. When initialization fails, display the static map and existing children.

- [ ] **Step 7: Run focused tests and production build**

```powershell
npm.cmd test -- --run tests/phaser-world.test.tsx
npm.cmd run build
```

Expected: no `window is not defined`, adapter tests pass, and Next.js build passes.

- [ ] **Step 8: Commit the world adapter**

```powershell
git add lib/world/create-world-game.ts components/world/phaser-world.tsx components/world/mobile-world-controls.tsx components/world/pixel-world-view.tsx tests/phaser-world.test.tsx
git commit -m "Embed Phaser pixel world"
```

---

### Task 4: Route Map Locations and Shortcuts Through One Workspace

**Files:**
- Create: `lib/world/location-router.ts`
- Create: `components/world/story-hud.tsx`
- Create: `components/story/world-workspace-content.tsx`
- Modify: `components/home-experience.tsx`
- Modify: `components/world/floating-action-rail.tsx`
- Modify: `components/world/scene-hud.tsx`
- Create: `tests/location-router.test.ts`
- Modify: `tests/role-navigation.test.tsx`

**Interfaces:**
- Consumes: `WorldLocationId`, `StoryStage`, `DemoRole`, and existing `PanelId`.
- Produces: `WorldWorkspaceIntent` and one `openWorldLocation(locationId)` orchestration path.

- [ ] **Step 1: Write location-router tests**

Create exact cases:

```ts
expect(resolveWorldLocation("home", "designer", "INTRO")).toEqual({
  panel: "current",
  mode: "intro",
});

expect(resolveWorldLocation("workshop", "designer", "QUEST_ACCEPTED")).toEqual({
  panel: "current",
  mode: "submit-v1",
});

expect(resolveWorldLocation("altar", "guild", "V1_SUBMITTED")).toEqual({
  panel: "current",
  mode: "review-v1",
});

expect(resolveWorldLocation("hr", "designer", "PORTFOLIO_SHARED")).toEqual({
  panel: null,
  requiredRole: "hr",
  message: "请切换至 HR 视角进行公开核验",
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm.cmd test -- --run tests/location-router.test.ts
```

Expected: missing router/types.

- [ ] **Step 3: Implement the pure router**

Define:

```ts
export type WorkspaceMode =
  | "intro"
  | "quest-board"
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
```

Use exhaustive maps and a default message showing the next valid destination.

- [ ] **Step 4: Build the story HUD**

Move v2 chapter, title, destination, and action copy into `story-hud.tsx`. It accepts:

```ts
stage: StoryStage;
nearestLocation: WorldLocationId | null;
onInteract: () => void;
```

Show the nearest-location prompt only when a location is in range.

- [ ] **Step 5: Centralize workspace content**

Move the role/stage conditionals currently in `home-experience.tsx` into `world-workspace-content.tsx`. It receives the selected `WorkspaceMode`, the current snapshot, and typed action callbacks.

- [ ] **Step 6: Connect Phaser and rail navigation**

In `home-experience.tsx`:

```ts
function openWorldLocation(locationId: WorldLocationId) {
  const intent = resolveWorldLocation(
    locationId,
    snapshot.currentRole,
    snapshot.storyStage,
  );
  if (intent.requiredRole) {
    setAnnouncement(intent.message ?? "当前角色无法执行此操作");
    return;
  }
  setWorkspaceMode(intent.mode);
  setActivePanel(intent.panel);
}
```

Both Phaser `onInteract` and `FloatingActionRail` call this function. Do not duplicate role/stage checks in the rail.

- [ ] **Step 7: Run router, navigation, and full unit tests**

```powershell
npm.cmd test -- --run tests/location-router.test.ts tests/role-navigation.test.tsx
npm.cmd test -- --run
```

Expected: map and rail resolve the same workspace modes.

- [ ] **Step 8: Commit shared navigation**

```powershell
git add lib/world/location-router.ts components/world/story-hud.tsx components/story/world-workspace-content.tsx components/home-experience.tsx components/world/floating-action-rail.tsx components/world/scene-hud.tsx tests/location-router.test.ts tests/role-navigation.test.tsx
git commit -m "Unify world and shortcut navigation"
```

---

### Task 5: Add the V1, Revision, V2, Approval, Passport, and HR UI

**Files:**
- Create: `components/story/story-intro-panel.tsx`
- Create: `components/story/workshop-panel.tsx`
- Create: `components/story/revision-panel.tsx`
- Modify: `components/panels/guild-review-panel.tsx`
- Modify: `components/panels/passport-preview-panel.tsx`
- Modify: `components/panels/public-credentials-panel.tsx`
- Modify: `components/story/world-workspace-content.tsx`
- Create: `tests/story-workflow.test.tsx`

**Interfaces:**
- Consumes: provider actions from Task 2 and workspace modes from Task 4.
- Produces: the complete local narrative flow without Phaser-specific dependencies.

- [ ] **Step 1: Write the complete React workflow test**

Render `HomePage` and complete:

1. open story and click `开始职业冒险`;
2. switch guild and click `创建匿名任务并邀请设计师`;
3. switch designer and click `接受匿名委托`;
4. submit V1 with summary and `detail-page-v1.fig`;
5. switch guild and click `驳回 V1 并发送修改意见`;
6. switch designer, verify feedback text, and submit V2;
7. switch guild and click `确认 V2 完成交付`;
8. click `模拟链上签发`;
9. switch designer and click `加入冒险护照`;
10. switch HR and click `以 HR 身份核验`;
11. assert `HR 已完成公开核验`.

- [ ] **Step 2: Run the workflow test and verify RED**

```powershell
npm.cmd test -- --run tests/story-workflow.test.tsx
```

Expected: missing story panels and buttons.

- [ ] **Step 3: Implement the intro panel**

Display the v2 narrative problem, privacy boundary, and one primary action. The action must call `startStory()` and display the returned failure message instead of assuming success.

- [ ] **Step 4: Implement the workshop panel**

Use the existing `SubmissionForm` fields and add a locked version badge. On submit:

```ts
await submitVersion(quest.id, mode === "submit-v1" ? 1 : 2, submission);
```

Show the generated evidence hash after state updates. Never claim the source file was uploaded.

- [ ] **Step 5: Implement the revision panel**

Show:

- V1 file name;
- V1 evidence hash;
- exact guild feedback;
- a privacy note that feedback remains local;
- `返回设计工作台提交 V2`.

- [ ] **Step 6: Extend guild review**

For `review-v1`, show the V1 summary/hash and button `驳回 V1 并发送修改意见`.

For `approve-v2`, show V2 summary/hash and button `确认 V2 完成交付`.

For `issue`, keep `TransactionStepper`, but only call `issueCredential` after approval.

- [ ] **Step 7: Extend passport and HR panels**

Passport must show the newest credential and button `加入冒险护照` until `inPassport` is true. HR list must show only credentials with `inPassport === true`; verification calls `verifyCredential`.

- [ ] **Step 8: Run workflow and all unit tests**

```powershell
npm.cmd test -- --run tests/story-workflow.test.tsx
npm.cmd test -- --run
```

Expected: full local narrative passes and existing public verification tests remain green.

- [ ] **Step 9: Commit the workflow UI**

```powershell
git add components/story components/panels/guild-review-panel.tsx components/panels/passport-preview-panel.tsx components/panels/public-credentials-panel.tsx tests/story-workflow.test.tsx
git commit -m "Add complete quest narrative UI"
```

---

### Task 6: Finish Responsive World Presentation and Fallback

**Files:**
- Modify: `app/globals.css`
- Modify: `components/world/world-header.tsx`
- Modify: `components/world/phaser-world.tsx`
- Modify: `tests/accessibility.test.tsx`
- Create: `tests/world-fallback.test.tsx`

**Interfaces:**
- Consumes: world readiness/error callbacks.
- Produces: full-screen desktop/mobile world with keyboard, pointer, and fallback access.

- [ ] **Step 1: Add failing accessibility and fallback tests**

Assert:

- Canvas host has accessible label `可移动的 Agentopolis 世界`;
- controls are keyboard-focusable;
- error renders `地图互动暂时不可用，已切换静态地图`;
- role switch remains operable over a mobile drawer;
- the static map does not disappear until Phaser calls `onReady`.

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm.cmd test -- --run tests/accessibility.test.tsx tests/world-fallback.test.tsx
```

- [ ] **Step 3: Add world CSS**

Add focused classes:

```css
.phaserWorld,
.phaserWorld canvas {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  image-rendering: pixelated;
}

.worldFallbackNotice {
  position: absolute;
  left: 50%;
  bottom: 52px;
  transform: translateX(-50%);
  pointer-events: none;
}
```

Desktop keeps HUD and rail positions. Under `767px`, place virtual controls above the bottom status bar and ensure their z-index does not block drawers or the role switch.

- [ ] **Step 4: Add reduced-motion behavior**

When reduced motion is requested:

- disable pulsing hot-zone animation;
- keep movement functional;
- make drawer transitions effectively instant;
- do not remove focus indication.

- [ ] **Step 5: Run tests and build**

```powershell
npm.cmd test -- --run
npm.cmd run build
```

Expected: all tests pass and no horizontal overflow is introduced by CSS.

- [ ] **Step 6: Commit responsive presentation**

```powershell
git add app/globals.css components/world/world-header.tsx components/world/phaser-world.tsx tests/accessibility.test.tsx tests/world-fallback.test.tsx
git commit -m "Polish responsive world experience"
```

---

### Task 7: Preserve the Contract Prototype Without Runtime Coupling

**Files:**
- Create: `contracts/contracts/ProofOfQuestRegistry.sol`
- Create: `contracts/test/ProofOfQuestRegistry.test.js`
- Create: `contracts/scripts/deploy.js`
- Create: `contracts/hardhat.config.cjs`
- Create: `contracts/package.json`
- Create: `contracts/package-lock.json`
- Create: `contracts/README.md`
- Modify: `README.md`

**Interfaces:**
- Produces: a standalone future Monad integration module.
- Must not be imported from `app/`, `components/`, `lib/demo/`, or `lib/world/`.

- [ ] **Step 1: Copy the contract module**

Copy only these source-controlled files from `agentopolis-v2/contracts`:

```text
contracts/contracts/ProofOfQuestRegistry.sol
contracts/test/ProofOfQuestRegistry.test.js
contracts/scripts/deploy.js
contracts/hardhat.config.cjs
contracts/package.json
contracts/package-lock.json
contracts/README.md
```

Do not copy `contracts/node_modules`, artifacts, cache, environment files, or deployment secrets.

- [ ] **Step 2: Clarify runtime boundaries**

Add to root `README.md`:

```md
## Contract prototype

The interactive app currently uses a local browser adapter so the full story
can run without funds or wallet setup. `contracts/` contains the isolated
ProofOfQuestRegistry prototype for a later Monad Testnet integration; the
Next.js runtime does not import or call it.
```

- [ ] **Step 3: Verify no runtime imports**

Run:

```powershell
rg -n "hardhat|ProofOfQuestRegistry|contracts/" app components lib
```

Expected: no matches.

- [ ] **Step 4: Run contract tests**

```powershell
Set-Location contracts
npm.cmd install
npm.cmd test
Set-Location ..
```

Expected: issue, lookup, issuer-only revoke, and double-revoke tests pass.

- [ ] **Step 5: Commit the isolated contract**

```powershell
git add contracts README.md
git commit -m "Preserve Monad registry prototype"
```

---

### Task 8: Add Cross-Viewport End-to-End Coverage and Final Verification

**Files:**
- Modify: `e2e/quest-flow.spec.ts`
- Modify: `e2e/homepage.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `README.md`

**Interfaces:**
- Verifies the complete integrated product.
- Produces no runtime API.

- [ ] **Step 1: Replace the old direct-drawer flow with the integrated story**

The E2E test must use map-triggered interactions where practical and rail shortcuts as fallback. It must assert:

```ts
await expect(page.getByLabel("可移动的 Agentopolis 世界")).toBeVisible();
await page.getByRole("button", { name: "设计师小屋" }).click();
await page.getByRole("button", { name: "开始职业冒险" }).click();
```

Continue through V1, rejection, V2, approval, issue, passport, and HR verification. Capture the verification URL, revoke as guild, then revisit the same URL and assert `凭证已撤销`.

- [ ] **Step 2: Add persistence coverage**

After V1 rejection:

```ts
await page.reload();
await expect(page.getByText("工作室提出具体修改")).toBeVisible();
await expect(page.getByText(/首屏卖点不够突出/)).toBeVisible();
```

- [ ] **Step 3: Add Phaser fallback coverage**

Block the Phaser chunk or abort the map asset request and assert:

- fallback notice is visible;
- static `town-map.gif` remains visible;
- right-side shortcuts still complete the current stage.

- [ ] **Step 4: Run all four viewport projects**

```powershell
npm.cmd run test:e2e
```

Expected: desktop 1440, tablet 768, mobile 390, and mobile 320 all pass with no horizontal overflow.

- [ ] **Step 5: Run the complete verification sequence**

```powershell
npm.cmd test -- --run
npm.cmd run test:e2e
npm.cmd run build
git diff --check
git status -sb
```

Expected:

- unit/component suite passes;
- full browser suite passes;
- production build passes;
- no whitespace errors;
- only intentional source, tests, docs, and contract files are tracked.

- [ ] **Step 6: Update README run and control instructions**

Document:

- `npm run dev`;
- WASD/arrow controls;
- `E` interaction;
- mobile controls and clickable locations;
- local simulation boundary;
- static fallback behavior;
- standalone contract test command.

- [ ] **Step 7: Commit final integration validation**

```powershell
git add e2e playwright.config.ts README.md
git commit -m "Validate integrated Agentopolis journey"
```
