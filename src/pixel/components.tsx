import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BadgeCheck, BriefcaseBusiness, Check, ChevronRight, CircleAlert, Copy, ExternalLink,
  FileCheck2, Fingerprint, LogOut, Menu, Network, RotateCcw, ScrollText, ShieldCheck,
  Sparkles, Upload, UserRound, Wallet, X, XCircle,
} from "lucide-react";
import { useApp } from "./state";
import type { Quest, QuestStatus } from "./types";
import { copyText, shortAddress } from "./utils";

export const statusLabels: Record<QuestStatus, string> = {
  INVITED: "待接受", ACCEPTED: "进行中", SUBMITTED: "待验收", APPROVED: "待铭刻",
  ISSUING: "链上确认中", ISSUED: "已签发", REVOKED: "已撤销",
};

export function WorldHeader() {
  const { role, setRole, walletConnected, walletAddress, connectWallet, resetDemo } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="world-header">
    <Link className="brand" to="/" aria-label="Proof of Quest 首页">
      <span className="brand-mark">PQ</span>
      <span><strong>Proof of Quest</strong><small>MONAD CAREER PROOF</small></span>
    </Link>
    <nav className={menuOpen ? "nav open" : "nav"} aria-label="主导航">
      <NavLink to="/"><ScrollText size={17} />公告板</NavLink>
      <NavLink to="/quests/PQ-014"><BriefcaseBusiness size={17} />当前任务</NavLink>
      <NavLink to="/passport/0x71a2"><UserRound size={17} />冒险护照</NavLink>
    </nav>
    <div className="header-actions">
      <div className="network-pill" title="Monad Testnet · Chain ID 10143"><span />MONAD 10143</div>
      <div className="role-switch" aria-label="切换演示角色">
        <button className={role === "designer" ? "active" : ""} onClick={() => setRole("designer")}>设计师</button>
        <button className={role === "guild" ? "active" : ""} onClick={() => setRole("guild")}>公会</button>
      </div>
      <button className="wallet-btn" onClick={connectWallet}>
        <Wallet size={17} />{walletConnected ? shortAddress(walletAddress) : "连接钱包"}
      </button>
      <button className="icon-btn reset-btn" title="重置演示" onClick={resetDemo}><RotateCcw size={17} /></button>
      <button className="icon-btn menu-btn" title="打开导航" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button>
    </div>
  </header>;
}

export function Layout({ children, footer = true, header = true }: { children: ReactNode; footer?: boolean; header?: boolean }) {
  return <div className="app-shell">{header && <WorldHeader />}{children}{footer && <ChainFooter />}</div>;
}

export function ChainFooter() {
  const [rpcState, setRpcState] = useState<"checking" | "online" | "offline">("checking");
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://testnet-rpc.monad.xyz", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      signal: controller.signal,
    }).then((response) => response.json()).then((data) => setRpcState(data.result === "0x279f" ? "online" : "offline")).catch(() => setRpcState("offline"));
    return () => controller.abort();
  }, []);
  return <footer className="chain-footer">
    <span><span className={`live-dot ${rpcState}`} />Monad Testnet {rpcState === "checking" ? "检查中" : rpcState === "online" ? "在线" : "暂不可达"}</span>
    <span>合约 <code>0x8A7c...91F2</code></span>
    <span>RPC 状态 <strong>{rpcState === "online" ? "已核对 chain 10143" : "不以缓存冒充实时"}</strong></span>
    <a href="https://testnet.monadvision.com" target="_blank" rel="noreferrer">MonadVision <ExternalLink size={13} /></a>
  </footer>;
}

export function Scene({ type, status, compact = false }: { type: "guild" | "studio" | "review" | "passport"; status?: QuestStatus; compact?: boolean }) {
  return <section className={`pixel-scene scene-${type} ${compact ? "compact" : ""}`} aria-label={`${type} 像素场景`}>
    <div className="pixel-sky"><span className="cloud c1" /><span className="cloud c2" /></div>
    <div className="scene-wall"><span className="window" /><span className="banner">M</span></div>
    {type === "guild" && <><div className="notice-board"><i /><i /><i /></div><div className="counter" /></>}
    {type === "studio" && <><div className="desk"><span className="monitor" /></div><div className="shelf" /></>}
    {type === "review" && <><div className="review-desk"><span className="evidence-box" /></div><div className="guild-seal">✓</div></>}
    {type === "passport" && <><div className="passport-book"><span>PQ</span></div><div className="trophy">✦</div></>}
    <PixelHero action={status === "ISSUING" ? "portal" : status === "ISSUED" ? "success" : "idle"} />
    {type !== "passport" && <PixelNpc />}
    <div className="floor-grid" />
    <div className={`monad-portal ${status === "ISSUING" ? "active" : ""}`}><span>M</span></div>
    <div className="scene-caption">
      <span>{type === "guild" ? "公会大厅" : type === "studio" ? "设计工坊" : type === "review" ? "鉴定柜台" : "履历档案室"}</span>
      <small>{type === "guild" ? "QUEST BOARD" : type === "studio" ? "WORK IN PROGRESS" : type === "review" ? "ONCHAIN DESK" : "CAREER ARCHIVE"}</small>
    </div>
  </section>;
}

function PixelHero({ action }: { action: string }) {
  return <div className={`pixel-person hero-person ${action}`} aria-hidden="true"><span className="hair" /><span className="face" /><span className="body" /><span className="arm a1" /><span className="arm a2" /><span className="leg l1" /><span className="leg l2" /><span className="tool" /></div>;
}

function PixelNpc() {
  return <div className="pixel-person npc-person" aria-hidden="true"><span className="hair" /><span className="face" /><span className="body" /><span className="arm a1" /><span className="arm a2" /><span className="leg l1" /><span className="leg l2" /></div>;
}

export function StatusBadge({ status }: { status: QuestStatus }) {
  const Icon = status === "REVOKED" ? XCircle : status === "ISSUED" ? BadgeCheck : status === "ISSUING" ? Sparkles : ScrollText;
  return <span className={`status-badge status-${status.toLowerCase()}`}><Icon size={14} />{statusLabels[status]}</span>;
}

export function QuestProgress({ status }: { status: QuestStatus }) {
  const stages: { key: QuestStatus; label: string }[] = [
    { key: "INVITED", label: "邀请" }, { key: "ACCEPTED", label: "接受" }, { key: "SUBMITTED", label: "提交" },
    { key: "APPROVED", label: "验收" }, { key: "ISSUED", label: "Monad 铭刻" },
  ];
  const normalized = status === "ISSUING" ? "APPROVED" : status === "REVOKED" ? "ISSUED" : status;
  const current = stages.findIndex((item) => item.key === normalized);
  return <div className="quest-progress">{stages.map((stage, index) => <div className={`progress-step ${index <= current ? "done" : ""} ${index === current ? "current" : ""}`} key={stage.key}>
    <span>{index < current ? <Check size={14} /> : index + 1}</span><small>{stage.label}</small>
  </div>)}</div>;
}

export function QuestRow({ quest }: { quest: Quest }) {
  return <article className="quest-row">
    <div className="quest-icon"><ScrollText size={22} /></div>
    <div className="quest-main"><div className="quest-title"><strong>{quest.category}</strong><span>·</span><span>{quest.role}</span></div><p>{quest.guild} · {quest.period}</p></div>
    <StatusBadge status={quest.status} />
    <span className="deadline">{quest.deadline}</span>
    <Link className="icon-btn" title="查看任务" to={`/quests/${quest.id}`}><ChevronRight size={20} /></Link>
  </article>;
}

export function HashValue({ value, label = "SHA-256" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="hash-value"><Fingerprint size={18} /><div><small>{label}</small><code>{value}</code></div><button className="icon-btn" title="复制" onClick={() => { copyText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>;
}

export function CredentialSeal({ state }: { state: "valid" | "revoked" | "missing" | "error" }) {
  const content = state === "valid" ? ["凭证有效", "VALID ON MONAD"] : state === "revoked" ? ["凭证已撤销", "REVOKED"] : state === "missing" ? ["未找到凭证", "NOT FOUND"] : ["暂时无法核验", "RPC ERROR"];
  const Icon = state === "valid" ? ShieldCheck : state === "revoked" ? XCircle : CircleAlert;
  return <div className={`credential-seal seal-${state}`}><Icon size={30} /><strong>{content[0]}</strong><small>{content[1]}</small></div>;
}

export function TechnicalDetails({ quest }: { quest: Quest }) {
  return <details className="technical-details"><summary><Network size={17} />查看链上技术信息<ChevronRight size={17} /></summary><div className="tech-grid">
    <Tech label="网络" value="Monad Testnet · 10143" />
    <Tech label="合约" value="0x8A7c...91F2" />
    <Tech label="Credential ID" value={quest.credentialId || "待生成"} mono />
    <Tech label="交易哈希" value={quest.txHash || "待生成"} mono />
  </div></details>;
}

function Tech({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><small>{label}</small><span className={mono ? "mono" : ""}>{value.length > 32 ? shortAddress(value, 12, 10) : value}</span></div>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><ScrollText size={28} /><strong>{title}</strong><p>{body}</p></div>;
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={19} /></button></header>{children}</section></div>;
}

export function InfoStrip({ icon = "shield", children }: { icon?: "shield" | "file" | "upload"; children: ReactNode }) {
  const Icon = icon === "file" ? FileCheck2 : icon === "upload" ? Upload : ShieldCheck;
  return <div className="info-strip"><Icon size={18} /><span>{children}</span></div>;
}

export function RouteAnnouncer() {
  const location = useLocation();
  return <span className="sr-only" aria-live="polite">当前页面 {location.pathname}</span>;
}
