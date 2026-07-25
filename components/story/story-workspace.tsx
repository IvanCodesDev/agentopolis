"use client";

import Link from "next/link";
import { BadgeCheck, FileCheck2, ScrollText, Sparkles } from "lucide-react";

import {
  useDemo,
  type DemoActionResult,
} from "@/components/providers/demo-provider";
import { SubmissionForm } from "@/components/quests/submission-form";
import { TransactionStepper } from "@/components/quests/transaction-stepper";
import type { WorkspaceMode } from "@/lib/world/location-router";

interface StoryWorkspaceProps {
  mode: WorkspaceMode;
  onAnnouncement: (message: string) => void;
  onModeChange: (mode: WorkspaceMode) => void;
}

function announce(
  result: DemoActionResult,
  success: string,
  onAnnouncement: (message: string) => void,
) {
  onAnnouncement(result.ok ? success : result.message);
}

export function StoryWorkspace({
  mode,
  onAnnouncement,
  onModeChange,
}: StoryWorkspaceProps) {
  const demo = useDemo();
  const { snapshot } = demo;
  const quest = snapshot.quests.find(
    (item) => item.id === snapshot.activeQuestId,
  );
  const credential = snapshot.credentials.at(-1);

  if (mode === "intro") {
    return (
      <section className="previewPanel storyPanel">
        <div className="previewHero">
          <div className="previewIcon"><ScrollText size={22} /></div>
          <div>
            <span className="previewEyebrow">PROLOGUE · INVISIBLE WORK</span>
            <h2>有作品，却没有可信经历</h2>
            <p>客户只认识工作室，聊天截图又包含不能公开的客户与报价。</p>
          </div>
        </div>
        <div className="questActionCard">
          <strong>
            {snapshot.storyStage === "INTRO"
              ? "12 个作品 · 0 条第三方可核验经历"
              : "工作室已收到真实客户订单"}
          </strong>
          <p>
            Proof of Quest 不取代工作室，只为验收后的真实贡献补上一段可携带记录。
          </p>
          {snapshot.storyStage === "INTRO" ? (
            <button
              className="primaryButton questFlowPrimary"
              onClick={() =>
                announce(
                  demo.startStory(),
                  "新目标：切换公会视角，在任务公会创建匿名邀请",
                  onAnnouncement,
                )
              }
              type="button"
            >
              开始职业冒险
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (!quest) {
    return <p className="panelPreview">主线任务未找到，请重置演示后重试。</p>;
  }

  if (mode === "invite") {
    return (
      <section className="previewPanel storyPanel">
        <div className="previewHero">
          <div className="previewIcon"><ScrollText size={22} /></div>
          <div><span className="previewEyebrow">GUILD · PRIVATE BRIEF</span><h2>{quest.title}</h2><p>{quest.industry}</p></div>
        </div>
        <div className="previewNote">
          客户身份、报价和源文件留在链下；只公开类别、角色、摘要和成果指纹。
        </div>
        <button
          className="primaryButton questFlowPrimary"
          onClick={() =>
            announce(
              demo.inviteDesigner(),
              "匿名任务已发送给设计师",
              onAnnouncement,
            )
          }
          type="button"
        >
          创建匿名任务并邀请设计师
        </button>
      </section>
    );
  }

  if (mode === "accept") {
    return (
      <section className="previewPanel storyPanel">
        <div className="previewHero">
          <div className="previewIcon"><ScrollText size={22} /></div>
          <div><span className="previewEyebrow">ANONYMOUS QUEST</span><h2>{quest.title}</h2><p>{quest.role}</p></div>
        </div>
        <div className="questActionCard"><strong>公开边界已确认</strong><p>{quest.summary}</p></div>
        <button
          className="primaryButton questFlowPrimary"
          onClick={() => {
            demo.acceptQuest(quest.id);
            onAnnouncement("委托已接受，前往设计工作台提交 V1");
          }}
          type="button"
        >
          接受匿名委托
        </button>
      </section>
    );
  }

  if (mode === "submit-v1" || mode === "submit-v2") {
    const version = mode === "submit-v1" ? 1 : 2;
    return (
      <section className="previewPanel storyPanel">
        <div className="previewHero">
          <div className="previewIcon"><FileCheck2 size={22} /></div>
          <div><span className="previewEyebrow">WORKSHOP · VERSION {version}</span><h2>提交设计成果 V{version}</h2><p>只记录公开摘要、文件名和 SHA-256 指纹</p></div>
        </div>
        <SubmissionForm
          initialValue={version === 2 ? quest.submission : undefined}
          onSubmit={(submission) => {
            void demo.submitVersion(quest.id, version, submission).then((result) =>
              announce(
                result,
                `V${version} 已提交，成果指纹已生成`,
                onAnnouncement,
              ),
            );
          }}
        />
      </section>
    );
  }

  if (mode === "revision") {
    return (
      <section className="previewPanel storyPanel">
        <div className="questActionCard">
          <strong>V1 需要修改</strong>
          <p>{snapshot.project.revisionFeedback}</p>
          <code className="monoWrap">{snapshot.project.v1EvidenceHash}</code>
        </div>
        <div className="previewNote">反馈与客户原始意见保持私密，不写入公开凭证。</div>
        <button className="primaryButton" onClick={() => onModeChange("submit-v2")} type="button">
          返回设计工作台提交 V2
        </button>
      </section>
    );
  }

  if (mode === "review-v1") {
    return (
      <section className="previewPanel storyPanel">
        <div className="submissionPreview"><FileCheck2 size={20} /><div><strong>{quest.submission?.fileName}</strong><p>{quest.submission?.publicSummary}</p></div></div>
        <div className="questActionCard"><strong>工作室修改意见</strong><p>{snapshot.project.revisionFeedback}</p></div>
        <button
          className="primaryButton questFlowPrimary"
          onClick={() =>
            announce(
              demo.requestRevision(
                quest.id,
                snapshot.project.revisionFeedback,
              ),
              "V1 已驳回，修改意见已发送",
              onAnnouncement,
            )
          }
          type="button"
        >
          驳回 V1 并发送修改意见
        </button>
      </section>
    );
  }

  if (mode === "approve-v2") {
    return (
      <section className="previewPanel storyPanel">
        <div className="submissionPreview"><FileCheck2 size={20} /><div><strong>{quest.submission?.fileName}</strong><p>{quest.submission?.publicSummary}</p></div></div>
        <button
          className="primaryButton questFlowPrimary"
          onClick={() =>
            announce(
              demo.approveQuest(quest.id),
              "V2 已验收，贡献事实等待签发",
              onAnnouncement,
            )
          }
          type="button"
        >
          确认 V2 完成交付
        </button>
      </section>
    );
  }

  if (mode === "issue") {
    return (
      <section className="previewPanel storyPanel">
        <div className="previewHero">
          <div className="previewIcon"><Sparkles size={22} /></div>
          <div><span className="previewEyebrow">MONAD LOCAL ADAPTER</span><h2>签发职业贡献凭证</h2><p>本地模拟，不发起真实交易</p></div>
        </div>
        {snapshot.storyStage === "WORK_APPROVED" ? (
          <TransactionStepper
            onIssue={() => {
              const issued = demo.issueCredential(quest.id);
              onAnnouncement("模拟凭证已签发，前往职业档案馆");
              return issued;
            }}
          />
        ) : (
          <p className="panelPreview">完成 V2 验收后才可签发。</p>
        )}
      </section>
    );
  }

  if (mode === "passport") {
    return (
      <section className="previewPanel storyPanel">
        <div className="passportCard"><div className="passportAvatar" /><div><span className="previewEyebrow">ADVENTURER PASSPORT</span><h2>林沐 · 自由设计师</h2><code>0x12ab…89ef</code></div></div>
        {credential ? (
          <>
            <div className="passportMetric"><BadgeCheck size={22} /><span>{credential.category} · {credential.role}</span><strong>{credential.status === "VALID" ? "✓" : "×"}</strong></div>
            {!credential.inPassport ? (
              <button
                className="primaryButton"
                onClick={() =>
                  announce(
                    demo.addCredentialToPassport(credential.id),
                    "凭证已加入冒险护照，可交给 HR 核验",
                    onAnnouncement,
                  )
                }
                type="button"
              >
                加入冒险护照
              </button>
            ) : (
              <Link className="primaryButton credentialLink" href={`/verify/${credential.id}`}>查看公开凭证</Link>
            )}
          </>
        ) : <p className="panelPreview">完成公会签发后，这里会出现职业贡献凭证。</p>}
      </section>
    );
  }

  if (mode === "verify") {
    const publicCredential = snapshot.credentials.find((item) => item.inPassport);
    return (
      <section className="previewPanel storyPanel">
        <div className="previewNote">HR 无需钱包；核验的是签发声明和当前状态，不替代作品评审。</div>
        {publicCredential ? (
          <div className="questActionCard">
            <strong>{publicCredential.category} · {publicCredential.role}</strong>
            <p>{publicCredential.publicSummary}</p>
            {snapshot.storyStage !== "HR_VERIFIED" ? (
              <button
                className="primaryButton"
                onClick={() =>
                  announce(
                    demo.verifyCredential(publicCredential.id),
                    "HR 已完成公开核验",
                    onAnnouncement,
                  )
                }
                type="button"
              >
                以 HR 身份核验
              </button>
            ) : <strong className="questStatusSuccess">HR 已完成公开核验</strong>}
          </div>
        ) : <p className="panelPreview">设计师尚未把凭证加入冒险护照。</p>}
      </section>
    );
  }

  return (
    <section className="previewPanel storyPanel">
      <div className="previewNote">Monad 记忆碑保留签发与撤销历史。</div>
      {credential ? (
        <Link className="primaryButton credentialLink" href={`/verify/${credential.id}`}>查看凭证当前状态</Link>
      ) : <p className="panelPreview">石碑尚未被贡献凭证点亮。</p>}
    </section>
  );
}
