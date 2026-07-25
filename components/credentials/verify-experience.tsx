"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { findCredential, loadDemoSnapshot } from "@/lib/demo/repository";
import type { DemoCredential } from "@/lib/demo/types";

import { CredentialResult } from "./credential-result";

export function VerifyExperience({
  credentialId,
}: {
  credentialId: string;
}) {
  const [credential, setCredential] = useState<DemoCredential>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const snapshot = loadDemoSnapshot(window.localStorage);
    setCredential(findCredential(snapshot, credentialId));
    setLoaded(true);
  }, [credentialId]);

  return (
    <main className="verifyWorld">
      <div aria-hidden="true" className="verifyBackdrop" />
      <header className="verifyTopbar">
        <Link aria-label="Proof of Quest 首页" className="worldBrand" href="/">
          PROOF <span>OF QUEST</span>
        </Link>
        <span>Monad Testnet · 演示读取</span>
      </header>

      <section className="verifyContent" aria-live="polite">
        {!loaded ? (
          <div className="verifyStateCard">
            <strong>正在读取公开凭证…</strong>
          </div>
        ) : credential ? (
          <CredentialResult credential={credential} />
        ) : (
          <div className="verifyStateCard verifyNotFound">
            <SearchX aria-hidden="true" size={36} />
            <p className="verifyEyebrow">CREDENTIAL LOOKUP</p>
            <h1>凭证未找到</h1>
            <p className="monoWrap">{credentialId}</p>
            <p>本地演示记录中没有这个凭证，可能尚未完成模拟签发。</p>
            <Link className="primaryButton credentialLink" href="/">
              返回公会大厅
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
