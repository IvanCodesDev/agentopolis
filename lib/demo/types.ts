export type QuestStatus =
  | "INVITED"
  | "ACCEPTED"
  | "SUBMITTED"
  | "V1_SUBMITTED"
  | "REVISION_REQUESTED"
  | "V2_SUBMITTED"
  | "APPROVED"
  | "ISSUED"
  | "REVOKED";

export type DemoRole = "designer" | "guild" | "hr";
export type CredentialStatus = "VALID" | "REVOKED";
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

export interface PlayerPosition {
  x: number;
  y: number;
}

export interface StoryProject {
  currentVersion: 0 | 1 | 2;
  evidenceHash?: string;
  v1EvidenceHash?: string;
  v2EvidenceHash?: string;
  revisionFeedback: string;
}

export interface QuestSubmission {
  publicSummary: string;
  fileName: string;
  version?: 1 | 2;
  evidenceHash?: string;
}

export interface DemoCredential {
  id: string;
  questId: string;
  category: string;
  role: string;
  publicSummary: string;
  issuer: string;
  recipient: string;
  issuedAt: string;
  transactionHash: string;
  status: CredentialStatus;
  revokedAt?: string;
  revocationReason?: string;
  evidenceHash?: string;
  inPassport?: boolean;
  verificationCount?: number;
}

export type WalletDemoState =
  | "disconnected"
  | "connected"
  | "wrong-network";

export interface Quest {
  id: string;
  title: string;
  industry: string;
  category: string;
  role: string;
  startDate: string;
  dueDate: string;
  confidentiality: 1 | 2;
  summary: string;
  recipient: string;
  status: QuestStatus;
  createdByUser?: boolean;
  submission?: QuestSubmission;
  credentialId?: string;
}

export type QuestFilter = "ALL" | QuestStatus;

export interface DemoSnapshot {
  schemaVersion: 2;
  storyStage: StoryStage;
  activeQuestId: string;
  project: StoryProject;
  playerPosition: PlayerPosition;
  quests: Quest[];
  credentials: DemoCredential[];
  currentRole: DemoRole;
  walletState: WalletDemoState;
  filter: QuestFilter;
}
