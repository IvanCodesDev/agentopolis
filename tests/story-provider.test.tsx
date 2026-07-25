import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  DemoProvider,
  useDemo,
} from "@/components/providers/demo-provider";

function StoryHarness() {
  const demo = useDemo() as ReturnType<typeof useDemo> & {
    startStory: () => void;
    inviteDesigner: () => void;
    submitVersion: (
      id: string,
      version: 1 | 2,
      submission: { publicSummary: string; fileName: string },
    ) => Promise<void>;
    requestRevision: (id: string, feedback: string) => void;
    approveQuest: (id: string) => void;
    addCredentialToPassport: (id: string) => void;
    verifyCredential: (id: string) => void;
  };
  const credential = demo.snapshot.credentials[0];

  return (
    <div>
      <output aria-label="剧情阶段">{demo.snapshot.storyStage}</output>
      <output aria-label="主线任务状态">
        {demo.snapshot.quests.find(
          (quest) => quest.id === demo.snapshot.activeQuestId,
        )?.status ?? "NONE"}
      </output>
      <output aria-label="护照状态">
        {credential?.inPassport ? "IN_PASSPORT" : "HIDDEN"}
      </output>
      <button onClick={() => demo.startStory()} type="button">开始</button>
      <button onClick={() => demo.setRole("guild")} type="button">公会</button>
      <button onClick={() => demo.setRole("designer")} type="button">设计师</button>
      <button onClick={() => demo.setRole("hr")} type="button">HR</button>
      <button onClick={() => demo.inviteDesigner()} type="button">邀请</button>
      <button onClick={() => demo.acceptQuest("PQ-101")} type="button">接受</button>
      <button
        onClick={() =>
          void demo.submitVersion("PQ-101", 1, {
            publicSummary: "完成详情页第一版视觉排版",
            fileName: "detail-v1.fig",
          })
        }
        type="button"
      >
        提交 V1
      </button>
      <button
        onClick={() =>
          demo.requestRevision(
            "PQ-101",
            "强化首屏卖点并统一参数网格",
          )
        }
        type="button"
      >
        修改
      </button>
      <button
        onClick={() =>
          void demo.submitVersion("PQ-101", 2, {
            publicSummary: "完成详情页第二版及移动端适配",
            fileName: "detail-v2.fig",
          })
        }
        type="button"
      >
        提交 V2
      </button>
      <button onClick={() => demo.approveQuest("PQ-101")} type="button">
        验收
      </button>
      <button onClick={() => demo.issueCredential("PQ-101")} type="button">
        签发
      </button>
      <button
        onClick={() =>
          credential && demo.addCredentialToPassport(credential.id)
        }
        type="button"
      >
        加入护照
      </button>
      <button
        onClick={() => credential && demo.verifyCredential(credential.id)}
        type="button"
      >
        验证
      </button>
    </div>
  );
}

describe("story provider state machine", () => {
  beforeEach(() => localStorage.clear());

  it("completes the guarded V1 to HR verification story", async () => {
    render(<DemoProvider><StoryHarness /></DemoProvider>);

    fireEvent.click(screen.getByRole("button", { name: "开始" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("TASK_CREATED");

    fireEvent.click(screen.getByRole("button", { name: "邀请" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("TASK_CREATED");

    fireEvent.click(screen.getByRole("button", { name: "公会" }));
    fireEvent.click(screen.getByRole("button", { name: "邀请" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("DESIGNER_INVITED");

    fireEvent.click(screen.getByRole("button", { name: "设计师" }));
    fireEvent.click(screen.getByRole("button", { name: "接受" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("QUEST_ACCEPTED");

    fireEvent.click(screen.getByRole("button", { name: "提交 V1" }));
    await waitFor(() =>
      expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("V1_SUBMITTED"),
    );

    fireEvent.click(screen.getByRole("button", { name: "公会" }));
    fireEvent.click(screen.getByRole("button", { name: "修改" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("REVISION_REQUESTED");

    fireEvent.click(screen.getByRole("button", { name: "设计师" }));
    fireEvent.click(screen.getByRole("button", { name: "提交 V2" }));
    await waitFor(() =>
      expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("V2_SUBMITTED"),
    );

    fireEvent.click(screen.getByRole("button", { name: "公会" }));
    fireEvent.click(screen.getByRole("button", { name: "验收" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("WORK_APPROVED");
    fireEvent.click(screen.getByRole("button", { name: "签发" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("CREDENTIAL_ISSUED");

    fireEvent.click(screen.getByRole("button", { name: "设计师" }));
    fireEvent.click(screen.getByRole("button", { name: "加入护照" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("PORTFOLIO_SHARED");

    fireEvent.click(screen.getByRole("button", { name: "HR" }));
    fireEvent.click(screen.getByRole("button", { name: "验证" }));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("HR_VERIFIED");
  });

  it("does not allow V2 before a guild revision request", async () => {
    render(<DemoProvider><StoryHarness /></DemoProvider>);
    fireEvent.click(screen.getByRole("button", { name: "提交 V2" }));

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(screen.getByLabelText("剧情阶段")).toHaveTextContent("INTRO");
    expect(screen.getByLabelText("主线任务状态")).toHaveTextContent("INVITED");
  });
});
