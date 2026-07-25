"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Clock3,
  FileCheck2,
  Palette,
} from "lucide-react";

import { SubmissionForm } from "@/components/quests/submission-form";
import { TransactionStepper } from "@/components/quests/transaction-stepper";
import type {
  DemoCredential,
  Quest,
  QuestSubmission,
  QuestStatus,
} from "@/lib/demo/types";

interface CurrentQuestPanelProps {
  quest?: Quest;
  credential?: DemoCredential;
  onAccept?: () => void;
  onSubmit?: (submission: QuestSubmission) => void;
  onIssue?: () => DemoCredential;
}

const statusIndex: Record<QuestStatus, number> = {
  INVITED: 0,
  ACCEPTED: 1,
  SUBMITTED: 2,
  V1_SUBMITTED: 2,
  REVISION_REQUESTED: 2,
  V2_SUBMITTED: 2,
  APPROVED: 2,
  ISSUED: 3,
  REVOKED: 3,
};

export function CurrentQuestPanel({
  quest,
  credential,
  onAccept,
  onSubmit,
  onIssue,
}: CurrentQuestPanelProps) {
  if (!quest) {
    return <p className="panelPreview">当前没有选中的任务。</p>;
  }

  const currentStep = statusIndex[quest.status];

  return (
    <section className="previewPanel questFlowPanel" aria-label="当前任务流程">
      <div className="previewHero">
        <div className="previewIcon">
          <Palette aria-hidden="true" size={22} />
        </div>
        <div>
          <span className="previewEyebrow">{quest.status} · MVP FLOW</span>
          <h2>{quest.title}</h2>
          <p>{quest.industry}</p>
        </div>
      </div>

      <ol aria-label="任务进度" className="questProgress">
        {["接受任务", "提交成果", "获得凭证"].map((label, index) => (
          <li
            className={currentStep > index ? "questProgressDone" : undefined}
            key={label}
          >
            <span>{currentStep > index ? <Check size={12} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="previewStats">
        <span>
          <Clock3 aria-hidden="true" size={14} />
          {quest.dueDate} 截止
        </span>
        <span>角色 · {quest.role}</span>
      </div>

      {quest.status === "INVITED" ? (
        <div className="questActionCard">
          <strong>公会向你发出任务邀请</strong>
          <p>{quest.summary || "该任务的公开摘要受保密设置保护。"}</p>
          <button
            className="primaryButton questFlowPrimary"
            onClick={onAccept}
            type="button"
          >
            接受任务
          </button>
        </div>
      ) : null}

      {quest.status === "ACCEPTED" && onSubmit ? (
        <SubmissionForm
          initialValue={quest.submission}
          onSubmit={onSubmit}
        />
      ) : null}

      {quest.status === "SUBMITTED" && quest.submission ? (
        <>
          <div className="submissionPreview">
            <FileCheck2 aria-hidden="true" size={20} />
            <div>
              <strong>{quest.submission.fileName}</strong>
              <p>{quest.submission.publicSummary}</p>
            </div>
          </div>
          {onIssue ? (
            <TransactionStepper onIssue={onIssue} />
          ) : (
            <div className="previewNote">
              成果已提交，等待公会验收并签发公开贡献凭证。
            </div>
          )}
        </>
      ) : null}

      {quest.status === "ISSUED" ? (
        <div className="credentialSuccess">
          <BadgeCheck aria-hidden="true" size={30} />
          <div>
            <strong>签发成功</strong>
            <p className="monoWrap">
              {credential?.id ?? quest.credentialId ?? "凭证已生成"}
            </p>
          </div>
          {credential ?? quest.credentialId ? (
            <Link
              className="primaryButton credentialLink"
              href={`/verify/${credential?.id ?? quest.credentialId}`}
            >
              查看公开凭证
            </Link>
          ) : null}
        </div>
      ) : null}
      {quest.status === "REVOKED" ? (
        <div className="questActionCard">
          <strong>凭证已撤销</strong>
          <p>公会已更新这项贡献记录的公开状态。</p>
        </div>
      ) : null}
    </section>
  );
}
