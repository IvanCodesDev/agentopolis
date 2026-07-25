import { useEffect, useMemo, useRef, useState } from "react";
import { createWorldGame } from "./game/WorldGame";
import { WORLD_INTERACT_EVENT } from "./game/events";
import type {
  Actor,
  Credential,
  ProjectRecord,
  StoryStage,
  WorldEvent,
} from "./types";

const DESIGNER = "0x54B7…Ce1f2";
const GUILD = "0xA11C…09D3";

const STAGES: StoryStage[] = [
  "INTRO",
  "TASK_CREATED",
  "DESIGNER_INVITED",
  "QUEST_ACCEPTED",
  "V1_SUBMITTED",
  "REVISION_REQUESTED",
  "V2_SUBMITTED",
  "WORK_APPROVED",
  "ATTESTING",
  "CREDENTIAL_ISSUED",
  "PORTFOLIO_SHARED",
  "HR_VERIFIED",
];

const STAGE_LABELS: Record<StoryStage, string> = {
  INTRO: "设计师的隐形劳动",
  TASK_CREATED: "工作室创建匿名任务",
  DESIGNER_INVITED: "设计师已收到邀请",
  QUEST_ACCEPTED: "设计师正在执行任务",
  V1_SUBMITTED: "V1 已提交，等待反馈",
  REVISION_REQUESTED: "工作室提出具体修改",
  V2_SUBMITTED: "V2 已提交，等待验收",
  WORK_APPROVED: "项目验收通过",
  ATTESTING: "Monad 正在记录贡献",
  CREDENTIAL_ISSUED: "职业贡献凭证已生效",
  PORTFOLIO_SHARED: "凭证已加入求职档案",
  HR_VERIFIED: "HR 已独立完成核验",
  CREDENTIAL_REVOKED: "凭证已撤销，历史保留",
};

const STORY_LOGS: Array<{
  stage: StoryStage;
  speaker: string;
  text: string;
}> = [
  {
    stage: "INTRO",
    speaker: "林沐",
    text: "这些作品确实由我完成，但聊天截图里有客户和报价，我不能直接交给招聘方。",
  },
  {
    stage: "TASK_CREATED",
    speaker: "岚姐 · 工作室",
    text: "客户找我们做新品详情页。我会继续承担沟通和交付责任，同时为实际执行者留下匿名贡献记录。",
  },
  {
    stage: "DESIGNER_INVITED",
    speaker: "系统",
    text: "匿名任务已发送给林沐：只公开项目类别、执行角色与时间，不公开客户和利润。",
  },
  {
    stage: "QUEST_ACCEPTED",
    speaker: "林沐",
    text: "我接受详情页执行设计任务。客户仍由工作室对接，我只负责约定的视觉交付。",
  },
  {
    stage: "V1_SUBMITTED",
    speaker: "林沐",
    text: "V1 已提交。源文件留在私密空间，系统只记录验收版本的数字指纹。",
  },
  {
    stage: "REVISION_REQUESTED",
    speaker: "岚姐 · 工作室",
    text: "首屏卖点不够突出，参数区需要统一成三列网格。请按真实反馈完成第二版。",
  },
  {
    stage: "V2_SUBMITTED",
    speaker: "林沐",
    text: "V2 已按反馈重做信息层级并提交，新版本产生了新的文件指纹。",
  },
  {
    stage: "WORK_APPROVED",
    speaker: "岚姐 · 工作室",
    text: "V2 已经通过客户交付标准。我确认林沐实际完成了这部分设计工作。",
  },
  {
    stage: "ATTESTING",
    speaker: "Monad",
    text: "正在记录工作室签名、设计师地址、匿名贡献声明、证据哈希与凭证状态。",
  },
  {
    stage: "CREDENTIAL_ISSUED",
    speaker: "系统",
    text: "职业贡献凭证已生效。它不可转让，但签发方发现错误时可以撤销。",
  },
  {
    stage: "PORTFOLIO_SHARED",
    speaker: "林沐",
    text: "我把验证入口放进求职档案。HR 不会看到客户资料，也不需要相信我的截图。",
  },
  {
    stage: "HR_VERIFIED",
    speaker: "陈经理 · HR",
    text: "我确认光合设计工作室曾签发这条记录，内容未被修改且当前没有撤销。作品水平仍由面试判断。",
  },
  {
    stage: "CREDENTIAL_REVOKED",
    speaker: "系统",
    text: "凭证已经撤销。原始内容和历史仍被保留，旧验证入口会立即显示失效状态。",
  },
];

const STORY_GUIDES: Record<
  StoryStage,
  {
    chapter: string;
    title: string;
    story: string;
    actor: Actor;
    destination: string;
    action: string;
  }
> = {
  INTRO: {
    chapter: "序章",
    title: "有作品，却没有可信经历",
    story: "林沐完成过不少商业设计，但项目署名属于上游，聊天截图又包含不能公开的客户资料。",
    actor: "designer",
    destination: "设计师小屋 / 无署名作品墙",
    action: "靠近小屋按 E，了解她为什么需要贡献凭证。",
  },
  TASK_CREATED: {
    chapter: "第一章",
    title: "工作室收到真实客户订单",
    story: "光合设计工作室负责获客、报价和客户沟通。它不会被平台取代，只把部分执行工作匿名派给林沐。",
    actor: "guild",
    destination: "任务公会",
    action: "切换为工作室，前往公会创建邀请。",
  },
  DESIGNER_INVITED: {
    chapter: "第二章",
    title: "设计师确认公开边界",
    story: "邀请只包含电商详情页、执行设计师和截止时间，不包含客户名称、报价与利润。",
    actor: "designer",
    destination: "任务公会 / 甲方联络人",
    action: "切换为设计师，查看范围并接受任务。",
  },
  QUEST_ACCEPTED: {
    chapter: "第三章",
    title: "第一次真实交付",
    story: "林沐开始制作六张详情页。原始设计文件留在私密空间，只为验收版本生成数字指纹。",
    actor: "designer",
    destination: "设计工作台",
    action: "前往工作台，填写匿名摘要并提交 V1。",
  },
  V1_SUBMITTED: {
    chapter: "第四章",
    title: "贡献不是一次点击",
    story: "现实项目通常需要多轮修改。工作室需要对交付质量和最终客户负责，因此可以验收或驳回。",
    actor: "guild",
    destination: "验收签发台",
    action: "切换为工作室，检查 V1 并发送具体修改意见。",
  },
  REVISION_REQUESTED: {
    chapter: "第五章",
    title: "可追溯的修改过程",
    story: "工作室要求强化首屏卖点、统一参数网格。反馈证明了真实协作过程，但客户资料仍不会公开。",
    actor: "designer",
    destination: "反馈邮局 / 设计工作台",
    action: "切换为设计师，阅读反馈并提交具有新哈希的 V2。",
  },
  V2_SUBMITTED: {
    chapter: "第六章",
    title: "工作室承担验收责任",
    story: "第二版已经响应真实反馈。只有直接管理并验收任务的工作室，才有资格确认这段贡献。",
    actor: "guild",
    destination: "验收签发台",
    action: "切换为工作室，确认 V2 达到交付标准。",
  },
  WORK_APPROVED: {
    chapter: "第七章",
    title: "把验收转化为职业凭证",
    story: "报酬解决当次交易，凭证则结算长期职业价值。签名前必须预览所有永久公开字段。",
    actor: "guild",
    destination: "验收签发台",
    action: "以工作室钱包签发 Monad 贡献凭证。",
  },
  ATTESTING: {
    chapter: "链上确认",
    title: "Monad 正在记录声明",
    story: "链上记录签发者、设计师、贡献摘要、证据哈希与状态，不保存客户和设计源文件。",
    actor: "guild",
    destination: "原地等待",
    action: "等待交易确认，不要重复签发。",
  },
  CREDENTIAL_ISSUED: {
    chapter: "第八章",
    title: "隐形劳动成为职业记忆",
    story: "凭证已经生效，但不会自动公开全部项目。是否用于求职仍由设计师决定。",
    actor: "designer",
    destination: "职业档案馆",
    action: "切换为设计师，把匿名验证入口加入求职档案。",
  },
  PORTFOLIO_SHARED: {
    chapter: "第九章",
    title: "招聘方收到可核验经历",
    story: "HR看到的不再是一张孤立截图，而是一条由工作室签发、状态可实时读取的贡献声明。",
    actor: "visitor",
    destination: "招聘大厅 · HR",
    action: "切换为 HR 访客，在没有钱包的情况下完成核验。",
  },
  HR_VERIFIED: {
    chapter: "终章",
    title: "证明事实，不替代专业判断",
    story: "HR确认工作室确实作出过这项声明；作品水平、版权和录用决定仍由作品评审与面试判断。",
    actor: "visitor",
    destination: "Monad 记忆碑",
    action: "故事主线完成。可切换工作室，在记忆碑演示错误凭证撤销。",
  },
  CREDENTIAL_REVOKED: {
    chapter: "异常结局",
    title: "撤销不会抹去历史",
    story: "旧凭证仍可被查到，但所有验证者都会看到它已经失效，不能继续作为有效证明使用。",
    actor: "visitor",
    destination: "Monad 记忆碑",
    action: "以 HR 身份查看撤销结果，或重置 Demo 重新体验。",
  },
};

const INITIAL_PROJECT: ProjectRecord = {
  title: "电商品牌视觉设计",
  category: "电商详情页",
  role: "详情页执行设计师",
  issuerName: "光合设计工作室",
  designerName: "林沐",
  brief: "为一款尚未公开的生活方式产品完成 6 张详情页视觉排版。客户身份、合同金额和工作室差价均保持私密。",
  deadline: "2026-07-29 18:00",
  publicSummary: "完成 6 个商品详情页的视觉排版、组件规范与两轮修改",
  revisionFeedback:
    "V1 信息层级不够清晰：请强化首屏卖点，将参数区统一为三列网格，并降低装饰元素对商品主体的干扰。",
  currentVersion: 0,
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function App() {
  const gameRoot = useRef<HTMLDivElement>(null);
  const [actor, setActor] = useState<Actor>("designer");
  const [stage, setStage] = useState<StoryStage>("INTRO");
  const [dialog, setDialog] = useState<React.ReactNode>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [project, setProject] = useState<ProjectRecord>(INITIAL_PROJECT);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!gameRoot.current) return;
    const game = createWorldGame(gameRoot.current);
    return () => game.destroy(true);
  }, []);

  const progress = useMemo(() => {
    if (stage === "CREDENTIAL_REVOKED") return 100;
    return Math.max(5, ((STAGES.indexOf(stage) + 1) / STAGES.length) * 100);
  }, [stage]);

  const visibleLogs = useMemo(() => {
    const current = stage === "CREDENTIAL_REVOKED" ? STAGES.length : STAGES.indexOf(stage);
    return STORY_LOGS.filter((entry) => {
      if (entry.stage === "CREDENTIAL_REVOKED") return stage === "CREDENTIAL_REVOKED";
      return STAGES.indexOf(entry.stage) <= current;
    }).slice(-4);
  }, [stage]);
  const guide = STORY_GUIDES[stage];

  useEffect(() => {
    const listener = (event: Event) => {
      interact((event as CustomEvent<WorldEvent>).detail.zone);
    };
    window.addEventListener(WORLD_INTERACT_EVENT, listener);
    return () => window.removeEventListener(WORLD_INTERACT_EVENT, listener);
  });

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function move(next: StoryStage, message: string) {
    setStage(next);
    setDialog(null);
    notify(message);
  }

  function timeline() {
    const events = [
      ["任务创建", "工作室将客户信息留在链下，仅发布匿名类别与角色", "TASK_CREATED"],
      ["任务邀请", `邀请设计师 ${DESIGNER}`, "DESIGNER_INVITED"],
      ["接受任务", "设计师确认角色与公开信息边界", "QUEST_ACCEPTED"],
      ["提交 V1", "提交文件指纹，不公开源文件", "V1_SUBMITTED"],
      ["修改反馈", "工作室记录可执行的修改意见", "REVISION_REQUESTED"],
      ["提交 V2", "新版本产生新的 SHA-256 指纹", "V2_SUBMITTED"],
      ["验收完成", "工作室确认真实贡献", "WORK_APPROVED"],
      ["链上签发", "Monad 保存签发者、接收者、声明与状态", "CREDENTIAL_ISSUED"],
    ] as const;
    const current = STAGES.indexOf(stage);
    return (
      <div className="chain-preview">
        {events.map(([name, detail, eventStage]) => (
          <span key={name}>
            <strong>
              {STAGES.indexOf(eventStage) <= current ? "●" : "○"} {name}
            </strong>
            <small>{detail}</small>
          </span>
        ))}
      </div>
    );
  }

  function interact(zone: WorldEvent["zone"]) {
    if (zone === "home" || zone === "portfolio") {
      setDialog(
        <Dialog title="自由设计师的小屋 · 求职档案" onClose={() => setDialog(null)}>
          <p>
            林沐做过许多真实商业项目，但客户只认识工作室，作品又受保密约束。
            过去她求职只能交聊天截图，HR 无法判断截图是否完整、项目由谁验收。
          </p>
          <div className="quest-card">
            <span>作品墙</span>
            <strong>12 个作品 · 0 条第三方可核验经历</strong>
            <small>“能看到作品”不等于“能证明我真实参与并完成了项目”。</small>
          </div>
          {stage === "INTRO" && (
            <button onClick={() => move("TASK_CREATED", "工作室收到客户订单，开始创建匿名任务")}>
              进入真实外包故事
            </button>
          )}
          {zone === "portfolio" && (
            <p className="muted">
              墙上的视觉稿能够展示审美，却没有签发方、验收时间和撤销状态。
            </p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "guild" || zone === "client") {
      const guildCanInvite = actor === "guild" && stage === "TASK_CREATED";
      const designerCanAccept = actor === "designer" && stage === "DESIGNER_INVITED";
      setDialog(
        <Dialog
          title={zone === "client" ? "甲方联络人 · 商业信息边界" : "委托公会 · 光合设计工作室"}
          onClose={() => setDialog(null)}
        >
          <div className="quest-card">
            <span>进行中 · {project.category}</span>
            <strong>{project.title}</strong>
            <small>角色：{project.role}　截止：{project.deadline}</small>
          </div>
          <p>{project.brief}</p>
          <div className="chain-preview">
            <span>客户身份</span><strong>已隐藏</strong>
            <span>项目报价</span><strong>仅工作室可见</strong>
            <span>链上公开</span><strong>类别、角色、摘要、哈希</strong>
          </div>
          {guildCanInvite && (
            <button onClick={() => move("DESIGNER_INVITED", "工作室已向林沐发出一次性任务邀请")}>
              以工作室身份邀请设计师
            </button>
          )}
          {designerCanAccept && (
            <button onClick={() => move("QUEST_ACCEPTED", "林沐已接受任务，客户关系仍归工作室管理")}>
              确认范围并接受任务
            </button>
          )}
          {!guildCanInvite && !designerCanAccept && (
            <p className="muted">
              {stage === "TASK_CREATED"
                ? "切换至“公会”身份发送邀请。"
                : stage === "DESIGNER_INVITED"
                  ? "切换至“设计师”身份接受邀请。"
                  : "任务关系已建立；完整流转记录不会改变原有客户关系。"}
            </p>
          )}
          {stage !== "INTRO" && timeline()}
        </Dialog>,
      );
      return;
    }

    if (zone === "workshop" || zone === "feedback") {
      const canSubmitV1 = actor === "designer" && stage === "QUEST_ACCEPTED";
      const canSubmitV2 = actor === "designer" && stage === "REVISION_REQUESTED";
      setDialog(
        <Dialog
          title={zone === "feedback" ? "反馈邮局 · V1 → V2" : "像素工作台 · 版本交付"}
          onClose={() => setDialog(null)}
        >
          <label>
            可公开贡献摘要
            <textarea
              value={project.publicSummary}
              onChange={(event) =>
                setProject({ ...project, publicSummary: event.target.value })
              }
              maxLength={140}
            />
          </label>
          <p className="privacy">原始文件只用于双方验收；公开记录只保存不可逆文件指纹。</p>
          {stage === "REVISION_REQUESTED" && (
            <div className="quest-card">
              <span>工作室反馈 · 需要修改</span>
              <strong>V1 未通过</strong>
              <small>{project.revisionFeedback}</small>
            </div>
          )}
          {(canSubmitV1 || canSubmitV2) && (
            <button
              onClick={async () => {
                const version = canSubmitV1 ? 1 : 2;
                const hash = await sha256(
                  `private-design-file:v${version}:${project.publicSummary}`,
                );
                setProject({ ...project, currentVersion: version, evidenceHash: hash });
                sessionStorage.setItem("proof-of-quest:evidence", hash);
                move(
                  version === 1 ? "V1_SUBMITTED" : "V2_SUBMITTED",
                  `V${version} 已提交，成果指纹：${hash.slice(0, 14)}…`,
                );
              }}
            >
              生成 V{canSubmitV1 ? "1" : "2"} 指纹并提交
            </button>
          )}
          {!canSubmitV1 && !canSubmitV2 && (
            <p className="muted">
              {actor !== "designer"
                ? "只有受邀设计师可以交付版本。"
                : stage === "V1_SUBMITTED"
                  ? "V1 已送达，等待工作室查看。"
                  : stage === "V2_SUBMITTED"
                    ? "V2 已送达，等待最终验收。"
                    : "请先接受任务，或等待工作室反馈。"}
            </p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "altar") {
      const canReject = actor === "guild" && stage === "V1_SUBMITTED";
      const canApprove = actor === "guild" && stage === "V2_SUBMITTED";
      const canIssue = actor === "guild" && stage === "WORK_APPROVED";
      setDialog(
        <Dialog title="公会验收台 · 贡献确认" onClose={() => setDialog(null)}>
          <div className="quest-card">
            <span>当前交付版本 · V{project.currentVersion || "—"}</span>
            <strong>{project.title}</strong>
            <small>{project.evidenceHash?.slice(0, 28) ?? "尚无成果指纹"}…</small>
          </div>
          {canReject && (
            <>
              <p><strong>审核意见：</strong>{project.revisionFeedback}</p>
              <button onClick={() => move("REVISION_REQUESTED", "V1 已驳回；具体反馈已发送给设计师")}>
                驳回 V1 并发送修改意见
              </button>
            </>
          )}
          {canApprove && (
            <button onClick={() => move("WORK_APPROVED", "V2 验收通过；贡献事实等待工作室签名")}>
              确认 V2 完成交付
            </button>
          )}
          {canIssue && (
            <>
              <div className="chain-preview">
                <span>Network</span><strong>Monad Testnet</strong>
                <span>Issuer</span><strong>{GUILD}</strong>
                <span>Recipient</span><strong>{DESIGNER}</strong>
                <span>Evidence</span><strong>{project.evidenceHash?.slice(0, 18)}…</strong>
              </div>
              <button
                onClick={() => {
                  setStage("ATTESTING");
                  notify("签名已确认，正在等待 Monad 测试网确认");
                  window.setTimeout(() => {
                    const id = `0x${crypto.randomUUID().replace(/-/g, "")}`;
                    setCredential({
                      id,
                      issuer: GUILD,
                      designer: DESIGNER,
                      projectCategory: project.category,
                      role: project.role,
                      publicSummary: project.publicSummary,
                      evidenceHash: project.evidenceHash ?? "0x",
                      issuedAt: new Date().toLocaleString("zh-CN"),
                      network: "Monad Testnet",
                      transactionHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
                      verificationCount: 0,
                      inPortfolio: false,
                      revoked: false,
                    });
                    setStage("CREDENTIAL_ISSUED");
                    setDialog(null);
                    notify("Monad 已确认签发；职业记忆碑被点亮");
                  }, 900);
                }}
              >
                预览公开字段并签发 Monad 凭证
              </button>
            </>
          )}
          {!canReject && !canApprove && !canIssue && (
            <p className="muted">
              {stage === "ATTESTING"
                ? "Monad 交易确认中，请勿重复签发。"
                : actor !== "guild"
                  ? "切换至“公会”身份完成反馈、验收与签发。"
                  : "当前没有等待公会处理的交付。"}
            </p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "archive") {
      const canShare = actor === "designer" && stage === "CREDENTIAL_ISSUED";
      setDialog(
        <Dialog title="职业档案馆 · 设计师求职材料" onClose={() => setDialog(null)}>
          <div className="quest-card">
            <span>林沐 · 自由设计师</span>
            <strong>{credential ? "1 条可验证经历" : "尚无可验证经历"}</strong>
            <small>作品集负责展示能力，职业凭证负责补充真实协作上下文。</small>
          </div>
          {credential && (
            <div className="chain-preview">
              <span>项目类别</span><strong>{credential.projectCategory}</strong>
              <span>实际角色</span><strong>{credential.role}</strong>
              <span>签发工作室</span><strong>光合设计工作室</strong>
              <span>客户与报价</span><strong>未披露</strong>
            </div>
          )}
          {canShare && (
            <button
              onClick={() => {
                setCredential((item) => item && { ...item, inPortfolio: true });
                move("PORTFOLIO_SHARED", "凭证验证入口已加入林沐的求职档案");
              }}
            >
              将匿名凭证加入求职档案
            </button>
          )}
          {stage === "PORTFOLIO_SHARED" && (
            <p className="privacy">
              HR将看到贡献声明、签发者、哈希和状态；不会看到客户名、报价或源文件。
            </p>
          )}
          {!canShare && stage !== "PORTFOLIO_SHARED" && (
            <p className="muted">完成工作室验收和 Monad 签发后，才可生成可信求职入口。</p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "hr") {
      const canVerify =
        actor === "visitor" &&
        Boolean(credential?.inPortfolio) &&
        (stage === "PORTFOLIO_SHARED" || stage === "HR_VERIFIED");
      setDialog(
        <Dialog title="招聘大厅 · HR 无钱包核验" onClose={() => setDialog(null)}>
          <p>
            陈经理正在招聘电商视觉设计师。过去他只能看到候选人的作品和聊天截图，
            很难确认候选人在真实项目中承担了什么角色。
          </p>
          {credential?.inPortfolio ? (
            <>
              <div className={`credential ${credential.revoked ? "revoked" : ""}`}>
                <div className="credential-status">
                  {credential.revoked ? "已撤销" : "等待 HR 核验"}
                </div>
                <h3>{credential.projectCategory}</h3>
                <p>{credential.publicSummary}</p>
                <dl>
                  <dt>签发者</dt><dd>{credential.issuer}</dd>
                  <dt>接收者</dt><dd>{credential.designer}</dd>
                  <dt>项目角色</dt><dd>{credential.role}</dd>
                  <dt>网络</dt><dd>Monad Testnet</dd>
                </dl>
              </div>
              {canVerify && stage !== "HR_VERIFIED" && (
                <button
                  onClick={() => {
                    setCredential({ ...credential, verificationCount: 1 });
                    move("HR_VERIFIED", "HR 无需钱包，已从 Monad 独立读取凭证状态");
                  }}
                >
                  以 HR 身份独立核验
                </button>
              )}
              {stage === "HR_VERIFIED" && (
                <div className="chain-preview">
                  <span>签发钱包</span><strong>有效</strong>
                  <span>数据完整性</span><strong>有效</strong>
                  <span>撤销状态</span><strong>未撤销</strong>
                  <span>合理结论</span><strong>工作室确曾确认该贡献</strong>
                </div>
              )}
            </>
          ) : (
            <p className="muted">设计师尚未把凭证加入求职档案，HR无权查看私密项目材料。</p>
          )}
          {actor !== "visitor" && (
            <p className="privacy">切换到“HR访客”身份，体验无需钱包的第三方核验。</p>
          )}
        </Dialog>,
      );
      return;
    }

    setDialog(
      <Dialog title="职业记忆碑 · 公开核验" onClose={() => setDialog(null)}>
        {!credential ? (
          <p>尚无链上贡献凭证。石碑不会根据平台自述提前点亮。</p>
        ) : (
          <>
            <div className={`credential ${credential.revoked ? "revoked" : ""}`}>
              <div className="credential-status">
                {credential.revoked ? "已撤销 · 不应继续使用" : "凭证已验证 · 链上有效"}
              </div>
              <h3>{credential.projectCategory}</h3>
              <p>{credential.publicSummary}</p>
              <dl>
                <dt>签发方</dt><dd>{credential.issuer}</dd>
                <dt>设计师</dt><dd>{credential.designer}</dd>
                <dt>项目角色</dt><dd>{credential.role}</dd>
                <dt>网络</dt><dd>{credential.network}</dd>
                <dt>证据哈希</dt><dd>{credential.evidenceHash.slice(0, 22)}…</dd>
                <dt>交易哈希</dt><dd>{credential.transactionHash.slice(0, 22)}…</dd>
                <dt>签发时间</dt><dd>{credential.issuedAt}</dd>
              </dl>
            </div>
            {stage === "HR_VERIFIED" && (
              <div className="chain-preview">
                <span>签名归属</span><strong>有效</strong>
                <span>数据完整性</span><strong>有效</strong>
                <span>撤销状态</span><strong>未撤销</strong>
                <span>核验结论</span><strong>工作室确曾作出该贡献声明</strong>
              </div>
            )}
            <p className="muted">
              核验确认“谁作出了什么声明，以及声明是否被修改或撤销”；不替代 HR
              对设计质量、版权和候选人能力的判断。
            </p>
            {actor === "guild" && !credential.revoked && (
              <button
                className="danger"
                onClick={() => {
                  setCredential({ ...credential, revoked: true });
                  move("CREDENTIAL_REVOKED", "凭证已撤销；原始内容和核验历史仍被保留");
                }}
              >
                演示：发现误签后撤销凭证
              </button>
            )}
          </>
        )}
      </Dialog>,
    );
  }

  function resetDemo() {
    setStage("INTRO");
    setCredential(null);
    setProject(INITIAL_PROJECT);
    setActor("designer");
    sessionStorage.clear();
    notify("完整故事 Demo 已重置");
  }

  return (
    <main>
      <header className="hud">
        <div>
          <span className="eyebrow">MONAD TESTNET · DESIGNER STORY</span>
          <strong>{STAGE_LABELS[stage]}</strong>
        </div>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <div className="actor-switcher">
          {(["designer", "guild", "visitor"] as Actor[]).map((item) => (
            <button
              className={actor === item ? "active" : ""}
              onClick={() => setActor(item)}
              key={item}
            >
              {item === "designer" ? "设计师" : item === "guild" ? "工作室" : "HR访客"}
            </button>
          ))}
          <button onClick={resetDemo}>重置</button>
        </div>
      </header>

      <section className="game-shell">
        <div ref={gameRoot} className="game-root" />
        <aside className="story-guide">
          <div className="guide-heading">
            <span>{guide.chapter}</span>
            <strong>{guide.title}</strong>
          </div>
          <p>{guide.story}</p>
          <div className="guide-objective">
            <span>下一站</span>
            <strong>◆ {guide.destination}</strong>
            <small>{guide.action}</small>
          </div>
          {actor !== guide.actor && stage !== "HR_VERIFIED" && (
            <button onClick={() => setActor(guide.actor)}>
              切换为
              {guide.actor === "designer"
                ? "设计师"
                : guide.actor === "guild"
                  ? "工作室"
                  : "HR访客"}
            </button>
          )}
        </aside>
        <div className="controls">
          WASD / 方向键移动 · E 互动 · 按故事提示切换设计师 / 工作室 / HR
        </div>
      </section>

      <section className="story-console">
        <div className="cast-panel">
          <span className="console-label">STORY CHARACTERS</span>
          <div className="cast-list">
            <div><i className="avatar designer-avatar" /><span>林沐<small>自由设计师</small></span></div>
            <div><i className="avatar guild-avatar" /><span>岚姐<small>工作室负责人</small></span></div>
            <div><i className="avatar hr-avatar" /><span>陈经理<small>招聘方 HR</small></span></div>
          </div>
        </div>
        <div className="log-panel" aria-live="polite">
          <span className="console-label">STORY LOG · {visibleLogs.length}/4</span>
          {visibleLogs.map((entry) => (
            <p key={entry.stage}>
              <strong>{entry.speaker}</strong>
              <span>{entry.text}</span>
            </p>
          ))}
        </div>
      </section>

      {dialog}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-title">
          <h2>{title}</h2>
          <button className="close" onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default App;
