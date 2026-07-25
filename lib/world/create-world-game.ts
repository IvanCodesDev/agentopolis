import * as Phaser from "phaser";

import type {
  WorldDirection,
  WorldGameHandle,
  WorldGameOptions,
  WorldLocationId,
} from "@/lib/world/types";

const WORLD_WIDTH = 1616;
const WORLD_HEIGHT = 1276;
const SPEED = 205;

const locations: Record<
  WorldLocationId,
  { x: number; y: number; label: string }
> = {
  home: { x: 260, y: 480, label: "设计师小屋" },
  guild: { x: 760, y: 325, label: "任务公会" },
  workshop: { x: 1110, y: 540, label: "设计工作台" },
  feedback: { x: 1385, y: 430, label: "反馈邮局" },
  altar: { x: 1190, y: 940, label: "验收签发台" },
  archive: { x: 885, y: 985, label: "职业档案馆" },
  hr: { x: 570, y: 925, label: "HR 招聘大厅" },
  monument: { x: 330, y: 950, label: "Monad 记忆碑" },
};

export function createWorldGame(
  options: WorldGameOptions,
): WorldGameHandle {
  const directions = new Set<WorldDirection>();
  let nearest: WorldLocationId | null = null;
  let scene: WorldScene | undefined;

  class WorldScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private lastPositionSent = 0;

    constructor() {
      super("agentopolis-world");
    }

    preload() {
      this.load.once("loaderror", () =>
        options.onError(new Error("像素地图资源加载失败")),
      );
      this.load.image("town-map", "/pixel/town-map.gif");
      this.load.image("player", "/pixel/player.png");
      this.load.image("npc", "/pixel/npc.png");
      this.load.image("quest-board", "/pixel/quest-board.png");
      this.load.audio("interact", "/pixel/sounds/scroll.wav");
    }

    create() {
      scene = this;
      this.add
        .image(0, 0, "town-map")
        .setOrigin(0)
        .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);

      Object.entries(locations).forEach(([id, location]) => {
        const marker = this.add
          .circle(location.x, location.y, 28, 0xf0c64d, 0.32)
          .setStrokeStyle(3, 0xffed9a, 0.9)
          .setInteractive({ useHandCursor: true })
          .setDepth(location.y + 2);
        marker.on("pointerdown", () => options.onInteract(id as WorldLocationId));
        this.add
          .text(location.x, location.y + 38, location.label, {
            fontFamily: "sans-serif",
            fontSize: "15px",
            color: "#fff8df",
            backgroundColor: "#18181be6",
            padding: { x: 8, y: 5 },
          })
          .setOrigin(0.5)
          .setDepth(location.y + 3);
      });

      this.player = this.add
        .image(
          options.initialPosition.x,
          options.initialPosition.y,
          "player",
        )
        .setDisplaySize(52, 52)
        .setDepth(options.initialPosition.y + 10);
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this.cameras.main.setDeadzone(260, 180);
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
      this.interactKey = this.input.keyboard!.addKey("E");
      options.onReady();
    }

    update(time: number, delta: number) {
      const step = (delta / 1000) * SPEED;
      const left =
        this.cursors.left.isDown ||
        this.wasd.A.isDown ||
        directions.has("left");
      const right =
        this.cursors.right.isDown ||
        this.wasd.D.isDown ||
        directions.has("right");
      const up =
        this.cursors.up.isDown ||
        this.wasd.W.isDown ||
        directions.has("up");
      const down =
        this.cursors.down.isDown ||
        this.wasd.S.isDown ||
        directions.has("down");

      this.player.x = Phaser.Math.Clamp(
        this.player.x + (right ? step : 0) - (left ? step : 0),
        28,
        WORLD_WIDTH - 28,
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y + (down ? step : 0) - (up ? step : 0),
        100,
        WORLD_HEIGHT - 28,
      );
      this.player.setDepth(this.player.y + 10);

      let nextNearest: WorldLocationId | null = null;
      let bestDistance = 96;
      Object.entries(locations).forEach(([id, location]) => {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          location.x,
          location.y,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          nextNearest = id as WorldLocationId;
        }
      });
      if (nextNearest !== nearest) {
        nearest = nextNearest;
        options.onNearestLocationChange(nearest);
      }
      if (
        nearest &&
        Phaser.Input.Keyboard.JustDown(this.interactKey)
      ) {
        this.sound.play("interact", { volume: 0.35 });
        options.onInteract(nearest);
      }
      if (time - this.lastPositionSent >= 500) {
        this.lastPositionSent = time;
        options.onPositionChange({ x: this.player.x, y: this.player.y });
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: 1280,
    height: 720,
    backgroundColor: "#71833f",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [WorldScene],
  });

  return {
    destroy: () => game.destroy(true),
    setDirection: (direction, active) => {
      if (active) directions.add(direction);
      else directions.delete(direction);
    },
    interact: () => {
      if (nearest) options.onInteract(nearest);
    },
    updateContext: () => {
      // Context is intentionally owned by React; the scene only renders it.
    },
  };
}
