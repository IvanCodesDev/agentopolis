import type { CyStatus } from "./ui";

/* Content transcribed from the design board. Strings that were too small to read
   at board resolution are filled with values consistent with the rest of the flow. */

export const DESIGNER = {
  name: "张三",
  role: "设计师",
  address: "0x1234...0978",
  joined: "2024.01",
};

export const STUDIO = {
  name: "光合设计工作室",
  certified: true,
};

export type Task = {
  id: string;
  title: string;
  code: string;
  studio: string;
  status: CyStatus;
  progress: number;
  period: string;
  updated: string;
  category: string;
};

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "电商品牌视觉设计",
    code: "PRJ-2024-0618-001",
    studio: "光合设计工作室",
    status: "run",
    progress: 60,
    period: "2024.06.18 - 2024.06.25",
    updated: "2024.06.24",
    category: "电商设计 · 品牌视觉",
  },
  {
    id: "t2",
    title: "APP 启动页设计",
    code: "PRJ-2024-0613-002",
    studio: "拾光工厂",
    status: "wait",
    progress: 90,
    period: "2024.06.13 - 2024.06.22",
    updated: "2024.06.21",
    category: "UI 设计 · 移动端",
  },
  {
    id: "t3",
    title: "品牌 LOGO 延展设计",
    code: "PRJ-2024-0601-003",
    studio: "第七码头设计社",
    status: "check",
    progress: 100,
    period: "2024.06.01 - 2024.06.12",
    updated: "2024.06.12",
    category: "品牌视觉 · 标识",
  },
];

export const TASK_FILTERS = ["全部", "进行中", "待提交", "待验收", "已完成", "已撤销"];

/* ------------------------------------------------------------------ 03 项目详情 */

export const PROJECT = {
  title: "电商品牌视觉设计",
  code: "PRJ-2024-0618-001",
  category: "电商设计 · 品牌视觉",
  period: "2024.06.18 - 2024.06.25",
  status: "run" as CyStatus,
  publisher: STUDIO.name,
  budget: "¥2000 - ¥3000",
  settle: "验收后 7 日结算",
  contract: "已签约（链上存证）",
};

export const PROJECT_TABS = ["项目详情", "任务流程", "交付物", "文件交付", "验证记录", "凭证签发"];

export type FlowRow = { title: string; actor: string; at: string; active?: boolean };

export const PROJECT_FLOW: FlowRow[] = [
  { title: "任务创建", actor: "光合设计工作室", at: "2024.06.18 10:20" },
  { title: "任务分发", actor: "运营对接人-小林", at: "2024.06.18 10:46" },
  { title: "任务接取", actor: "设计师-张三", at: "2024.06.18 11:32" },
  { title: "任务提交", actor: "设计师-张三", at: "2024.06.24 14:15", active: true },
  { title: "建立评估", actor: "设计评估人-阿杰", at: "2024.06.25 09:40" },
  { title: "反馈修改", actor: "设计师-张三", at: "2024.06.25 16:08" },
];

export const PROJECT_PARTIES = [
  { name: "光合设计工作室", role: "发布方", tone: "dark" as const },
  { name: "运营对接人-小林", role: "协作方", tone: "purple" as const },
  { name: "设计评估人-阿杰", role: "验收方", tone: "dark" as const },
  { name: "设计师-张三", role: "执行方", tone: "lime" as const },
];

/* ------------------------------------------------------------------ 04 凭证详情 */

export const CREDENTIAL = {
  title: "职业贡献凭证",
  project: "电商品牌视觉设计",
  projectId: "PRJ-2024-0618-001",
  role: "主视觉执行设计师",
  period: "2024.06.18 - 2024.06.25",
  studio: STUDIO.name,
  issuer: STUDIO.name,
  designer: DESIGNER.name,
  designerAddress: "0x1234...0978",
  vcId: "VC-0x7a0f...c3c9b2",
  issuedAt: "2024.06.26 14:22",
  chain: "Base Sepolia",
  verifiedAt: "2024.06.26 16:10:32 (UTC+8)",
  serial: "-0597_46",
};

export const CREDENTIAL_TABS = ["凭证详情", "过程凭证", "验证记录"];

export const VERIFY_CHECKS = [
  { label: "凭证签名", value: "有效" },
  { label: "签发机构", value: "可信" },
  { label: "凭证未被撤销", value: "有效" },
  { label: "数据完整性", value: "有效" },
  { label: "区块确认", value: "有效" },
];

/* ------------------------------------------------------------------ 05 个人中心 */

export const PROFILE_STATS = [
  { value: "12", label: "完成项目" },
  { value: "8", label: "获得凭证" },
  { value: "98%", label: "好评率" },
  { value: "4.9", label: "综合评分" },
];

export const PROFILE_MENU = [
  { key: "workbench", label: "工作台", icon: "grid" },
  { key: "tasks", label: "我的任务", icon: "list" },
  { key: "credentials", label: "我的凭证", icon: "award" },
  { key: "works", label: "作品集", icon: "image" },
  { key: "orders", label: "接单设置", icon: "briefcase" },
  { key: "reviews", label: "评价中心", icon: "star" },
  { key: "settings", label: "设置", icon: "settings" },
];

export const RECENT_TASKS = [
  { title: "电商品牌视觉设计", status: "done" as CyStatus, at: "2024.06.25" },
  { title: "APP 启动页设计", status: "wait" as CyStatus, at: "2024.06.21" },
  { title: "品牌 LOGO 延展设计", status: "check" as CyStatus, at: "2024.06.12" },
  { title: "活动海报设计", status: "done" as CyStatus, at: "2024.05.30" },
];

export const CREDENTIAL_MIX = [
  { label: "已验证", value: 6, color: "var(--cy-purple)" },
  { label: "待验证", value: 1, color: "var(--cy-wait)" },
  { label: "已撤销", value: 1, color: "var(--cy-revoked)" },
];

export const SKILLS = ["品牌设计", "电商设计", "UI 设计", "视觉设计", "Banner 设计", "海报设计", "包装设计"];

/* ------------------------------------------------------------------ 01 首页 */

export const HOME_NAV = ["PROJECTS", "BIG TOOLS", "TEAM CONCENTRICS", "AI TALENT"];

export const HOME_STATS = [
  { value: "12.8K+", label: "已完成项目" },
  { value: "9.6K+", label: "认证设计师" },
  { value: "3.2K+", label: "资源库内容" },
  { value: "98.7%", label: "完成率或通过率" },
];

export const HOME_COORDS = ["X_36.1749", "Y_-86.7676", "Z_46.6827"];
