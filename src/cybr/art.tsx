import type { ReactNode } from "react";

/* ------------------------------------------------------------------ helpers */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* --------------------------------------------------------------- voxel block

   Boards 01 and 04 are built around the same render: a chunky dithered voxel mass
   with a lit top face, shot through with purple / lime accent cells and wrapped in
   survey marks. It is generated rather than shipped as a bitmap so it stays crisp at
   the board's native 1672px width. */

const GREYS = ["#111114", "#1b1b20", "#26262c", "#33333a", "#43434b", "#55555e", "#6d6d77", "#8c8c96", "#b3b3bb", "#d9d9de", "#efeff2"];

type Cell = { x: number; y: number; w: number; h: number; fill: string };

function buildVoxel(seed: string, cols: number, rows: number) {
  const rand = mulberry32(seedOf(seed));
  const cells: Cell[] = [];

  // Silhouette: a solid body with a chamfered top-left shoulder, eroded at the edges.
  const bodyTop = rows * 0.3;
  const shoulder = rows * 0.16;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const u = col / (cols - 1);
      const v = row / (rows - 1);

      // Top face slopes away to the right; left flank is cut back.
      const roof = bodyTop - shoulder * (1 - u) * 1.4 + Math.sin(u * 5.2) * 1.1;
      const left = 3.2 + Math.sin(v * 4.1) * 1.6;
      const right = cols - 2.4 - Math.cos(v * 3.3) * 1.4;
      const floor = rows - 1.5 - u * 1.8;

      const inside = row > roof && row < floor && col > left && col < right;
      // Erode the boundary so the mass keeps a pixel-scattered rim.
      const edge = Math.min(row - roof, floor - row, col - left, right - col);
      if (!inside || (edge < 1.6 && rand() > 0.45)) continue;

      // Lit top band, dark front, mid-tone right flank.
      const lit = Math.max(0, 1 - (row - roof) / 4.5);
      const flank = Math.max(0, (col - right + 5) / 5);
      const band = Math.sin(row * 1.7) * 0.06 + Math.sin(row * 0.31) * 0.09;
      const shade = 0.16 + lit * 0.62 + flank * 0.3 + band + rand() * 0.16;
      const index = Math.min(GREYS.length - 1, Math.max(0, Math.round(shade * (GREYS.length - 1))));
      cells.push({ x: col, y: row, w: 1, h: 1, fill: GREYS[index] });
    }
  }

  // Accent cells: purple down the left flank and upper right, lime low and central.
  const accents: Cell[] = [];
  const drop = (x: number, y: number, w: number, h: number, fill: string) => accents.push({ x, y, w, h, fill });
  const purple = "#7b5cff";
  const lime = "#c6ff00";

  for (let i = 0; i < 26; i += 1) {
    const onLeft = rand() < 0.5;
    const col = onLeft ? 0.5 + rand() * 5 : cols - 7 + rand() * 6;
    const row = 3 + rand() * (rows - 6);
    const size = rand() < 0.3 ? 2 : 1;
    drop(Math.round(col), Math.round(row), size, size, purple);
  }
  for (let i = 0; i < 14; i += 1) {
    const col = 4 + rand() * (cols - 9);
    const row = rows * 0.52 + rand() * rows * 0.42;
    const size = rand() < 0.35 ? 2 : 1;
    drop(Math.round(col), Math.round(row), size, size, lime);
  }

  return { cells, accents };
}

export function VoxelRender({
  seed = "cybr-scn-01",
  cols = 30,
  rows = 28,
  cell = 19,
  className,
}: {
  seed?: string;
  cols?: number;
  rows?: number;
  cell?: number;
  className?: string;
}) {
  const { cells, accents } = buildVoxel(seed, cols, rows);
  const w = cols * cell;
  const h = rows * cell;

  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {cells.map((c) => (
        <rect key={`c${c.x}-${c.y}`} x={c.x * cell} y={c.y * cell} width={cell} height={cell} fill={c.fill} />
      ))}
      {accents.map((c, i) => (
        <rect
          key={`a${i}`}
          x={c.x * cell}
          y={c.y * cell}
          width={c.w * cell}
          height={c.h * cell}
          fill={c.fill}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------ survey overlay

   The dotted polylines, node dots and stray +/x marks scattered around the render. */

export function SurveyMarks({ seed = "cybr-survey", className }: { seed?: string; className?: string }) {
  const rand = mulberry32(seedOf(seed));
  const marks: ReactNode[] = [];

  const cross = (x: number, y: number, r: number, color: string, key: string) => (
    <path key={key} d={`M${x - r} ${y}h${r * 2}M${x} ${y - r}v${r * 2}`} stroke={color} strokeWidth={2.4} />
  );
  const ex = (x: number, y: number, r: number, color: string, key: string) => (
    <path key={key} d={`M${x - r} ${y - r}l${r * 2} ${r * 2}M${x + r} ${y - r}l${-r * 2} ${r * 2}`} stroke={color} strokeWidth={2.4} />
  );

  marks.push(cross(232, 152, 9, "#0b0b0b", "c1"));
  marks.push(cross(126, 218, 8, "#0b0b0b", "c2"));
  marks.push(cross(128, 300, 7, "#0b0b0b", "c3"));
  marks.push(cross(660, 148, 8, "#0b0b0b", "c4"));
  marks.push(cross(700, 210, 7, "#0b0b0b", "c5"));
  marks.push(cross(600, 30, 13, "#c6ff00", "c6"));
  marks.push(cross(640, 104, 10, "#c6ff00", "c7"));
  marks.push(cross(390, 92, 9, "#7b5cff", "c8"));
  marks.push(cross(126, 652, 11, "#c6ff00", "c9"));
  marks.push(ex(140, 452, 12, "#c6ff00", "x1"));
  marks.push(ex(272, 330, 9, "#7b5cff", "x2"));

  // Dotted survey lines with node dots along the top and left.
  const polylines = [
    "M120 250 L250 150 L470 118 L640 150",
    "M170 300 L300 210 L520 180",
    "M96 470 L96 300 L200 236",
  ];
  polylines.forEach((d, i) => {
    marks.push(<path key={`p${i}`} d={d} stroke="#9a9aa3" strokeWidth={1} strokeDasharray="2 5" fill="none" />);
  });
  for (let i = 0; i < 26; i += 1) {
    marks.push(
      <circle
        key={`n${i}`}
        cx={90 + rand() * 620}
        cy={90 + rand() * 220}
        r={rand() < 0.25 ? 3 : 1.8}
        fill="#3d3d45"
      />,
    );
  }

  return (
    <svg className={className} viewBox="0 0 840 680" fill="none" aria-hidden="true" focusable="false">
      {marks}
    </svg>
  );
}

/** Faint construction grid behind the render. */
export function BlueprintGrid({ className, step = 42 }: { className?: string; step?: number }) {
  return (
    <svg className={className} viewBox="0 0 840 680" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="cy-bp" width={step} height={step} patternUnits="userSpaceOnUse">
          <path d={`M${step} 0H0V${step}`} fill="none" stroke="#e4e4e9" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="840" height="680" fill="url(#cy-bp)" />
    </svg>
  );
}

/* --------------------------------------------------------------- thumbnails */

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Small dithered plate used for task / project thumbnails on boards 02 and 05. */
export function PixelPlate({ seed, cols = 22, rows = 22, className }: { seed: string; cols?: number; rows?: number; className?: string }) {
  const rand = mulberry32(seedOf(seed));
  const cells: ReactNode[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const u = x / cols;
      const v = y / rows;
      const blob = 1 - Math.hypot(u - 0.5, v - 0.52) * 1.9;
      const shade = blob * 0.8 + rand() * 0.45 - 0.12;
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      if (shade <= threshold) continue;
      const accent = rand() < 0.06;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={accent ? "#7b5cff" : shade > threshold + 0.34 ? "#0b0b0b" : "#6d6d77"}
        />,
      );
    }
  }

  return (
    <svg className={className} viewBox={`0 0 ${cols} ${rows}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <rect width={cols} height={rows} fill="#f2f2f4" />
      {cells}
    </svg>
  );
}
