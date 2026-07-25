"use client";

import type { WorldDirection } from "@/lib/world/types";

interface MobileWorldControlsProps {
  onDirection: (direction: WorldDirection, active: boolean) => void;
  onInteract: () => void;
}

const directions: Array<{
  direction: WorldDirection;
  label: string;
  glyph: string;
  className: string;
}> = [
  {
    direction: "up",
    label: "向上移动",
    glyph: "↑",
    className: "mobileControlUp",
  },
  {
    direction: "left",
    label: "向左移动",
    glyph: "←",
    className: "mobileControlLeft",
  },
  {
    direction: "down",
    label: "向下移动",
    glyph: "↓",
    className: "mobileControlDown",
  },
  {
    direction: "right",
    label: "向右移动",
    glyph: "→",
    className: "mobileControlRight",
  },
];

export function MobileWorldControls({
  onDirection,
  onInteract,
}: MobileWorldControlsProps) {
  return (
    <div className="mobileWorldControls" aria-label="Map controls">
      {directions.map(({ direction, label, glyph, className }) => (
        <button
          aria-label={label}
          className={className}
          key={direction}
          onPointerCancel={() => onDirection(direction, false)}
          onPointerDown={() => onDirection(direction, true)}
          onPointerLeave={() => onDirection(direction, false)}
          onPointerUp={() => onDirection(direction, false)}
          type="button"
        >
          {glyph}
        </button>
      ))}
      <button
        aria-label="与附近地点互动"
        className="mobileControlInteract"
        onClick={onInteract}
        type="button"
      >
        E
      </button>
    </div>
  );
}
