import { useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../shell";
import { Icon, PixelPlate, QrPlate, Seal, Tag } from "../ui";
import { CREDENTIAL, CREDENTIAL_TABS } from "../data";

/** Board 04 —「凭证详情 / 凭证详情页（设计师视角）」*/
export function CredentialPage() {
  const [tab, setTab] = useState("凭证详情");

  return (
    <Shell>
      <main className="cy-page cy-credential-page">
        <section className="cy-card cy-vc">
          <header className="cy-vc-head">
            <div className="cy-row">
              <span className="cy-vc-badge" aria-hidden="true">
                <Icon name="award" size={17} />
              </span>
              <h1 className="cy-d2">{CREDENTIAL.title}</h1>
            </div>
            <Tag status="check">已验证</Tag>
          </header>

          <div className="cy-vc-body">
            <figure className="cy-vc-portrait">
              <span className="cy-pixel-frame">
                <PixelPlate seed={CREDENTIAL.vcId} cols={26} rows={30} className="cy-pixel" />
              </span>
              <figcaption className="cy-mono">{CREDENTIAL.serial}</figcaption>
            </figure>

            <dl className="cy-vc-fields">
              <div className="cy-kv">
                <dt>项目名称</dt>
                <dd>{CREDENTIAL.project}</dd>
              </div>
              <div className="cy-kv">
                <dt>项目 ID</dt>
                <dd className="cy-mono">{CREDENTIAL.projectId}</dd>
              </div>
              <div className="cy-kv">
                <dt>担任角色</dt>
                <dd>{CREDENTIAL.role}</dd>
              </div>
              <div className="cy-kv">
                <dt>服务周期</dt>
                <dd>{CREDENTIAL.period}</dd>
              </div>
              <div className="cy-kv">
                <dt>主理方</dt>
                <dd>{CREDENTIAL.studio}</dd>
              </div>
              <div className="cy-kv">
                <dt>签发机构</dt>
                <dd>
                  {CREDENTIAL.issuer}
                  <Seal />
                </dd>
              </div>
            </dl>
          </div>

          <footer className="cy-vc-foot">
            <div className="cy-vc-foot-info">
              <div className="cy-row">
                <span className="cy-label">凭证 ID</span>
                <code>{CREDENTIAL.vcId}</code>
                <button type="button" className="cy-icon-btn cy-icon-btn-plain" aria-label="复制凭证 ID">
                  <Icon name="copy" size={14} />
                </button>
              </div>
              <div className="cy-vc-foot-meta">
                <span>
                  <Icon name="clock" size={13} />
                  {CREDENTIAL.issuedAt}
                </span>
                <span>
                  <Icon name="link" size={13} />
                  {CREDENTIAL.chain}
                </span>
              </div>
            </div>
            <QrPlate seed={CREDENTIAL.vcId} size={80} />
          </footer>
        </section>

        <nav className="cy-tabs cy-vc-tabs">
          {CREDENTIAL_TABS.map((item) => (
            <button key={item} type="button" className={item === tab ? "on" : undefined} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="cy-vc-actions">
          <Link to={`/v2/verify/${CREDENTIAL.vcId}`} className="cy-btn cy-btn-ghost cy-btn-lg">
            <Icon name="share" size={15} />
            分享给 HR
          </Link>
          <button type="button" className="cy-btn cy-btn-dark cy-btn-lg">
            <Icon name="download" size={15} />
            下载凭证（PDF）
          </button>
        </div>
      </main>
    </Shell>
  );
}
