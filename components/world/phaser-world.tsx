"use client";

import { useEffect, useRef, useState } from "react";

import { MobileWorldControls } from "@/components/world/mobile-world-controls";
import type {
  WorldGameHandle,
  WorldGameOptions,
} from "@/lib/world/types";

type PhaserWorldProps = Omit<WorldGameOptions, "parent">;

export function PhaserWorld(props: PhaserWorldProps) {
  const parent = useRef<HTMLDivElement>(null);
  const handle = useRef<WorldGameHandle | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let game: WorldGameHandle | undefined;

    void import("@/lib/world/create-world-game")
      .then(({ createWorldGame }) => {
        if (cancelled || !parent.current) return;
        try {
          game = createWorldGame({ ...props, parent: parent.current });
          handle.current = game;
        } catch (error) {
          const failure =
            error instanceof Error ? error : new Error("地图初始化失败");
          setFailed(true);
          props.onError(failure);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const failure =
          error instanceof Error ? error : new Error("地图模块加载失败");
        setFailed(true);
        props.onError(failure);
      });

    return () => {
      cancelled = true;
      game?.destroy();
      handle.current = undefined;
    };
    // The Phaser instance is created once. Context changes use updateContext.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handle.current?.updateContext(props.actor, props.stage);
  }, [props.actor, props.stage]);

  return (
    <>
      <div
        aria-label="可移动的 Agentopolis 世界"
        className="phaserWorld"
        ref={parent}
        role="application"
      />
      {failed ? (
        <p className="worldFallbackNotice" role="status">
          地图互动暂时不可用，已切换静态地图
        </p>
      ) : null}
      <MobileWorldControls
        onDirection={(direction, active) =>
          handle.current?.setDirection(direction, active)
        }
        onInteract={() => handle.current?.interact()}
      />
    </>
  );
}
