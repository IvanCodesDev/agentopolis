"use client";

import { CheckCircle2, Database, RadioTower, RotateCcw } from "lucide-react";
import { useState } from "react";

export function ChainStatePanel({ onReset }: { onReset?: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="previewPanel" aria-label="Monad 演示状态">
      <div className="chainHero">
        <RadioTower aria-hidden="true" size={26} />
        <div>
          <span className="previewEyebrow">MONAD TESTNET</span>
          <h2>本地演示运行正常</h2>
        </div>
        <CheckCircle2 aria-hidden="true" className="successIcon" size={20} />
      </div>
      <dl className="techList">
        <div><dt>Chain ID</dt><dd>10143</dd></div>
        <div><dt>演示合约</dt><dd>0x7A31…84F2</dd></div>
        <div><dt>数据来源</dt><dd><Database aria-hidden="true" size={13} />本地模拟</dd></div>
      </dl>
      <div className="previewNote">
        当前 Demo 不会发起真实 RPC、签名或 Monad 交易。
      </div>
      {onReset ? (
        confirming ? (
          <div className="questActionCard">
            <strong>重置全部演示数据？</strong>
            <p>角色、任务、成果和凭证都会恢复到初始状态。</p>
            <div className="formActions">
              <button className="secondaryButton" onClick={() => setConfirming(false)} type="button">取消</button>
              <button className="primaryButton" onClick={onReset} type="button">确认重置</button>
            </div>
          </div>
        ) : (
          <button className="secondaryButton" onClick={() => setConfirming(true)} type="button">
            <RotateCcw aria-hidden="true" size={14} /> 重置演示
          </button>
        )
      ) : null}
    </section>
  );
}
