export type QuestStatus =
  | "INVITED"
  | "ACCEPTED"
  | "SUBMITTED"
  | "ISSUED"
  | "REVOKED";

export type DemoRole = "designer" | "guild" | "hr";
export type CredentialStatus = "VALID" | "REVOKED";

export interface QuestSubmission {
  publicSummary: string;
  fileName: string;
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
  quests: Quest[];
  credentials: DemoCredential[];
  currentRole: DemoRole;
  walletState: WalletDemoState;
  filter: QuestFilter;
}
