import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { InfoStrip, Layout, Modal, PageHeading, QuestRow, Scene } from "../components";
import { useApp } from "../state";
import type { QuestStatus } from "../types";

type Filter = "ALL" | "ACTIVE" | "ISSUED" | "REVOKED";

export function BoardPage() {
  const { quests, role, addQuest } = useApp();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const filtered = useMemo(() => quests.filter((quest) => {
    const matchesText = `${quest.category}${quest.role}${quest.guild}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || filter === "ISSUED" && quest.status === "ISSUED" || filter === "REVOKED" && quest.status === "REVOKED" || filter === "ACTIVE" && !["ISSUED", "REVOKED"].includes(quest.status);
    return matchesText && matchesFilter;
  }), [quests, filter, search]);

  return <Layout><main className="page board-page">
    <PageHeading eyebrow="GUILD HALL · MONAD TESTNET" title="冒险公告板" description={role === "designer" ? "接取匿名设计委托，把真实贡献写进可验证的职业履历。" : "发布匿名委托，验收贡献并在 Monad 上完成签发。"} actions={<button className="primary-btn" onClick={() => setCreating(true)}><Plus size={18} />发布新任务</button>} />
    <div className="world-layout">
      <div className="scene-column"><Scene type="guild" /><div className="scene-note"><ShieldCheck size={18} /><div><strong>商业资料保持私密</strong><p>任务过程在链下协作，只有最小贡献声明写入 Monad。</p></div></div></div>
      <section className="workspace board-workspace">
        <div className="toolbar"><div className="segmented" aria-label="任务筛选">{([['ALL','全部'],['ACTIVE','进行中'],['ISSUED','已完成'],['REVOKED','已撤销']] as [Filter,string][]).map(([key, label]) => <button className={filter === key ? "active" : ""} onClick={() => setFilter(key)} key={key}>{label}</button>)}</div><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索任务或公会" /></label></div>
        <div className="section-label"><span><SlidersHorizontal size={15} />{filtered.length} 项任务</span><small>客户、价格与联系方式不会公开</small></div>
        <div className="quest-list">{filtered.map((quest) => <QuestRow quest={quest} key={quest.id} />)}</div>
      </section>
    </div>
  </main>{creating && <CreateQuest onClose={() => setCreating(false)} onCreate={(quest) => { addQuest(quest); setCreating(false); }} />}</Layout>;
}

function CreateQuest({ onClose, onCreate }: { onClose: () => void; onCreate: (quest: any) => void }) {
  const [confidentiality, setConfidentiality] = useState(1);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = `PQ-${Math.floor(20 + Math.random() * 70)}`;
    onCreate({ id, category: data.get("category"), role: data.get("role"), guild: "北岸视觉公会", guildAddress: "0xA431dC896b31F7d221a9EDf491cfcC197Fb53717", designerAddress: String(data.get("wallet")), period: "2026.07.25 - 08.05", deadline: "8 月 5 日", summary: confidentiality === 2 ? "" : String(data.get("summary")), status: "INVITED" as QuestStatus, confidentiality });
  }
  return <Modal title="发布匿名设计委托" onClose={onClose}><form className="form-stack" onSubmit={submit}>
    <InfoStrip>公开字段会永久写入 Monad。请勿填写客户名、价格、联系方式或未发布信息。</InfoStrip>
    <div className="form-grid"><label>项目类别<select name="category"><option>电商视觉设计</option><option>UI 界面</option><option>品牌视觉</option><option>营销海报</option><option>插画</option></select></label><label>设计角色<select name="role"><option>执行设计</option><option>主设计</option><option>UI 执行</option><option>视觉延展</option><option>排版</option></select></label></div>
    <label>设计师钱包地址<input name="wallet" required defaultValue="0x71a2B9E4cD83044f7A65b36f48F681dD06D9f421" /></label>
    <fieldset><legend>保密等级</legend><div className="choice-grid">{[[0,"标准公开","类别、角色和摘要"],[1,"匿名行业","去标识化公开摘要"],[2,"最小披露","仅类别、角色和时间"]].map(([value,title,desc]) => <label className={confidentiality === value ? "choice active" : "choice"} key={value}><input type="radio" name="confidentiality" checked={confidentiality === value} onChange={() => setConfidentiality(Number(value))} /><span><strong>{title}</strong><small>{desc}</small></span></label>)}</div></fieldset>
    <label>公开贡献摘要<textarea name="summary" disabled={confidentiality === 2} required={confidentiality !== 2} placeholder={confidentiality === 2 ? "最小披露模式不公开摘要" : "例如：完成移动端核心流程的高保真界面"} /></label>
    <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>取消</button><button className="primary-btn" type="submit">发布任务卷轴</button></div>
  </form></Modal>;
}
