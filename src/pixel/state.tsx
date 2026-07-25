import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Quest, QuestStatus } from "./types";

const DESIGNER = "0x71a2B9E4cD83044f7A65b36f48F681dD06D9f421";
const GUILD = "0xA431dC896b31F7d221a9EDf491cfcC197Fb53717";

const initialQuests: Quest[] = [
  {
    id: "PQ-014",
    category: "电商视觉设计",
    role: "详情页执行设计师",
    guild: "北岸视觉公会",
    guildAddress: GUILD,
    designerAddress: DESIGNER,
    period: "2026.07.03 - 07.20",
    deadline: "7 月 20 日",
    summary: "完成 6 个商品详情页的视觉排版与两轮修改",
    status: "SUBMITTED",
    confidentiality: 1,
    fileName: "commerce-pages-v2.pdf",
    fileSize: "8.4 MB",
    evidenceHash: "0x3bd4f89a7e2c65a130c1e9a6d1b38c02471c2289f84b1aa73550d8d2cf389e14",
  },
  {
    id: "PQ-011",
    category: "UI 界面",
    role: "UI 执行",
    guild: "像素工坊",
    guildAddress: "0x5D8f81C34787a557CB47957CE4E46d5B94bF8890",
    designerAddress: DESIGNER,
    period: "2026.06.08 - 06.28",
    deadline: "已完成",
    summary: "完成移动端核心流程的高保真界面与组件规范",
    status: "ISSUED",
    confidentiality: 0,
    fileName: "ui-delivery.pdf",
    fileSize: "4.1 MB",
    evidenceHash: "0x18bc0d61d989485243a41c812ba9faec905c8603846fe37a887b1a26871438a2",
    credentialId: "0x90d86bb1e38f5af7dc3fd879521807992cbdc23e8ef18e93ad96a646aa992ca7",
    txHash: "0xe5875d2d0f8c74fb6ccb0681a6f8822b1e124ad4b5166c7be29fb74ff07fb810",
  },
  {
    id: "PQ-008",
    category: "品牌视觉",
    role: "视觉延展",
    guild: "第七码头设计社",
    guildAddress: "0xB55dF2e3bA03986b9f6113Ec30c3A1Ae702a91c8",
    designerAddress: DESIGNER,
    period: "2026.05.14 - 05.31",
    deadline: "已撤销",
    summary: "完成品牌活动物料的视觉延展和尺寸适配",
    status: "REVOKED",
    confidentiality: 0,
    evidenceHash: "0xa47bfe87b5088435bc0a90333ca01ea4b2e8b0e430e0a86c7a32c73b11fa43e1",
    credentialId: "0x60dc1d3eac036dc82e073022615596249182900994e59dc7c00e1c3669309ee4",
    txHash: "0xa88111d98461d8df8b5068e83c52eea092f5510748b4960b18cc2c0c27e9d98b",
    revokedAt: "2026.06.02 14:32",
  },
  {
    id: "PQ-016",
    category: "营销海报",
    role: "主设计",
    guild: "北岸视觉公会",
    guildAddress: GUILD,
    designerAddress: DESIGNER,
    period: "2026.07.21 - 07.28",
    deadline: "7 月 28 日",
    summary: "匿名消费项目营销主视觉与系列海报",
    status: "INVITED",
    confidentiality: 1,
  },
];

type Role = "designer" | "guild";

type AppContextValue = {
  quests: Quest[];
  role: Role;
  walletConnected: boolean;
  walletAddress: string;
  setRole: (role: Role) => void;
  connectWallet: () => void;
  updateQuest: (id: string, patch: Partial<Quest>) => void;
  setQuestStatus: (id: string, status: QuestStatus) => void;
  addQuest: (quest: Quest) => void;
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [quests, setQuests] = useState(initialQuests);
  const [role, setRole] = useState<Role>("designer");
  const [walletConnected, setWalletConnected] = useState(false);

  const value = useMemo<AppContextValue>(() => ({
    quests,
    role,
    walletConnected,
    walletAddress: role === "designer" ? DESIGNER : GUILD,
    setRole,
    connectWallet: () => setWalletConnected(true),
    updateQuest: (id, patch) => setQuests((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)),
    setQuestStatus: (id, status) => setQuests((items) => items.map((item) => item.id === id ? { ...item, status } : item)),
    addQuest: (quest) => setQuests((items) => [quest, ...items]),
    resetDemo: () => {
      setQuests(initialQuests);
      setRole("designer");
      setWalletConnected(false);
    },
  }), [quests, role, walletConnected]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
