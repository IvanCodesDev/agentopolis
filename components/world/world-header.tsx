import { Circle, Volume2, VolumeX, WalletCards } from "lucide-react";

import { RoleSwitcher } from "@/components/world/role-switcher";
import type { DemoRole, WalletDemoState } from "@/lib/demo/types";

interface WorldHeaderProps {
  walletState: WalletDemoState;
  onWalletAction: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  role: DemoRole;
  onRoleChange: (role: DemoRole) => void;
}

export function WorldHeader({
  walletState,
  onWalletAction,
  soundEnabled,
  onToggleSound,
  role,
  onRoleChange,
}: WorldHeaderProps) {
  const walletLabel =
    walletState === "disconnected"
      ? "连接钱包"
      : walletState === "connected"
        ? "0x12ab…89ef"
        : "错误网络";
  const accessibleLabel =
    walletState === "disconnected"
      ? "连接钱包"
      : walletState === "connected"
        ? "模拟钱包 0x12ab…89ef"
        : "错误网络，切换到 Monad Testnet";

  return (
    <header className="worldHeader">
      <a className="worldBrand" href="/" aria-label="Proof of Quest 首页">
        PROOF <span>OF QUEST</span>
      </a>
      <div className="worldLocation">公会大厅 · 晨间</div>
      <RoleSwitcher onChange={onRoleChange} role={role} />
      <div className="networkBadge" aria-label="Monad Testnet 网络，链 ID 10143">
        <Circle aria-hidden="true" fill="currentColor" size={8} />
        <span>Monad Testnet</span>
        <span className="networkDivider">·</span>
        <span>10143</span>
      </div>
      <button
        aria-label={soundEnabled ? "关闭声音" : "开启声音"}
        aria-pressed={soundEnabled}
        className="soundButton"
        onClick={onToggleSound}
        type="button"
      >
        {soundEnabled ? (
          <Volume2 aria-hidden="true" size={17} />
        ) : (
          <VolumeX aria-hidden="true" size={17} />
        )}
      </button>
      <button
        aria-label={accessibleLabel}
        className={
          walletState === "wrong-network"
            ? "walletButton walletButtonError"
            : "walletButton"
        }
        onClick={onWalletAction}
        type="button"
      >
        <WalletCards aria-hidden="true" size={17} />
        {walletLabel}
      </button>
    </header>
  );
}
