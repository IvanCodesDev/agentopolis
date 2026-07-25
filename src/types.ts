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

export type Actor = "designer" | "guild" | "visitor";

export interface Credential {
  id: string;
  issuer: string;
  designer: string;
  projectCategory: string;
  role: string;
  publicSummary: string;
  evidenceHash: string;
  issuedAt: string;
  network: "Monad Testnet";
  transactionHash: string;
  verificationCount: number;
  inPortfolio: boolean;
  revoked: boolean;
}

export interface ProjectRecord {
  title: string;
  category: string;
  role: string;
  issuerName: string;
  designerName: string;
  brief: string;
  deadline: string;
  publicSummary: string;
  revisionFeedback: string;
  currentVersion: 0 | 1 | 2;
  evidenceHash?: string;
}

export interface WorldEvent {
  zone:
    | "home"
    | "portfolio"
    | "guild"
    | "client"
    | "workshop"
    | "feedback"
    | "altar"
    | "archive"
    | "hr"
    | "monument";
}
