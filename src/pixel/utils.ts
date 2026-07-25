export function shortAddress(value?: string, head = 6, tail = 4) {
  if (!value) return "-";
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export async function sha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return `0x${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}
