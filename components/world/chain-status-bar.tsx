import { Circle } from "lucide-react";

export function ChainStatusBar() {
  return (
    <footer className="chainStatusBar" aria-label="演示链上状态">
      <span className="rpcOnline">
        <Circle aria-hidden="true" fill="currentColor" size={8} />
        RPC 在线
      </span>
      <span>合约 0x7A31…84F2</span>
      <span>最近同步 12 秒前</span>
      <span>演示数据模式</span>
    </footer>
  );
}

