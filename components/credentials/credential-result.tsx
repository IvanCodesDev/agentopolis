import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";

import type { DemoCredential } from "@/lib/demo/types";

export function CredentialResult({
  credential,
}: {
  credential: DemoCredential;
}) {
  return (
    <article className="credentialResult">
      <header className="credentialResultHeader">
        <div className="credentialStamp" aria-hidden="true">
          <BadgeCheck size={34} />
        </div>
        <div>
          <p className="verifyEyebrow">PUBLIC CREDENTIAL · DEMO</p>
          <h1>{credential.status === "VALID" ? "凭证有效" : "凭证已撤销"}</h1>
          <p>
            {credential.status === "VALID"
              ? "该记录证明演示签发方向指定地址发布了以下公开贡献声明。"
              : "该贡献记录曾被签发，但公会已更新其公开状态为撤销。"}
          </p>
        </div>
      </header>

      <dl className="credentialFields">
        <div>
          <dt>项目类别</dt>
          <dd>{credential.category}</dd>
        </div>
        <div>
          <dt>任务角色</dt>
          <dd>{credential.role}</dd>
        </div>
        <div className="credentialFieldWide">
          <dt>公开成果摘要</dt>
          <dd>{credential.publicSummary}</dd>
        </div>
        <div>
          <dt>签发时间</dt>
          <dd className="fieldWithIcon">
            <CalendarDays aria-hidden="true" size={14} />
            {new Date(credential.issuedAt).toLocaleString("zh-CN")}
          </dd>
        </div>
        <div>
          <dt>凭证编号</dt>
          <dd className="monoWrap">{credential.id}</dd>
        </div>
        <div className="credentialFieldWide">
          <dt>签发方</dt>
          <dd className="monoWrap">{credential.issuer}</dd>
        </div>
        <div className="credentialFieldWide">
          <dt>接收方</dt>
          <dd className="monoWrap">{credential.recipient}</dd>
        </div>
        <div className="credentialFieldWide">
          <dt>模拟交易哈希</dt>
          <dd className="monoWrap">{credential.transactionHash}</dd>
        </div>
        {credential.status === "REVOKED" ? (
          <>
            <div>
              <dt>撤销时间</dt>
              <dd>{credential.revokedAt ? new Date(credential.revokedAt).toLocaleString("zh-CN") : "—"}</dd>
            </div>
            <div>
              <dt>撤销原因</dt>
              <dd>{credential.revocationReason ?? "状态已更新"}</dd>
            </div>
          </>
        ) : null}
      </dl>

      <footer className="credentialDemoNotice">
        <ShieldCheck aria-hidden="true" size={18} />
        <div>
          <strong>本地演示数据，不是 Monad 链上凭证</strong>
          <p>此页面用于验证产品流程与视觉，未读取真实合约或 RPC。</p>
        </div>
      </footer>
    </article>
  );
}
