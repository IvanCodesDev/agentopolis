"use client";

import {
  AlertTriangle,
  Check,
  CircleEllipsis,
  LoaderCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { DemoCredential } from "@/lib/demo/types";

export type TransactionStatus =
  | "idle"
  | "awaiting"
  | "processing"
  | "success"
  | "failed";

interface TransactionStepperProps {
  onIssue: () => DemoCredential;
}

const transactionCopy: Record<
  TransactionStatus,
  { label: string; icon: typeof Sparkles }
> = {
  idle: { label: "准备签发", icon: Sparkles },
  awaiting: { label: "等待确认", icon: CircleEllipsis },
  processing: { label: "Monad 处理中", icon: LoaderCircle },
  success: { label: "签发成功", icon: Check },
  failed: { label: "模拟交易失败", icon: AlertTriangle },
};

export function TransactionStepper({ onIssue }: TransactionStepperProps) {
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const timers = useRef<number[]>([]);
  const isBusy = status === "awaiting" || status === "processing";
  const presentation = transactionCopy[status];
  const StatusIcon = presentation.icon;

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const beginIssue = () => {
    if (isBusy) return;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : 600;
    setStatus("awaiting");
    timers.current.push(
      window.setTimeout(() => {
        setStatus("processing");
        timers.current.push(
          window.setTimeout(() => {
            onIssue();
            setStatus("success");
          }, delay),
        );
      }, delay),
    );
  };

  if (status === "failed") {
    return (
      <section className="transactionCard transactionFailed">
        <AlertTriangle aria-hidden="true" size={22} />
        <div aria-live="polite">
          <strong>模拟交易失败</strong>
          <p>这是演示状态，没有产生真实交易，也没有丢失成果内容。</p>
        </div>
        <button
          className="secondaryButton"
          onClick={() => setStatus("idle")}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={14} />
          重新签发
        </button>
      </section>
    );
  }

  return (
    <section className="transactionCard">
      <div className="transactionStatus" aria-live="polite">
        <StatusIcon
          aria-hidden="true"
          className={status === "processing" ? "spin" : undefined}
          size={22}
        />
        <div>
          <strong>{presentation.label}</strong>
          <p>演示模式，不会发起真实 Monad 交易。</p>
        </div>
      </div>
      <div className="transactionActions">
        <button
          className="primaryButton"
          disabled={isBusy}
          onClick={beginIssue}
          type="button"
        >
          <Sparkles aria-hidden="true" size={14} />
          {isBusy ? "正在模拟签发" : "模拟链上签发"}
        </button>
        {status === "idle" ? (
          <button
            className="textDangerButton"
            onClick={() => setStatus("failed")}
            type="button"
          >
            演示失败
          </button>
        ) : null}
      </div>
    </section>
  );
}
