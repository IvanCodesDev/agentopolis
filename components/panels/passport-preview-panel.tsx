import Link from "next/link";
import { BadgeCheck, ExternalLink } from "lucide-react";

import type { DemoCredential } from "@/lib/demo/types";

export function PassportPreviewPanel({
  credentials = [],
}: {
  credentials?: DemoCredential[];
}) {
  const validCount = credentials.filter((item) => item.status === "VALID").length;

  return (
    <section className="previewPanel" aria-label="冒险护照预览">
      <div className="passportCard">
        <div aria-hidden="true" className="passportAvatar" />
        <div>
          <span className="previewEyebrow">ADVENTURER PASSPORT</span>
          <h2>匿名设计冒险者</h2>
          <code>0x12ab…89ef</code>
        </div>
      </div>
      <div className="passportMetric">
        <BadgeCheck aria-hidden="true" size={22} />
        <span>有效贡献凭证</span>
        <strong>{validCount}</strong>
      </div>
      <div className="previewNote">
        护照仅展示公开贡献记录，不披露委托方敏感信息，也不代表能力评分。
      </div>
      {credentials[0] ? (
        <Link className="primaryButton credentialLink" href={`/verify/${credentials[0].id}`}>
          查看最新凭证
          <ExternalLink aria-hidden="true" size={14} />
        </Link>
      ) : null}
    </section>
  );
}
