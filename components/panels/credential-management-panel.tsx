"use client";

import Link from "next/link";
import { BadgeCheck, Ban } from "lucide-react";
import { useState } from "react";

import type { DemoCredential } from "@/lib/demo/types";

export function CredentialManagementPanel({
  credentials,
  onRevoke,
}: {
  credentials: DemoCredential[];
  onRevoke: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string>();

  if (credentials.length === 0) {
    return <p className="panelPreview">尚未签发凭证。先在“待验收”中签发一项成果。</p>;
  }

  return (
    <section className="previewPanel" aria-label="凭证管理">
      {credentials.map((credential) => (
        <article className="questActionCard" key={credential.id}>
          <div className="submissionPreview">
            {credential.status === "VALID" ? (
              <BadgeCheck aria-hidden="true" size={22} />
            ) : (
              <Ban aria-hidden="true" size={22} />
            )}
            <div>
              <strong>{credential.category} · {credential.role}</strong>
              <p>{credential.publicSummary}</p>
              <code className="monoWrap">{credential.id}</code>
            </div>
          </div>
          <div className="formActions">
            <Link className="secondaryButton credentialLink" href={`/verify/${credential.id}`}>
              公开查验
            </Link>
            {credential.status === "VALID" && confirmId !== credential.id ? (
              <button className="textDangerButton" onClick={() => setConfirmId(credential.id)} type="button">
                撤销凭证
              </button>
            ) : null}
            {confirmId === credential.id ? (
              <button
                className="primaryButton"
                onClick={() => {
                  onRevoke(credential.id);
                  setConfirmId(undefined);
                }}
                type="button"
              >
                确认撤销
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
