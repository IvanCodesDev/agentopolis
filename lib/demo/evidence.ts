export async function createEvidenceHash(
  questId: string,
  version: 1 | 2,
  fileName: string,
  publicSummary: string,
) {
  const source = `${questId}:v${version}:${fileName}:${publicSummary.trim()}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(source),
  );
  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}
