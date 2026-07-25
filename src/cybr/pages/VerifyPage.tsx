import { Shell } from "../shell";
import { Icon, Seal } from "../ui";
import { CREDENTIAL, VERIFY_CHECKS } from "../data";

/** Board 06 —「验证页面 / HR 验证视图」*/
export function VerifyPage() {
  return (
    <Shell>
      <main className="cy-page cy-verify-page">
        <aside className="cy-verify-rail" aria-hidden="true"><span>HR VERIFICATION MODULE</span><b>2024</b></aside>
        <section className="cy-card cy-verify-hero">
          <span className="cy-verify-shield" aria-hidden="true">
            <Icon name="shieldCheck" size={26} />
          </span>
          <div className="cy-stack">
            <h1 className="cy-d2">凭证已验证</h1>
            <p className="cy-body cy-dim">该凭证真实有效，信息未被篡改</p>
            <p className="cy-verify-note">
              <Icon name="check" size={13} />
              已通过链上验证 · 未被撤销
            </p>
          </div>
        </section>

        <div className="cy-verify-grid">
          <section className="cy-verify-info">
            <div className="cy-card-head cy-verify-info-head">
              <h2>凭证信息</h2>
            </div>
            <dl className="cy-card-pad" style={{ paddingTop: 4, paddingBottom: 10 }}>
              <div className="cy-kv">
                <dt>凭证编号</dt>
                <dd>
                  <code>{CREDENTIAL.vcId}</code>
                  <button type="button" className="cy-icon-btn cy-icon-btn-plain" aria-label="复制凭证编号">
                    <Icon name="copy" size={14} />
                  </button>
                </dd>
              </div>
              <div className="cy-kv">
                <dt>项目名称</dt>
                <dd>{CREDENTIAL.project}</dd>
              </div>
              <div className="cy-kv">
                <dt>签发机构</dt>
                <dd>
                  {CREDENTIAL.issuer}
                  <Seal />
                </dd>
              </div>
              <div className="cy-kv">
                <dt>设计师</dt>
                <dd>
                  {CREDENTIAL.designer}
                  <code className="cy-muted">{CREDENTIAL.designerAddress}</code>
                </dd>
              </div>
              <div className="cy-kv">
                <dt>签发时间</dt>
                <dd>{CREDENTIAL.issuedAt}</dd>
              </div>
              <div className="cy-kv">
                <dt>区块链网络</dt>
                <dd>{CREDENTIAL.chain}</dd>
              </div>
              <div className="cy-kv">
                <dt>验证时间</dt>
                <dd>{CREDENTIAL.verifiedAt}</dd>
              </div>
            </dl>
          </section>

          <aside className="cy-card cy-verify-checks">
            <div className="cy-card-head">
              <h2>验证结果</h2>
            </div>
            <ul>
              {VERIFY_CHECKS.map((check) => (
                <li key={check.label}>
                  <span className="cy-check-dot" aria-hidden="true">
                    <Icon name="check" size={11} strokeWidth={2.6} />
                  </span>
                  <span>{check.label}</span>
                  <b>{check.value}</b>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="cy-verify-actions">
          <button type="button" className="cy-btn cy-btn-dark cy-btn-lg">
            下载验证报告（PDF）
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </main>
    </Shell>
  );
}
