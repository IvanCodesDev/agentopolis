// Screenshot every CYBR_ board at its native 1672x941 so the render can be diffed
// against the reference deck in UI/. Usage: node tools/shoot.mjs [baseUrl] [ids...]
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BOARDS = [
  { id: "01", route: "/v2", name: "home" },
  { id: "02", route: "/v2/tasks", name: "tasks" },
  { id: "03", route: "/v2/projects/PRJ-2024-0815", name: "project" },
  { id: "04", route: "/v2/credentials/CYBR-2024-000456", name: "credential" },
  { id: "05", route: "/v2/profile", name: "profile" },
  { id: "06", route: "/v2/verify/VC-CYBR-0007", name: "verify" },
  { id: "07", route: "/v2/design", name: "design" },
];

const [, , baseArg, ...only] = process.argv;
const base = baseArg ?? "http://localhost:5173";
const wanted = only.length ? BOARDS.filter((b) => only.includes(b.id)) : BOARDS;

await mkdir("preview", { recursive: true });

// Prefer Playwright's own build; fall back to the Edge already on the machine so the
// deck can be shot without pulling a browser download into the repo.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
const page = await browser.newPage({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });

const failures = [];
page.on("pageerror", (err) => failures.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() === "error") failures.push(msg.text());
});

for (const board of wanted) {
  await page.goto(base + board.route, { waitUntil: "networkidle" });
  const slide = page.locator(".cy-board");
  await slide.waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(180);
  const out = `preview/${board.id}-${board.name}.png`;
  await slide.screenshot({ path: out });
  console.log(`shot ${board.id} -> ${out}`);
}

await browser.close();

if (failures.length) {
  console.error("\npage errors:\n" + [...new Set(failures)].join("\n"));
  process.exit(1);
}
