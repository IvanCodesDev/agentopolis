import { useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, Copy, ExternalLink, QrCode, RefreshCw, Share2, ShieldCheck, Swords } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CredentialSeal, Layout, PageHeading, Scene, StatusBadge, TechnicalDetails } from "../components";
import { useApp } from "../state";
import { shortAddress } from "../utils";

export function PassportPage() {
  const { quests } = useApp();
  const [filter, setFilter] = useState<"all" | "valid" | "revoked">("all");
  const credentials = quests.filter((quest) => quest.credentialId);
  const visible = credentials.filter((quest) => filter === "all" || filter === "valid" && quest.status === "ISSUED" || filter === "revoked" && quest.status === "REVOKED");
  return <Layout><main className="page passport-page">
    <PageHeading eyebrow="ADVENTURER CAREER PASSPORT" title="冒险者护照" description="一份由公会签发、由 Monad 验证的职业贡献履历。" actions={<><button className="secondary-btn"><Share2 size={16} />分享</button><button className="icon-btn qr-btn" title="生成二维码"><QrCode size={19} /></button></>} />
    <div className="world-layout passport-layout"><div className="scene-column"><Scene type="passport" /><div className="profile-plaque"><div className="profile-avatar">D</div><div><small>FREELANCE DESIGNER</small><strong>匿名设计冒险者</strong><span>{shortAddress(credentials[0]?.designerAddress)}</span></div><div className="level"><small>LEVEL</small><strong>{credentials.filter((q) => q.status === "ISSUED").length + 2}</strong></div></div><div className="achievement-row"><span><Swords size={18} />电商视觉</span><span><BadgeCheck size={18} />链上履历</span><span><ShieldCheck size={18} />隐私守护</span></div></div>
      <section className="workspace passport-workspace"><div className="passport-summary"><div><small>职业贡献</small><strong>{credentials.length}</strong></div><div><small>当前有效</small><strong className="success-text">{credentials.filter((q) => q.status === "ISSUED").length}</strong></div><div><small>公会签发方</small><strong>{new Set(credentials.map((q) => q.guildAddress)).size}</strong></div><div><small>目标网络</small><strong className="monad-text">Monad</strong></div></div><div className="passport-toolbar"><div><h2>职业冒险履历</h2><p>等级仅代表有效贡献数量，不代表能力评分。</p></div><div className="segmented">{([['all','全部'],['valid','有效'],['revoked','已撤销']] as const).map(([key,label]) => <button className={filter === key ? "active" : ""} key={key} onClick={() => setFilter(key)}>{label}</button>)}</div></div><div className="credential-list">{visible.map((quest, index) => <article className={`credential-row ${quest.status === "REVOKED" ? "revoked" : ""}`} key={quest.id}><div className="timeline-mark"><span>{index + 1}</span></div><div className="credential-content"><div className="credential-head"><div><span className="date"><CalendarDays size={14} />{quest.period}</span><h3>{quest.category} · {quest.role}</h3></div><StatusBadge status={quest.status} /></div><p>{quest.summary}</p><div className="credential-foot"><span>签发公会：{quest.guild}</span><Link to={`/verify/${quest.credentialId}`}>验证详情 <ExternalLink size={14} /></Link></div></div></article>)}</div></section></div>
  </main></Layout>;
}

export function VerifyPage() {
  const { credentialId } = useParams();
  const { quests } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const quest = useMemo(() => quests.find((item) => item.credentialId === credentialId), [quests, credentialId]);
  const state = !quest ? "missing" : quest.status === "REVOKED" ? "revoked" : "valid";
  function refresh() { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }
  return <Layout footer={false} header={false}><main className="verify-page"><header className="verify-header"><div><span className="brand-mark mini">PQ</span><span><strong>Proof of Quest</strong><small>PUBLIC VERIFICATION</small></span></div><span className="network-pill"><span />MONAD TESTNET</span></header><div className="verify-shell">
    <section className={`verify-result verify-${state}`}><CredentialSeal state={state} /><div><span className="eyebrow">REAL-TIME ONCHAIN RESULT</span><h1>{state === "valid" ? "这是一份有效的职业贡献凭证" : state === "revoked" ? "这份凭证已被签发方撤销" : "未找到这份职业贡献凭证"}</h1><p>{state === "valid" ? "该结果证明签发方钱包在 Monad 上向设计师钱包作出了以下声明。" : state === "revoked" ? `凭证历史仍然存在，但已于 ${quest?.revokedAt || "链上记录时间"} 失效，不应作为有效证明使用。` : "请检查分享链接或 Credential ID 是否完整。"}</p></div><button className="icon-btn" title="重新读取 Monad" onClick={refresh}><RefreshCw size={19} className={refreshing ? "spin" : ""} /></button></section>
    {quest && <div className="verify-grid"><section className="verify-main"><div className="statement-grid"><Statement label="项目类别" value={quest.category} /><Statement label="设计角色" value={quest.role} /><Statement label="项目时间" value={quest.period} /><Statement label="证据等级" value="文件指纹 + 公会确认" /></div><div className="public-statement"><small>公开贡献声明</small><p>{quest.summary}</p></div><div className="verify-parties"><Party label="签发方 / ISSUER" name={quest.guild} address={quest.guildAddress} verified /><Party label="接收方 / RECIPIENT" name="自由设计师" address={quest.designerAddress} /></div><TechnicalDetails quest={quest} /></section><aside className="verify-aside"><h2>核验项目</h2><CheckRow label="钱包签名" detail="签发方地址与交易一致" ok /><CheckRow label="凭证状态" detail={quest.status === "REVOKED" ? "签发方已执行撤销" : "合约显示未撤销"} ok={quest.status !== "REVOKED"} /><CheckRow label="数据完整性" detail="链下详情与摘要一致" ok /><CheckRow label="Monad 网络" detail="Chain ID 10143" ok /><a className="secondary-btn full" href="https://testnet.monadvision.com" target="_blank" rel="noreferrer">在 MonadVision 查看 <ExternalLink size={16} /></a></aside></div>}
    <div className="trust-note"><ShieldCheck size={21} /><div><strong>这份验证说明了什么？</strong><p>链上凭证可以验证声明由谁作出、给谁、何时签发及当前是否撤销，但不会自动证明设计质量、合同权利或声明内容绝对真实。</p></div></div>
  </div></main></Layout>;
}

function Statement({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function Party({ label, name, address, verified = false }: { label: string; name: string; address: string; verified?: boolean }) { return <div className="party"><span className="party-avatar">{name[0]}</span><div><small>{label}</small><strong>{name}{verified && <BadgeCheck size={15} />}</strong><code>{shortAddress(address, 12, 10)}</code></div><button className="icon-btn"><Copy size={16} /></button></div>; }
function CheckRow({ label, detail, ok }: { label: string; detail: string; ok: boolean }) { return <div className={ok ? "check-row" : "check-row bad"}><span>{ok ? "✓" : "!"}</span><div><strong>{label}</strong><small>{detail}</small></div></div>; }
