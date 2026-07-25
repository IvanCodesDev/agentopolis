import { useRef, useState } from "react";
import { ArrowLeft, Check, Clock3, FileText, Send, Upload } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { HashValue, InfoStrip, Layout, PageHeading, QuestProgress, Scene, StatusBadge } from "../components";
import { useApp } from "../state";
import { formatBytes, sha256 } from "../utils";

export function QuestPage() {
  const { id } = useParams();
  const { quests, role, updateQuest, setQuestStatus } = useApp();
  const quest = quests.find((item) => item.id === id) || quests[0];
  const [hashing, setHashing] = useState(false);
  const [summary, setSummary] = useState(quest.summary);
  const fileRef = useRef<HTMLInputElement>(null);

  async function chooseFile(file?: File) {
    if (!file) return;
    setHashing(true);
    const hash = await sha256(file);
    updateQuest(quest.id, { fileName: file.name, fileSize: formatBytes(file.size), evidenceHash: hash });
    setHashing(false);
  }

  return <Layout><main className="page quest-page">
    <PageHeading eyebrow={`${quest.id} · ANONYMOUS QUEST`} title={`${quest.category} / ${quest.role}`} description={`${quest.guild} · ${quest.period}`} actions={<><StatusBadge status={quest.status} /><Link className="secondary-btn" to="/"><ArrowLeft size={16} />公告板</Link></>} />
    <QuestProgress status={quest.status} />
    <div className="world-layout">
      <div className="scene-column"><Scene type="studio" status={quest.status} /><div className="pixel-dialog"><span className="avatar-mini">D</span><p>{quest.status === "INVITED" ? "一封匿名设计委托已送达。查看内容后决定是否接取。" : quest.status === "SUBMITTED" ? "成果数字指纹已经封存，正在等待公会鉴定。" : quest.status === "ISSUED" ? "履历徽记已经写入 Monad，去护照里看看吧。" : "专注完成任务，真实贡献会成为你的冒险履历。"}</p></div></div>
      <section className="workspace task-workspace">
        <div className="task-meta"><div><small>任务周期</small><strong><Clock3 size={16} />{quest.period}</strong></div><div><small>保密等级</small><strong>{quest.confidentiality === 2 ? "最小披露" : quest.confidentiality === 1 ? "匿名行业" : "标准公开"}</strong></div><div><small>目标网络</small><strong className="monad-text">Monad 10143</strong></div></div>
        {quest.status === "INVITED" ? <div className="action-panel"><span className="panel-icon"><FileText size={25} /></span><h2>是否接取这项委托？</h2><p>{quest.summary}</p><InfoStrip>接受任务只形成链下协作关系，不会发起交易或消耗 MON。</InfoStrip><div className="button-row"><button className="secondary-btn">拒绝邀请</button><button className="primary-btn" onClick={() => setQuestStatus(quest.id, "ACCEPTED")}><Check size={18} />接受任务</button></div></div> : <>
          <section className="form-section"><div className="section-title"><div><span>01</span><div><h2>公开贡献摘要</h2><p>签发后将永久公开，请使用去标识化描述。</p></div></div><span className="limit">{summary.length}/120</span></div><textarea value={summary} onChange={(event) => setSummary(event.target.value.slice(0, 120))} disabled={["SUBMITTED","APPROVED","ISSUING","ISSUED","REVOKED"].includes(quest.status)} rows={4} /></section>
          <section className="form-section"><div className="section-title"><div><span>02</span><div><h2>成果数字指纹</h2><p>原始文件保存在私有空间，公开页面只显示 SHA-256。</p></div></div></div>
            {!quest.evidenceHash ? <button className="upload-zone" disabled={hashing} onClick={() => fileRef.current?.click()}><Upload size={27} /><strong>{hashing ? "正在计算文件指纹..." : "选择成果文件"}</strong><span>PDF、图片或 ZIP · 文件不会公开</span></button> : <div className="file-result"><div className="file-name"><span><FileText size={21} /></span><div><strong>{quest.fileName}</strong><small>{quest.fileSize} · 浏览器与服务端指纹一致</small></div><Check size={19} className="success-icon" /></div><HashValue value={quest.evidenceHash} /></div>}
            <input ref={fileRef} hidden type="file" onChange={(event) => chooseFile(event.target.files?.[0])} />
          </section>
          <div className="task-actions"><span>{quest.status === "SUBMITTED" ? "已于刚刚提交 · 等待公会验收" : "提交前可继续修改公开摘要"}</span>{quest.status === "ACCEPTED" && <button className="primary-btn" disabled={!quest.evidenceHash || !summary} onClick={() => { updateQuest(quest.id, { summary }); setQuestStatus(quest.id, "SUBMITTED"); }}><Send size={17} />提交公会验收</button>}{role === "guild" && quest.status === "SUBMITTED" && <Link className="primary-btn" to={`/guild/quests/${quest.id}/review`}>进入公会验收室</Link>}{quest.status === "ISSUED" && <Link className="primary-btn" to={`/passport/${quest.designerAddress}`}>查看冒险者护照</Link>}</div>
        </>}
      </section>
    </div>
  </main></Layout>;
}
