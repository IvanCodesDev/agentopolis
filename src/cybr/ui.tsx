import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ pixel art */

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

/** 4x4 Bayer matrix — gives the ordered-dither texture the board's artwork uses. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Smooth value-noise sampler on a coarse lattice — gives the plates real structure. */
function makeNoise(rand: () => number, lattice: number) {
  const grid: number[][] = [];
  for (let j = 0; j <= lattice; j += 1) {
    grid[j] = [];
    for (let i = 0; i <= lattice; i += 1) grid[j][i] = rand();
  }
  const ease = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = Math.min(Math.max(u, 0), 0.9999) * lattice;
    const y = Math.min(Math.max(v, 0), 0.9999) * lattice;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = ease(x - i);
    const fy = ease(y - j);
    const top = grid[j][i] * (1 - fx) + grid[j][i + 1] * fx;
    const bottom = grid[j + 1][i] * (1 - fx) + grid[j + 1][i + 1] * fx;
    return top * (1 - fy) + bottom * fy;
  };
}

/**
 * Dithered black/white plate standing in for the design board's pixel artwork.
 * Deterministic per `seed`, so a card keeps the same picture across renders.
 */
export function PixelPlate({
  seed,
  cols = 32,
  rows = 32,
  className,
  style,
}: {
  seed: string;
  cols?: number;
  rows?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const rand = mulberry32(seedOf(seed));
  const coarse = makeNoise(rand, 3);
  const fine = makeNoise(rand, 7);

  // A few scanline bands get nudged sideways for the board's glitched look.
  const shift: number[] = [];
  for (let y = 0; y < rows; y += 1) {
    const previous = shift[y - 1] ?? 0;
    if (rand() < 0.08) shift[y] = Math.round(rand() * 4) - 2;
    else shift[y] = rand() < 0.7 ? 0 : previous;
  }

  const cells: ReactNode[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const u = (x + shift[y]) / cols;
      const v = y / rows;
      // Vignette keeps a bright subject mass in the middle, noise supplies detail.
      const vignette = 1 - Math.hypot(u - 0.5, v - 0.52) * 1.65;
      const detail = coarse(u, v) * 0.68 + fine(u, v) * 0.32;
      const field = vignette * 0.52 + detail * 0.62 - 0.12;
      const shade = Math.min(1, Math.max(0, (field - 0.42) * 2.15 + 0.5));
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      if (shade <= threshold) continue;
      const bright = shade > threshold + 0.3;
      cells.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={bright ? "#f4f4f7" : "#83838f"} />,
      );
    }
  }

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect width={cols} height={rows} fill="#0b0b0c" />
      {cells}
    </svg>
  );
}

/* ------------------------------------------------------------------- data viz */

export type DonutSlice = { label: string; value: number; color: string };

/** Ring chart used by 05「凭证概览」and 07「数据可视化」. */
export function Donut({
  slices,
  size = 132,
  thickness = 14,
  caption,
  sub,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  caption?: ReactNode;
  sub?: ReactNode;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="cy-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eeeef1"
            strokeWidth={thickness}
          />
          {slices.map((slice) => {
            const length = (slice.value / total) * circumference;
            const dash = <circle
              key={slice.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />;
            offset += length;
            return dash;
          })}
        </g>
      </svg>
      {(caption || sub) && (
        <figcaption>
          {caption != null && <b>{caption}</b>}
          {sub != null && <span>{sub}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** Small trend line shown next to the 12.8K figure on board 07. */
export function Sparkline({
  points,
  width = 96,
  height = 30,
  color = "var(--cy-purple)",
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------------------------------------------------------------- tags */

export type CyStatus = "run" | "wait" | "check" | "done" | "revoked";

export const STATUS_TEXT: Record<CyStatus, string> = {
  run: "运行中",
  wait: "待提交",
  check: "待验收",
  done: "已完成",
  revoked: "已撤销",
};

export function Tag({
  status,
  children,
  plain,
}: {
  status: CyStatus | "lime";
  children?: ReactNode;
  plain?: boolean;
}) {
  return (
    <span className={`cy-tag cy-tag-${status}${plain ? " cy-tag-plain" : ""}`}>
      {children ?? STATUS_TEXT[status as CyStatus]}
    </span>
  );
}

/** 「已认证机构」seal that sits next to issuer names. */
export function Seal({ children = "已认证机构" }: { children?: ReactNode }) {
  return (
    <span className="cy-seal">
      <Icon name="check" size={11} />
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------- icons */

const PATHS: Record<string, ReactNode> = {
  arrow: <path d="M7 17 17 7M9 7h8v8" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  shield: <path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3Z" />,
  shieldCheck: <><path d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  file: <><path d="M14 3v5h5" /><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5" /><path d="M17 5.5a3.5 3.5 0 0 1 0 7M18.5 20c0-2.4-.8-4.1-2.2-5.2" /></>,
  award: <><circle cx="12" cy="9" r="5.5" /><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7" /></>,
  star: <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.4 2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  link: <><path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.8 6.5" /><path d="M13.5 10.5a4 4 0 0 0-5.7 0L5 13.3a4 4 0 1 0 5.7 5.7l1.4-1.4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1.2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.8 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.2a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 14 4.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.6 1.1Z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" /></>,
  more: <><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></>,
  send: <path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3Z" />,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M3 12.5h18" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  eye: <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10.5 20a2 2 0 0 0 3 0" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 17 5-4.5 4.5 4L17 13l3 3" /></>,
  frame: <path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4" />,
  sparkle: <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 17v4" /></>,
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.7,
  className,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const body = PATHS[name] ?? PATHS.grid;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {body}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);

/* ------------------------------------------------------------------ QR plate */

/** Deterministic QR-looking plate for the credential card on board 04. */
export function QrPlate({ seed, size = 76 }: { seed: string; size?: number }) {
  const modules = 21;
  const rand = mulberry32(seedOf(seed));
  const filled: ReactNode[] = [];

  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= modules - 7 && y < 7) || (x < 7 && y >= modules - 7);

  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      if (isFinder(x, y) || rand() > 0.5) continue;
      filled.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    }
  }

  const finder = (ox: number, oy: number) => (
    <g key={`f${ox}-${oy}`}>
      <rect x={ox} y={oy} width={7} height={7} />
      <rect x={ox + 1} y={oy + 1} width={5} height={5} fill="#fff" />
      <rect x={ox + 2} y={oy + 2} width={3} height={3} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      shapeRendering="crispEdges"
      fill="#0b0b0c"
      role="img"
      aria-label="凭证二维码"
    >
      <rect width={modules} height={modules} fill="#fff" />
      {filled}
      {finder(0, 0)}
      {finder(modules - 7, 0)}
      {finder(0, modules - 7)}
    </svg>
  );
}
