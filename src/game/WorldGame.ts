import Phaser from "phaser";
import { emitWorldInteraction } from "./events";

type ZoneKey =
  | "home"
  | "portfolio"
  | "guild"
  | "client"
  | "workshop"
  | "feedback"
  | "altar"
  | "archive"
  | "hr"
  | "monument";

const WIDTH = 1280;
const HEIGHT = 720;
const WORLD_WIDTH = 1680;
const WORLD_HEIGHT = 960;

const ZONES: Record<
  ZoneKey,
  { x: number; y: number; label: string; event: ZoneKey }
> = {
  home: { x: 155, y: 245, label: "设计师小屋", event: "home" },
  portfolio: { x: 350, y: 220, label: "无署名作品墙", event: "portfolio" },
  guild: { x: 600, y: 225, label: "任务公会", event: "guild" },
  client: { x: 825, y: 255, label: "甲方联络人", event: "client" },
  workshop: { x: 1085, y: 225, label: "设计工作台", event: "workshop" },
  feedback: { x: 1400, y: 415, label: "反馈邮局", event: "feedback" },
  altar: { x: 1270, y: 735, label: "验收签发台", event: "altar" },
  archive: { x: 960, y: 755, label: "职业档案馆", event: "archive" },
  hr: { x: 650, y: 755, label: "招聘大厅 · HR", event: "hr" },
  monument: { x: 285, y: 700, label: "Monad 记忆碑", event: "monument" },
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
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawWorld();
    this.player = this.createPlayer(155, 330);
    this.cameras.main.startFollow(this.player, true, 0.075, 0.075);
    this.cameras.main.setDeadzone(360, 230);
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
      .setDepth(3000)
      .setScrollFactor(0);
  }

  update(_: number, delta: number) {
    // Phaser captures W/A/S/D/E/arrows on window and preventDefaults them, which
    // would block typing those keys into DOM inputs (e.g. the summary textarea).
    const focused = document.activeElement;
    const typing =
      focused instanceof HTMLInputElement ||
      focused instanceof HTMLTextAreaElement ||
      focused instanceof HTMLSelectElement;
    const keyboard = this.input.keyboard!;
    if (typing) {
      keyboard.disableGlobalCapture();
      return;
    }
    keyboard.enableGlobalCapture();

    const speed = (delta / 1000) * 190;
    let dx = 0;
    let dy = 0;
    if (this.keys.left.isDown || this.wasd.A.isDown) dx -= speed;
    if (this.keys.right.isDown || this.wasd.D.isDown) dx += speed;
    if (this.keys.up.isDown || this.wasd.W.isDown) dy -= speed;
    if (this.keys.down.isDown || this.wasd.S.isDown) dy += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 35, WORLD_WIDTH - 35);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 120, WORLD_HEIGHT - 35);
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
      emitWorldInteraction(ZONES[this.nearest].event);
    }
  }

  private drawWorld() {
    const g = this.add.graphics();
    pixelRect(g, 0, 0, WORLD_WIDTH, 115, 0x2f2947);
    pixelRect(g, 0, 115, WORLD_WIDTH, WORLD_HEIGHT - 115, 0x8db273);

    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      for (let y = 115; y < WORLD_HEIGHT; y += 32) {
        if ((x + y) % 96 === 0) pixelRect(g, x + 5, y + 7, 4, 4, 0x789c63);
      }
    }

    // A single guided path tells the story clockwise, from invisible work to
    // a verifiable career record.
    const route = [
      [155, 315], [350, 285], [600, 300], [825, 320], [1085, 300],
      [1400, 455], [1270, 780], [960, 805], [650, 805], [285, 760],
    ];
    g.lineStyle(52, 0xd9c58d, 1);
    g.beginPath();
    g.moveTo(route[0][0], route[0][1]);
    route.slice(1).forEach(([x, y]) => g.lineTo(x, y));
    g.strokePath();
    g.lineStyle(4, 0xb99d6a, 1);
    g.beginPath();
    g.moveTo(route[0][0], route[0][1]);
    route.slice(1).forEach(([x, y]) => g.lineTo(x, y));
    g.strokePath();

    this.drawOpenRoom(g, 70, 145, 170, 120, 0xffe0a3, 0xd67866);
    this.drawPortfolio(g, 350, 205);
    this.drawOpenRoom(g, 510, 145, 180, 125, 0xe8d4a2, 0x695a96);
    this.drawNpc(g, 825, 245, 0x343042, 0xf0c6a3, 0xe0a348);
    this.drawWorkshop(g, 1085, 215);
    this.drawPostOffice(g, 1400, 405);
    this.drawAltar(g, 1270, 720);
    this.drawArchive(g, 960, 735);
    this.drawNpc(g, 650, 745, 0x40344f, 0xd8b08e, 0x7056a8);
    this.drawMonument(g, 285, 680);
    this.drawPond(g, 1480, 720);

    // Dense, readable town dressing: tree clusters frame the route while low
    // fences and signposts indicate where the player should go next.
    [
      [35, 355], [110, 410], [255, 400], [425, 385], [760, 410],
      [1010, 430], [1190, 420], [1535, 300], [1580, 500], [1500, 895],
      [1110, 890], [800, 900], [510, 890], [95, 840],
    ].forEach(([x, y]) => this.drawTree(g, x, y));
    this.drawFence(g, 55, 365, 410);
    this.drawFence(g, 1070, 515, 420);
    this.drawSign(g, 440, 320, "公会 →");
    this.drawSign(g, 1160, 475, "验收 ↓");
    this.drawSign(g, 790, 820, "HR ←");

    this.add
      .text(32, 28, "PROOF OF QUEST", {
        fontFamily: "monospace",
        fontSize: "30px",
        fontStyle: "bold",
        color: "#fff1bd",
      })
      .setDepth(3000)
      .setScrollFactor(0);
    this.add
      .text(34, 68, "让隐形贡献成为可验证的职业冒险", {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: "#cfc7ed",
      })
      .setDepth(3000)
      .setScrollFactor(0);

    Object.values(ZONES).forEach((zone) => {
      this.add
        .text(zone.x, zone.y + 52, zone.label, {
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

  private drawPortfolio(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 58, y - 45, 116, 78, 0xf3ead1);
    pixelRect(g, x - 51, y - 38, 48, 29, 0x815f98);
    pixelRect(g, x + 5, y - 38, 46, 29, 0x55a0a5);
    pixelRect(g, x - 51, y - 3, 102, 27, 0xe1a055);
    pixelRect(g, x - 18, y + 3, 36, 5, 0x5a5269);
    // Question mark: beautiful work, but no verifiable attribution.
    pixelRect(g, x + 43, y - 55, 8, 8, 0xd35e61);
    pixelRect(g, x + 51, y - 47, 8, 16, 0xd35e61);
    pixelRect(g, x + 43, y - 31, 8, 8, 0xd35e61);
  }

  private drawOpenRoom(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    floor: number,
    wall: number,
  ) {
    // Roofless doll-house view keeps the interior readable from the overworld.
    pixelRect(g, x, y, w, h, floor);
    pixelRect(g, x - 8, y - 8, w + 16, 13, wall);
    pixelRect(g, x - 8, y - 8, 13, h + 16, wall);
    pixelRect(g, x + w - 5, y - 8, 13, h + 16, wall);
    pixelRect(g, x + 18, y + 25, 54, 28, 0x815f4c);
    pixelRect(g, x + 26, y + 31, 38, 10, 0xf5e5ba);
    pixelRect(g, x + w - 55, y + 20, 34, 45, 0x6b5a73);
    pixelRect(g, x + w - 49, y + 27, 22, 7, 0x9fd1ce);
    pixelRect(g, x + 35, y + h - 34, 18, 25, 0xb56d54);
    pixelRect(g, x + w - 55, y + h - 34, 18, 25, 0xb56d54);
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 6, y + 10, 12, 31, 0x765034);
    pixelRect(g, x - 27, y - 20, 54, 39, 0x477a54);
    pixelRect(g, x - 18, y - 35, 36, 24, 0x5b925e);
    pixelRect(g, x - 23, y - 14, 9, 9, 0x77ad6c);
  }

  private drawFence(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
  ) {
    for (let px = x; px <= x + width; px += 38) {
      pixelRect(g, px, y - 12, 8, 30, 0xb17c4d);
    }
    pixelRect(g, x, y - 4, width, 8, 0xd19a5e);
  }

  private drawPond(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x6f9f82, 1);
    g.fillEllipse(x, y, 250, 145);
    g.fillStyle(0x78bed0, 1);
    g.fillEllipse(x, y - 4, 226, 121);
    pixelRect(g, x - 70, y - 24, 30, 7, 0xbbe2df);
    pixelRect(g, x + 16, y + 20, 42, 6, 0xbbe2df);
    pixelRect(g, x + 70, y - 35, 13, 13, 0x75a65a);
    pixelRect(g, x + 75, y - 41, 5, 25, 0xe8c95a);
  }

  private drawSign(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    label: string,
  ) {
    pixelRect(g, x - 4, y, 8, 35, 0x765034);
    pixelRect(g, x - 34, y - 22, 68, 27, 0xd8aa66);
    this.add
      .text(x, y - 17, label, {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#3c2c35",
      })
      .setOrigin(0.5, 0)
      .setDepth(y + 40);
  }

  private drawGuild(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 67, y - 42, 134, 78, 0x786596);
    pixelRect(g, x - 74, y - 54, 148, 18, 0x4d3f6a);
    pixelRect(g, x - 18, y + 1, 36, 35, 0x3d324e);
    pixelRect(g, x - 43, y - 26, 30, 21, 0xf2d374);
    pixelRect(g, x + 13, y - 26, 30, 21, 0xf2d374);
  }

  private drawNpc(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    hair: number,
    skin: number,
    clothes: number,
  ) {
    pixelRect(g, x - 12, y - 38, 24, 22, skin);
    pixelRect(g, x - 14, y - 44, 28, 9, hair);
    pixelRect(g, x - 15, y - 16, 30, 35, clothes);
    pixelRect(g, x - 17, y + 19, 12, 18, 0x3d3850);
    pixelRect(g, x + 5, y + 19, 12, 18, 0x3d3850);
    pixelRect(g, x + 19, y - 9, 18, 22, 0xf6efd7);
  }

  private drawPostOffice(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 58, y - 40, 116, 77, 0xf0c57f);
    pixelRect(g, x - 66, y - 48, 132, 15, 0xc86464);
    pixelRect(g, x - 18, y - 18, 36, 28, 0xfff3d2);
    g.lineStyle(3, 0xc86464, 1);
    g.strokeRect(x - 18, y - 18, 36, 28);
    g.lineBetween(x - 17, y - 17, x, y - 2);
    g.lineBetween(x + 17, y - 17, x, y - 2);
  }

  private drawArchive(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    pixelRect(g, x - 67, y - 44, 134, 81, 0xe5dcc2);
    pixelRect(g, x - 75, y - 54, 150, 14, 0x59647a);
    for (let i = -1; i <= 1; i += 1) {
      pixelRect(g, x + i * 42 - 13, y - 31, 26, 54, 0x9a8daf);
      pixelRect(g, x + i * 42 - 8, y - 23, 16, 5, 0xf0cf73);
    }
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
