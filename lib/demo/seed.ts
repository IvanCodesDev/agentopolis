import type { DemoSnapshot } from "./types";

export const demoSeed: DemoSnapshot = {
  schemaVersion: 2,
  storyStage: "INTRO",
  activeQuestId: "PQ-101",
  project: {
    currentVersion: 0,
    revisionFeedback:
      "首屏卖点不够突出；参数区统一为三列网格；降低装饰元素对商品主体的干扰。",
  },
  playerPosition: { x: 210, y: 410 },
  quests: [
    {
      id: "PQ-101",
      title: "电商视觉 · 详情页执行设计",
      industry: "匿名消费行业",
      category: "电商视觉",
      role: "详情页执行设计师",
      startDate: "2026-07-03",
      dueDate: "2026-07-20",
      confidentiality: 1,
      summary: "完成 6 个商品详情页的视觉排版与两轮修改",
      recipient: "0x12ab3456789012345678901234567890123489ef",
      status: "INVITED",
    },
    {
      id: "PQ-102",
      title: "品牌系统 · 视觉规范整理",
      industry: "匿名科技行业",
      category: "品牌系统",
      role: "视觉规范设计师",
      startDate: "2026-07-08",
      dueDate: "2026-07-28",
      confidentiality: 1,
      summary: "整理品牌视觉规范并交付可复用组件",
      recipient: "0x12ab3456789012345678901234567890123489ef",
      status: "ACCEPTED",
    },
    {
      id: "PQ-103",
      title: "UI 界面 · 数据看板设计",
      industry: "匿名工具产品",
      category: "UI 界面",
      role: "主设计师",
      startDate: "2026-06-10",
      dueDate: "2026-06-24",
      confidentiality: 2,
      summary: "",
      recipient: "0x12ab3456789012345678901234567890123489ef",
      status: "ISSUED",
    },
  ],
  credentials: [],
  currentRole: "designer",
  walletState: "disconnected",
  filter: "ALL",
};

export function createSeedSnapshot(): DemoSnapshot {
  return {
    ...demoSeed,
    project: { ...demoSeed.project },
    playerPosition: { ...demoSeed.playerPosition },
    quests: demoSeed.quests.map((quest) => ({ ...quest })),
    credentials: demoSeed.credentials.map((credential) => ({ ...credential })),
  };
}
