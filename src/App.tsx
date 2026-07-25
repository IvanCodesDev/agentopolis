import { useEffect, useMemo, useRef, useState } from "react";
import { createWorldGame } from "./game/WorldGame";
import { WORLD_INTERACT_EVENT } from "./game/events";
import type { Actor, Credential, StoryStage, WorldEvent } from "./types";

const DESIGNER = "0x54B7…Ce1f2";
const GUILD = "0xA11C…09D3";

const STAGE_LABELS: Record<StoryStage, string> = {
  INTRO: "尚未获得可信经历",
  QUEST_AVAILABLE: "发现匿名设计委托",
  QUEST_ACCEPTED: "正在完成委托",
  WORK_SUBMITTED: "等待公会验收",
  CREDENTIAL_ISSUED: "职业凭证已生效",
  CREDENTIAL_REVOKED: "职业凭证已撤销",
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
  const [summary, setSummary] = useState(
    "完成 6 个商品详情页的视觉排版与两轮修改",
  );
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!gameRoot.current) return;
    const game = createWorldGame(gameRoot.current);
    return () => game.destroy(true);
  }, []);

  const progress = useMemo(() => {
    const order: StoryStage[] = [
      "INTRO",
      "QUEST_AVAILABLE",
      "QUEST_ACCEPTED",
      "WORK_SUBMITTED",
      "CREDENTIAL_ISSUED",
    ];
    return Math.max(8, ((order.indexOf(stage) + 1) / order.length) * 100);
  }, [stage]);

  useEffect(() => {
    const listener = (event: Event) => {
      const { zone } = (event as CustomEvent<WorldEvent>).detail;
      interact(zone);
    };
    window.addEventListener(WORLD_INTERACT_EVENT, listener);
    return () => window.removeEventListener(WORLD_INTERACT_EVENT, listener);
  });

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function interact(zone: WorldEvent["zone"]) {
    if (zone === "home") {
      setDialog(
        <Dialog title="自由设计师的小屋" onClose={() => setDialog(null)}>
          <p>墙上挂满了作品，但没有一份材料能够证明这些商业项目由你实际完成。</p>
          <p className="muted">作品可以展示能力，却无法自动证明真实协作关系。</p>
          {stage === "INTRO" && (
            <button
              onClick={() => {
                setStage("QUEST_AVAILABLE");
                setDialog(null);
                notify("公会公告板出现了新的匿名委托");
              }}
            >
              开始今天的职业冒险
            </button>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "guild") {
      setDialog(
        <Dialog title="委托公会" onClose={() => setDialog(null)}>
          <div className="quest-card">
            <span>匿名委托 · 电商视觉设计</span>
            <strong>商品详情页视觉排版</strong>
            <small>客户名称、报价与联系方式不会公开</small>
          </div>
          {stage === "QUEST_AVAILABLE" && actor === "designer" ? (
            <button
              onClick={() => {
                setStage("QUEST_ACCEPTED");
                setDialog(null);
                notify("已接受匿名设计委托");
              }}
            >
              接取委托
            </button>
          ) : (
            <p className="muted">
              {stage === "INTRO"
                ? "先回到小屋了解故事背景。"
                : "这项委托已经进入你的冒险记录。"}
            </p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "workshop") {
      setDialog(
        <Dialog title="像素工作台" onClose={() => setDialog(null)}>
          <label>
            可公开贡献摘要
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              maxLength={140}
            />
          </label>
          <p className="privacy">请勿填写客户名称、报价、联系方式或未发布资料。</p>
          {stage === "QUEST_ACCEPTED" && actor === "designer" ? (
            <button
              onClick={async () => {
                const hash = await sha256(`demo-design-file:${summary}`);
                sessionStorage.setItem("proof-of-quest:evidence", hash);
                setStage("WORK_SUBMITTED");
                setDialog(null);
                notify(`成果指纹已生成：${hash.slice(0, 14)}…`);
              }}
            >
              生成成果哈希并提交
            </button>
          ) : (
            <p className="muted">只有接受委托的设计师可以提交成果。</p>
          )}
        </Dialog>,
      );
      return;
    }

    if (zone === "altar") {
      const canIssue = actor === "guild" && stage === "WORK_SUBMITTED";
      setDialog(
        <Dialog title="公会验收祭坛" onClose={() => setDialog(null)}>
          <p>公会需要确认设计师确实完成了上述贡献，然后签发职业凭证。</p>
          <div className="chain-preview">
            <span>Network</span><strong>Monad Testnet</strong>
            <span>Issuer</span><strong>{GUILD}</strong>
            <span>Designer</span><strong>{DESIGNER}</strong>
          </div>
          {canIssue ? (
            <button
              onClick={() => {
                const next: Credential = {
                  id: `0x${crypto.randomUUID().replace(/-/g, "")}`,
                  issuer: GUILD,
                  designer: DESIGNER,
                  projectCategory: "电商视觉设计",
                  role: "详情页执行设计师",
                  publicSummary: summary,
                  evidenceHash:
                    sessionStorage.getItem("proof-of-quest:evidence") ?? "0x",
                  issuedAt: new Date().toLocaleString("zh-CN"),
                  revoked: false,
                };
                setCredential(next);
                setStage("CREDENTIAL_ISSUED");
                setDialog(null);
                notify("Monad 凭证已生成，职业记忆碑被点亮");
              }}
            >
              确认验收并签发凭证
            </button>
          ) : (
            <p className="muted">
              {actor !== "guild"
                ? "切换到“公会”身份才能完成验收。"
                : "尚未收到设计师提交的成果。"}
            </p>
          )}
        </Dialog>,
      );
      return;
    }

    setDialog(
      <Dialog title="职业记忆碑" onClose={() => setDialog(null)}>
        {!credential ? (
          <p>石碑仍然沉睡。完成一次真实委托后，它将记录你的职业贡献。</p>
        ) : (
          <>
            <div className={`credential ${credential.revoked ? "revoked" : ""}`}>
              <div className="credential-status">
                {credential.revoked ? "已撤销" : "链上有效"}
              </div>
              <h3>{credential.projectCategory}</h3>
              <p>{credential.publicSummary}</p>
              <dl>
                <dt>签发方</dt><dd>{credential.issuer}</dd>
                <dt>设计师</dt><dd>{credential.designer}</dd>
                <dt>角色</dt><dd>{credential.role}</dd>
                <dt>证据哈希</dt><dd>{credential.evidenceHash.slice(0, 20)}…</dd>
                <dt>签发时间</dt><dd>{credential.issuedAt}</dd>
              </dl>
            </div>
            <p className="muted">
              该记录证明公会作出了这项声明，不代表区块链判断了设计质量或版权。
            </p>
            {actor === "guild" && !credential.revoked && (
              <button
                className="danger"
                onClick={() => {
                  setCredential({ ...credential, revoked: true });
                  setStage("CREDENTIAL_REVOKED");
                  setDialog(null);
                  notify("凭证已撤销；历史仍被保留");
                }}
              >
                演示撤销凭证
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
    setActor("designer");
    sessionStorage.clear();
    notify("Demo 已重置");
  }

  return (
    <main>
      <header className="hud">
        <div>
          <span className="eyebrow">MONAD TESTNET · INTERACTIVE STORY</span>
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
              {item === "designer" ? "设计师" : item === "guild" ? "公会" : "HR访客"}
            </button>
          ))}
          <button onClick={resetDemo}>重置</button>
        </div>
      </header>

      <section className="game-shell">
        <div ref={gameRoot} className="game-root" />
        <div className="controls">WASD / 方向键移动 · E 互动</div>
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
