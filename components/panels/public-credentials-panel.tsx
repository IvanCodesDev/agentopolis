import Link from "next/link";
import { BadgeCheck, Search } from "lucide-react";

import type { DemoCredential } from "@/lib/demo/types";

export function PublicCredentialsPanel({
  credentials,
}: {
  credentials: DemoCredential[];
}) {
  if (credentials.length === 0) {
    return (
      <div className="questState">
        <Search aria-hidden="true" size={28} />
        <strong>暂无公开凭证</strong>
        <p>公会完成验收签发后，HR 可在这里查看公开记录。</p>
      </div>
    );
  }

  return (
    <section className="previewPanel" aria-label="公开凭证列表">
      {credentials.map((credential) => (
        <article className="questActionCard" key={credential.id}>
          <div className="submissionPreview">
            <BadgeCheck aria-hidden="true" size={22} />
            <div>
              <strong>{credential.category} · {credential.role}</strong>
              <p>{credential.publicSummary}</p>
              <span className={`questStatus ${credential.status === "VALID" ? "questStatusSuccess" : "textDangerButton"}`}>
                {credential.status === "VALID" ? "有效" : "已撤销"}
              </span>
            </div>
          </div>
          <Link className="primaryButton credentialLink" href={`/verify/${credential.id}`}>
            查验公开凭证
          </Link>
        </article>
      ))}
    </section>
  );
}
