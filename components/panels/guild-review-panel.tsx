"use client";

import { FileCheck2, ShieldCheck } from "lucide-react";

import { TransactionStepper } from "@/components/quests/transaction-stepper";
import type { DemoCredential, Quest } from "@/lib/demo/types";

export function GuildReviewPanel({
  quest,
  onIssue,
}: {
  quest?: Quest;
  onIssue?: () => DemoCredential;
}) {
  if (!quest) {
    return (
      <div className="questState">
        <ShieldCheck aria-hidden="true" size={28} />
        <strong>暂无待验收成果</strong>
        <p>设计师提交成果后，会出现在这里。</p>
      </div>
    );
  }

  if (quest.status !== "SUBMITTED" || !quest.submission || !onIssue) {
    return (
      <section className="previewPanel">
        <div className="questActionCard">
          <strong>{quest.title}</strong>
          <p>当前状态：{quest.status}。只有已提交成果可以验收签发。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="previewPanel" aria-label="公会成果验收">
      <div className="previewHero">
        <div className="previewIcon">
          <FileCheck2 aria-hidden="true" size={22} />
        </div>
        <div>
          <span className="previewEyebrow">GUILD REVIEW · SUBMITTED</span>
          <h2>{quest.title}</h2>
          <p>{quest.role}</p>
        </div>
      </div>
      <div className="submissionPreview">
        <FileCheck2 aria-hidden="true" size={20} />
        <div>
          <strong>{quest.submission.fileName}</strong>
          <p>{quest.submission.publicSummary}</p>
        </div>
      </div>
      <TransactionStepper onIssue={onIssue} />
    </section>
  );
}
