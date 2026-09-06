import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const APP_URL = process.env.ATELIER_URL ?? "http://127.0.0.1:8080/";
export const VIEWPORT = { width: 1280, height: 800 };
export const STARTER_HEXES = ["#f3efe6", "#161513", "#3f5850", "#e4ddd0", "#8a6a4a"];
export const ROLES = ["Paper", "Ink", "Accent", "Surface", "Mark"];

export function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "../../../..");
}

export function requireRunId() {
  const runId = process.env.RUN_ID?.trim();
  if (!runId) {
    throw new Error("RUN_ID is required (export RUN_ID=… from launch.sh)");
  }
  if (runId.includes("/") || runId.includes("..")) {
    throw new Error("RUN_ID must be a single path segment");
  }
  return runId;
}

export function evidenceDir(runId = requireRunId()) {
  const dir = join(repoRoot(), "artifacts/verify-atelier", runId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function launchBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  return { browser, context, page };
}

export async function openStudio(page, { waitForStarter = false } = {}) {
  await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  // CSS `uppercase` turns the kicker into "BRAND STYLE STUDIO"; match either casing.
  await page.getByText(/brand style studio/i).waitFor({ timeout: 30_000 });
  await page.getByRole("heading", { name: "Five swatches. Lock what holds." }).waitFor();
  await page.getByRole("button", { name: "Shuffle", exact: true }).waitFor();
  if (waitForStarter) {
    await page.getByRole("button", { name: `Copy Hex ${STARTER_HEXES[0]}` }).waitFor({
      timeout: 15_000,
    });
  } else {
    await page.getByRole("button", { name: /^Copy Hex / }).first().waitFor({ timeout: 15_000 });
  }
}

export async function readHexes(page) {
  const buttons = page.getByRole("button", { name: /^Copy Hex / });
  const count = await buttons.count();
  const hexes = [];
  for (let i = 0; i < count; i++) {
    const label = await buttons.nth(i).getAttribute("aria-label");
    hexes.push(String(label ?? "").slice("Copy Hex ".length));
  }
  return hexes;
}

export async function captureEvidence(page, dir, stem) {
  const png = join(dir, `${stem}.png`);
  const ariaPath = join(dir, `${stem}.aria.yml`);
  await page.screenshot({ path: png, fullPage: true });
  let snapshot = "";
  try {
    snapshot = await page.locator("body").ariaSnapshot();
  } catch {
    snapshot = await page.locator("body").innerText();
  }
  writeFileSync(ariaPath, snapshot.endsWith("\n") ? snapshot : `${snapshot}\n`);
  return { png, aria: ariaPath };
}

export async function readPaletteStorage(page) {
  return page.evaluate(() => window.localStorage.getItem("atelier-palette"));
}

export function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
