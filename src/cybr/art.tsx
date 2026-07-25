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

  /* The mass reads as a block seen slightly from above: a stepped roof of light grey
     terraces on the left, a near-black front wall, and a mid-grey flank on the right.
     `roof` is the terrace line, sampled per column so the silhouette stays jagged. */
  const roof: number[] = [];
  let step = rows * 0.26;
  for (let col = 0; col < cols; col += 1) {
    // Terraces change in a few discrete jumps rather than a smooth curve.
    if (rand() < 0.22) step += rows * (rand() * 0.14 - 0.08);
    if (col > cols * 0.78 && rand() < 0.4) step += rows * 0.05;
    const center = Math.abs(col / cols - 0.48);
    const tower = center < 0.18 ? rows * 0.18 : center < 0.3 ? rows * 0.23 : 0;
    roof[col] = Math.min(rows * 0.55, Math.max(rows * 0.04, step - tower));
  }

  const floorOf = (col: number) => rows - 0.5 - Math.max(0, (col / cols - 0.55) * rows * 0.22);
  const leftOf = (row: number) => 2.6 + Math.sin(row * 0.42) * 1.2;
  const rightOf = (row: number) => cols - 1.4 - Math.max(0, (row / rows - 0.72) * cols * 0.3);

  for (let row = 0; row < rows; row += 1) {
    const left = leftOf(row);
    const right = rightOf(row);
    for (let col = 0; col < cols; col += 1) {
      const top = roof[col];
      if (row < top || row > floorOf(col) || col < left || col > right) continue;

      // Only the very rim is eroded — the interior stays solid.
      const edge = Math.min(row - top, col - left, right - col);
      if (edge < 0.9 && rand() > 0.72) continue;

      const depth = (row - top) / rows;
      const lit = Math.max(0, 1 - depth * 9); // thin lit strip along each terrace
      const flank = Math.max(0, (col - cols * 0.74) / (cols * 0.26)) * 0.3;
      const striation = Math.sin(row * 1.9) * 0.05 + Math.sin(row * 0.37 + 1) * 0.06;
      const patch = rand() < 0.07 ? 0.42 : 0; // stray light chips inside the mass
      const shade = 0.05 + lit * 0.85 + flank + striation + patch + rand() * 0.09;
      const index = Math.min(GREYS.length - 1, Math.max(0, Math.round(shade * (GREYS.length - 1))));
      cells.push({ x: col, y: row, w: 1, h: 1, fill: GREYS[index] });
    }
  }

  /* Accent cells hug the silhouette instead of floating free: purple runs down the
     left flank and over the top-right shoulder, lime sits low and central. */
  const accents: Cell[] = [];
  const purple = "#7b5cff";
  const lime = "#c6ff00";

  const stack = (col: number, row: number, w: number, h: number, fill: string) =>
    accents.push({ x: col, y: row, w, h, fill });

  // Tall purple column on the left shoulder.
  stack(1, Math.round(rows * 0.34), 2, 3, purple);
  stack(1, Math.round(rows * 0.44), 1, 5, purple);
  stack(2, Math.round(rows * 0.62), 2, 2, purple);
  for (let i = 0; i < 9; i += 1) {
    stack(Math.round(rand() * 4), Math.round(rows * (0.34 + rand() * 0.55)), rand() < 0.4 ? 2 : 1, 1, purple);
  }
  // Right shoulder + lower right.
  for (let i = 0; i < 10; i += 1) {
    const col = cols - 6 + Math.round(rand() * 5);
    const row = Math.round(rows * (rand() < 0.5 ? 0.1 + rand() * 0.28 : 0.6 + rand() * 0.38));
    stack(col, row, rand() < 0.35 ? 2 : 1, rand() < 0.3 ? 2 : 1, purple);
  }
  // Lime cluster across the lower middle.
  for (let i = 0; i < 13; i += 1) {
    const col = Math.round(cols * (0.12 + rand() * 0.74));
    const row = Math.round(rows * (0.55 + rand() * 0.42));
    stack(col, row, rand() < 0.4 ? 2 : 1, rand() < 0.35 ? 2 : 1, lime);
  }

  return { cells, accents };
}

export function VoxelRender({
  seed = "cybr-scn-01",
  cols = 34,
  rows = 30,
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
          opacity={0.82}
        />
      ))}
      {/* Fine scan striations across the whole mass. */}
      {Array.from({ length: Math.floor(h / 6) }, (_, i) => (
        <rect key={`s${i}`} x={0} y={i * 6} width={w} height={1} fill="#fff" opacity={0.05} />
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
