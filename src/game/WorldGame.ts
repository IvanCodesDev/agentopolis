import Phaser from "phaser";
import { emitWorldInteraction } from "./events";

type ZoneKey = "home" | "guild" | "workshop" | "altar" | "monument";

const WIDTH = 1280;
const HEIGHT = 720;

const ZONES: Record<ZoneKey, { x: number; y: number; label: string }> = {
  home: { x: 170, y: 270, label: "设计师小屋" },
  guild: { x: 1060, y: 235, label: "委托公会" },
  workshop: { x: 260, y: 570, label: "像素工作台" },
  altar: { x: 1000, y: 570, label: "验收祭坛" },
  monument: { x: 640, y: 325, label: "职业记忆碑" },
};

function pixelRect(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
) {
  graphics.fillStyle(color, 1);
  graphics.fillRect(Math.round(x), Math.round(y), width, height);
}

class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private prompt!: Phaser.GameObjects.Text;
  private nearest: ZoneKey | null = null;

  constructor() {
    super("world");
  }

  create() {
    this.cameras.main.setBackgroundColor("#91b77b");
    this.drawWorld();
    this.player = this.createPlayer(600, 625);
    this.keys = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    this.interactKey = this.input.keyboard!.addKey("E");
    this.prompt = this.add
      .text(WIDTH / 2, HEIGHT - 36, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff7dc",
        backgroundColor: "#211a38dd",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(30);
  }

  update(_: number, delta: number) {
    const speed = (delta / 1000) * 190;
    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) dx -= speed;
    if (this.keys.right.isDown || this.wasd.D.isDown) dx += speed;
    if (this.keys.up.isDown || this.wasd.W.isDown) dy -= speed;
    if (this.keys.down.isDown || this.wasd.S.isDown) dy += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 45, WIDTH - 45);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 130, HEIGHT - 45);
    this.player.setDepth(this.player.y);

    this.nearest = null;
    let best = 104;
    for (const [key, zone] of Object.entries(ZONES)) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        zone.x,
        zone.y,
      );
      if (distance < best) {
        best = distance;
        this.nearest = key as ZoneKey;
      }
    }
    this.prompt.setText(
      this.nearest ? `按 E 与「${ZONES[this.nearest].label}」互动` : "",
    );
    if (this.nearest && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      emitWorldInteraction(this.nearest);
    }
  }

  private drawWorld() {
    const g = this.add.graphics();
    pixelRect(g, 0, 0, WIDTH, 115, 0x2f2947);
    pixelRect(g, 0, 115, WIDTH, HEIGHT - 115, 0x8db273);

    for (let x = 0; x < WIDTH; x += 32) {
      for (let y = 115; y < HEIGHT; y += 32) {
        if ((x + y) % 96 === 0) pixelRect(g, x + 5, y + 7, 4, 4, 0x789c63);
      }
    }

    pixelRect(g, 125, 300, 1030, 72, 0xd9c58d);
    pixelRect(g, 604, 180, 72, 455, 0xd9c58d);
    for (let x = 130; x < 1150; x += 28) pixelRect(g, x, 328, 18, 5, 0xb99d6a);
    for (let y = 188; y < 635; y += 28) pixelRect(g, 632, y, 5, 18, 0xb99d6a);

    this.drawHouse(g, 90, 145, 180, 130, 0xd67866, 0xffe0a3);
    this.drawHouse(g, 975, 125, 205, 145, 0x695a96, 0xf6d490);
    this.drawWorkshop(g, 205, 510);
    this.drawAltar(g, 950, 515);
    this.drawMonument(g, 610, 260);

    this.add
      .text(32, 28, "PROOF OF QUEST", {
        fontFamily: "monospace",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#fff1bd",
      })
      .setDepth(20);
    this.add
      .text(34, 68, "让隐形贡献成为可验证的职业冒险", {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: "#cfc7ed",
      })
      .setDepth(20);

    Object.values(ZONES).forEach((zone) => {
      this.add
        .text(zone.x, zone.y + 62, zone.label, {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: "#251f36",
          backgroundColor: "#fff5d7cc",
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(zone.y + 80);
    });
  }

  private drawHouse(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    roof: number,
    wall: number,
  ) {
    pixelRect(g, x, y + 42, w, h - 42, wall);
    g.fillStyle(roof, 1);
    g.fillTriangle(x - 12, y + 52, x + w / 2, y - 15, x + w + 12, y + 52);
    pixelRect(g, x + w / 2 - 20, y + h - 50, 40, 50, 0x5a3d46);
    pixelRect(g, x + 25, y + 72, 36, 30, 0x8ed3d9);
    pixelRect(g, x + w - 61, y + 72, 36, 30, 0x8ed3d9);
  }

  private drawWorkshop(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 58, y - 15, 116, 54, 0x815f4c);
    pixelRect(g, x - 48, y - 6, 96, 10, 0xc28a62);
    pixelRect(g, x - 44, y + 38, 12, 35, 0x604334);
    pixelRect(g, x + 32, y + 38, 12, 35, 0x604334);
    pixelRect(g, x - 18, y - 34, 36, 24, 0xf5e5ba);
  }

  private drawAltar(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 64, y + 12, 128, 36, 0x766a8b);
    pixelRect(g, x - 48, y - 4, 96, 24, 0x958ab0);
    pixelRect(g, x - 26, y - 32, 52, 30, 0xd8b6ff);
    pixelRect(g, x - 8, y - 58, 16, 28, 0xf4cf68);
  }

  private drawMonument(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 48, y + 24, 96, 26, 0x6e667b);
    pixelRect(g, x - 32, y - 45, 64, 72, 0x877d98);
    pixelRect(g, x - 18, y - 26, 36, 32, 0xbc9cec);
    pixelRect(g, x - 6, y - 16, 12, 12, 0xffdb72);
  }

  private createPlayer(x: number, y: number) {
    const container = this.add.container(x, y);
    const shadow = this.add.ellipse(0, 18, 34, 12, 0x2b2638, 0.25);
    const body = this.add.rectangle(0, 0, 24, 32, 0x6d55a5);
    const head = this.add.rectangle(0, -25, 26, 24, 0xf2c7a4);
    const hair = this.add.rectangle(0, -34, 28, 10, 0x362b46);
    const bag = this.add.rectangle(15, 3, 9, 19, 0xf0a45d);
    container.add([shadow, body, head, hair, bag]);
    return container;
  }
}

export function createWorldGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [WorldScene],
  });
}
