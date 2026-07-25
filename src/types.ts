export type StoryStage =
  | "INTRO"
  | "QUEST_AVAILABLE"
  | "QUEST_ACCEPTED"
  | "WORK_SUBMITTED"
  | "CREDENTIAL_ISSUED"
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
  revoked: boolean;
}

export interface WorldEvent {
  zone: "home" | "guild" | "workshop" | "altar" | "monument";
}
