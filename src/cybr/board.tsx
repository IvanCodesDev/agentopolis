import { useEffect, useRef, useState, type ReactNode } from "react";

export const BOARD_W = 1672;
export const BOARD_H = 941;

/**
 * The deck is authored at 1672x941 so a screenshot can be diffed against UI/0N.jpg
 * pixel-for-pixel. On screen we scale the whole slide to fit the viewport instead of
 * reflowing it, which is what keeps the replication exact at any window size.
 */
function useFitScale() {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const fit = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) return;
      setScale(Math.min(width / BOARD_W, height / BOARD_H, 1));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { stage, scale };
}

export function Board({
  index,
  title,
  sub,
  children,
}: {
  index: string;
  title: string;
  sub: string;
  children: ReactNode;
}) {
  const { stage, scale } = useFitScale();

  return (
    <div className="cybr cy-stage" ref={stage}>
      <div className="cy-board" style={{ transform: `scale(${scale})` }}>
        <div className="cy-board-label">
          <b>{index}</b>
          <strong>{title}</strong>
          <em style={{ fontStyle: "normal", color: "#c2c2c9" }}>/</em>
          <span>{sub}</span>
        </div>
        <div className="cy-board-body">{children}</div>
      </div>
    </div>
  );
}

/** The pixel-block asterisk in front of the CYBR_ wordmark. */
export function Mark({ size = 26, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={(size * 28) / 24} height={size} viewBox="0 0 28 24" fill={color} aria-hidden="true" focusable="false">
      <rect x="6" y="0" width="4" height="7" />
      <rect x="18" y="0" width="4" height="7" />
      <rect x="0" y="6" width="6" height="5" />
      <rect x="18" y="6" width="10" height="5" />
      <rect x="6" y="12" width="11" height="5" />
      <rect x="11" y="18" width="6" height="6" />
    </svg>
  );
}

export function Logo({ size = 26, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return (
    <span className="cy-logo" style={{ fontSize: size, color: tone === "light" ? "#fff" : undefined }}>
      <Mark size={size * 0.92} />
      CYBR<u>_</u>
    </span>
  );
}
