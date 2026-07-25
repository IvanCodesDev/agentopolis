export type QuestStatus =
  | "INVITED"
  | "ACCEPTED"
  | "SUBMITTED"
  | "APPROVED"
  | "ISSUING"
  | "ISSUED"
  | "REVOKED";

export type Quest = {
  id: string;
  category: string;
  role: string;
  guild: string;
  guildAddress: string;
  designerAddress: string;
  period: string;
  deadline: string;
  summary: string;
  status: QuestStatus;
  confidentiality: 0 | 1 | 2;
  fileName?: string;
  fileSize?: string;
  evidenceHash?: string;
  credentialId?: string;
  txHash?: string;
  revokedAt?: string;
};
