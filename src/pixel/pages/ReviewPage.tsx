import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, ExternalLink, FileText, ShieldCheck, Sparkles, Stamp, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HashValue, InfoStrip, Layout, Modal, PageHeading, Scene, StatusBadge } from "../components";
import { useApp } from "../state";
import { shortAddress } from "../utils";

type TxStep = "preview" | "wallet" | "broadcast" | "success";

export function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, updateQuest, setQuestStatus } = useApp();
  const quest = quests.find((item) => item.id === id) || quests[0];
  const [confirmed, setConfirmed] = useState(false);
  const [step, setStep] = useState<TxStep>(quest.status === "ISSUED" ? "success" : "preview");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => { if (step !== "wallet") return; const timer = setTimeout(() => setStep("broadcast"), 900); return () => clearTimeout(timer); }, [step]);
  useEffect(() => { if (step !== "broadcast") return; setQuestStatus(quest.id, "ISSUING"); const timer = setTimeout(() => {
    const credentialId = `0x${Array.from({ length: 64 }, (_, index) => "0123456789abcdef"[(index * 7 + quest.id.length) % 16]).join("")}`;
    const txHash = `0x${Array.from({ length: 64 }, (_, index) => "fedcba9876543210"[(index * 5 + quest.id.length) % 16]).join("")}`;
    updateQuest(quest.id, { status: "ISSUED", credentialId, txHash }); setStep("success");
  }, 1700); return () => clearTimeout(timer); }, [step, quest.id, setQuestStatus, updateQuest]);

  return <Layout><main className="page review-page">
    <PageHeading eyebrow={`${quest.id} · GUILD REVIEW`} title="公会验收室" description="确认贡献事实，并预览将永久公开到 Monad 的字段。" actions={<><StatusBadge status={quest.status} /><Link className="secondary-btn" to={`/quests/${quest.id}`}><ArrowLeft size={16} />返回任务</Link></>} />
    <div className="world-layout">
      <div className="scene-column"><Scene type="review" status={quest.status} /><div className="pixel-dialog npc-dialog"><span className="avatar-mini guild-avatar">G</span><p>{step === "success" ? "鉴定完成。贡献凭证已在 Monad 上留下不可篡改的履历。" : "公会只确认真实贡献。客户资料和原始文件不会被送上链。"}</p></div></div>
      <section className="workspace review-workspace">
        {step === "success" ? <SuccessPanel quest={quest} /> : <>
          <div className="review-version"><div className="file-name"><span><FileText size={21} /></span><div><small>最终提交版本 · V2</small><strong>{quest.fileName || "commerce-pages-v2.pdf"}</strong></div><span className="verified-chip"><Check size={14} />指纹一致</span></div>{quest.evidenceHash && <HashValue value={quest.evidenceHash} />}</div>
          <section className="onchain-preview"><header><div><span className="monad-cube">M</span><div><h2>永久公开到 Monad</h2><p>Chain ID 10143 · ProofOfQuestCredential</p></div></div><span className="locked-chip"><ShieldCheck size={14} />只读预览</span></header>
            <div className="preview-grid"><Preview label="签发方 issuer" value={shortAddress(quest.guildAddress, 10, 8)} mono /><Preview label="接收方 recipient" value={shortAddress(quest.designerAddress, 10, 8)} mono /><Preview label="项目类别" value={quest.category} /><Preview label="设计角色" value={quest.role} /><Preview label="项目周期" value={quest.period} /><Preview label="保密等级" value={quest.confidentiality === 2 ? "最小披露" : quest.confidentiality === 1 ? "匿名行业" : "标准公开"} /></div>
            <div className="preview-summary"><small>公开贡献摘要</small><p>{quest.summary || "最小披露模式不公开摘要"}</p></div>
          </section>
          <InfoStrip>Monad 上的凭证证明公会钱包作出了这项声明，不代表平台判断设计质量或版权归属。</InfoStrip>
          <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong>我确认该设计师完成了上述贡献</strong><small>我理解公开字段一旦上链不可删除，只能撤销。</small></span></label>
          {step === "preview" ? <div className="review-actions"><button className="danger-ghost" onClick={() => setRejecting(true)}><XCircle size={17} />驳回修改</button><button className="primary-btn monad-btn" disabled={!confirmed} onClick={() => setStep("wallet")}><Stamp size={18} />确认并铭刻到 Monad</button></div> : <TransactionPanel step={step} />}
        </>}
      </section>
    </div>
  </main>{rejecting && <Modal title="驳回本次提交" onClose={() => setRejecting(false)}><div className="form-stack"><InfoStrip icon="file">驳回不会产生链上凭证，设计师可以根据原因重新提交。</InfoStrip><label>修改原因<textarea placeholder="请说明需要修改的内容" rows={4} /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setRejecting(false)}>取消</button><button className="danger-btn" onClick={() => { setQuestStatus(quest.id, "ACCEPTED"); navigate(`/quests/${quest.id}`); }}>确认驳回</button></div></div></Modal>}</Layout>;
}

function Preview({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><small>{label}</small><strong className={mono ? "mono" : ""}>{value}</strong></div>; }

function TransactionPanel({ step }: { step: "wallet" | "broadcast" }) {
  return <div className="tx-panel"><div className="tx-visual"><span className="tx-ring"><Sparkles size={22} /></span></div><div><strong>{step === "wallet" ? "等待钱包确认" : "交易已广播，Monad 执行中"}</strong><p>{step === "wallet" ? "请在钱包中核对网络、接收方与公开字段。" : "已获得交易哈希，正在等待成功 receipt。请勿重复提交。"}</p><div className="tx-steps"><span className="done"><Check size={13} />模拟通过</span><span className={step === "broadcast" ? "done" : "active"}>{step === "broadcast" ? <Check size={13} /> : <i />}钱包签名</span><span className={step === "broadcast" ? "active" : ""}><i />链上执行</span></div></div></div>;
}

function SuccessPanel({ quest }: { quest: any }) {
  const [revoke, setRevoke] = useState(false);
  const { updateQuest } = useApp();
  return <div className="success-panel"><div className="success-burst"><Stamp size={36} /></div><span className="eyebrow">ONCHAIN SUCCESS</span><h2>贡献凭证已铭刻</h2><p>Monad 已确认交易，履历徽记现在可以被任何人独立验证。</p><div className="success-record"><Preview label="Credential ID" value={shortAddress(quest.credentialId, 14, 12)} mono /><Preview label="交易哈希" value={shortAddress(quest.txHash, 14, 12)} mono /><Preview label="区块网络" value="Monad Testnet · 10143" /><Preview label="当前状态" value="有效 · 未撤销" /></div><div className="button-row"><Link className="primary-btn" to={`/verify/${quest.credentialId}`}>打开公开验证页</Link><a className="secondary-btn" href="https://testnet.monadvision.com" target="_blank" rel="noreferrer">MonadVision <ExternalLink size={16} /></a><button className="danger-ghost" onClick={() => setRevoke(true)}>撤销凭证</button></div>
    {revoke && <Modal title="撤销贡献凭证" onClose={() => setRevoke(false)}><div className="form-stack"><div className="danger-note"><AlertTriangle size={20} /><span><strong>撤销不会删除链上历史</strong>公开验证页将醒目标记凭证失效，原始声明仍然保留。</span></div><label>公开撤销原因<textarea id="reason" rows={3} placeholder="例如：签发字段有误，已重新核对" /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setRevoke(false)}>取消</button><button className="danger-btn" onClick={() => { updateQuest(quest.id, { status: "REVOKED", revokedAt: "刚刚" }); setRevoke(false); }}>确认在 Monad 上撤销</button></div></div></Modal>}
  </div>;
}
