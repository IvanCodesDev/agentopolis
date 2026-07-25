"use client";

import type { PropsWithChildren } from "react";
import { useState } from "react";

interface PixelWorldViewProps extends PropsWithChildren {
  questPinned?: boolean;
}

export function PixelWorldView({
  children,
  questPinned = false,
}: PixelWorldViewProps) {
  const [sceneFailed, setSceneFailed] = useState(false);

  return (
    <main
      aria-label="Proof of Quest"
      className={[
        "pixelWorld",
        questPinned ? "questPinned" : "",
        sceneFailed ? "sceneFallback" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="pixel-world"
    >
      <img
        alt=""
        aria-hidden="true"
        className="sceneImage"
        data-testid="scene-image"
        onError={() => setSceneFailed(true)}
        src="/pixel/town-map.gif"
      />
      <div aria-hidden="true" className="sceneShade" />
      {sceneFailed ? (
        <p className="sceneFallbackMessage">像素场景资源未加载</p>
      ) : null}
      <div aria-hidden="true" className="pinSpark">
        ✦
      </div>
      {children}
    </main>
  );
}
