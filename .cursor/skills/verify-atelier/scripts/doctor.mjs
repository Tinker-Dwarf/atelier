#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APP_URL,
  captureEvidence,
  evidenceDir,
  launchBrowser,
  openStudio,
  requireRunId,
  writeJson,
} from "./lib.mjs";

const runId = requireRunId();
const dir = evidenceDir(runId);
const report = {
  ok: false,
  runId,
  url: APP_URL,
  httpStatus: null,
  pidAlive: null,
  identity: {},
  errors: [],
};

async function httpStatus() {
  try {
    const out = execSync(
      `curl -s -o /dev/null -w "%{http_code}" --max-time 5 ${JSON.stringify(APP_URL)}`,
      { encoding: "utf8" },
    );
    return Number.parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function collectTree(pid) {
  const ids = [pid];
  let raw = "";
  try {
    raw = execSync(`ps -o pid= --ppid ${pid}`, { encoding: "utf8" });
  } catch {
    return ids;
  }
  for (const line of raw.trim().split(/\s+/).filter(Boolean)) {
    const child = Number.parseInt(line, 10);
    if (Number.isFinite(child)) ids.push(...collectTree(child));
  }
  return ids;
}

function listenerMentions(pids) {
  let listener = "";
  try {
    listener = execSync("ss -ltnp 2>/dev/null | awk '/:8080 / {print}'", {
      encoding: "utf8",
    });
  } catch {
    try {
      listener = execSync("lsof -nP -iTCP:8080 -sTCP:LISTEN 2>/dev/null", {
        encoding: "utf8",
      });
    } catch {
      return { found: false, listener: "" };
    }
  }
  if (!listener.trim()) return { found: false, listener: "" };
  const hit = pids.some(
    (pid) =>
      listener.includes(`pid=${pid}`) ||
      listener.includes(`pid=${pid},`) ||
      listener.includes(` ${pid} `),
  );
  return { found: hit, listener: listener.trim() };
}

try {
  report.httpStatus = await httpStatus();
  if (report.httpStatus !== 200) {
    report.errors.push(`expected HTTP 200 from ${APP_URL}, got ${report.httpStatus}`);
  }

  const pidPath = join(dir, "launch.pid");
  if (existsSync(pidPath)) {
    const pid = Number.parseInt(readFileSync(pidPath, "utf8").trim(), 10);
    report.launchPid = pid;
    report.pidAlive = pidAlive(pid);
    if (!report.pidAlive) {
      report.errors.push(`launch.pid ${pid} is not alive`);
    } else {
      const tree = collectTree(pid);
      report.pidTree = tree;
      const listen = listenerMentions(tree);
      report.listener = listen.listener;
      if (listen.listener && !listen.found) {
        report.errors.push(
          "port 8080 is listening but not in this run's PID tree — refuse to drive a stranger",
        );
      }
    }
  } else {
    report.errors.push(`missing ${pidPath} — launch this RUN_ID before doctor`);
  }

  const { browser, page } = await launchBrowser();
  try {
    await openStudio(page);
    const title = await page.title();
    const identity = {
      title,
      atelier: await page.getByText("Atelier", { exact: true }).first().isVisible(),
      brandStyleStudio: await page.getByText(/brand style studio/i).first().isVisible(),
      hero: await page.getByRole("heading", { name: "Five swatches. Lock what holds." }).isVisible(),
      shuffle: await page.getByRole("button", { name: "Shuffle", exact: true }).isVisible(),
      undo: await page.getByRole("button", { name: "Undo" }).isVisible(),
      redo: await page.getByRole("button", { name: "Redo" }).isVisible(),
      shuffleOptions: await page.getByRole("button", { name: "Shuffle options" }).isVisible(),
      paper: await page.getByText("Paper", { exact: true }).first().isVisible(),
      ink: await page.getByText("Ink", { exact: true }).first().isVisible(),
      accent: await page.getByText("Accent", { exact: true }).first().isVisible(),
      surface: await page.getByText("Surface", { exact: true }).first().isVisible(),
      mark: await page.getByText("Mark", { exact: true }).first().isVisible(),
      brandStandard: await page.getByRole("heading", { name: "Brand Style Standard" }).isVisible(),
      contrast: await page.getByRole("heading", { name: "Contrast" }).isVisible(),
      specimen: await page.getByText("Specimen", { exact: true }).isVisible(),
    };
    report.identity = identity;
    if (title !== "Atelier") report.errors.push(`document title is ${JSON.stringify(title)}`);
    for (const [key, ok] of Object.entries(identity)) {
      if (key === "title") continue;
      if (!ok) report.errors.push(`identity missing: ${key}`);
    }
    await captureEvidence(page, dir, "doctor");
  } finally {
    await browser.close();
  }
} catch (err) {
  report.errors.push(String(err?.stack ?? err));
}

report.ok = report.errors.length === 0;
writeJson(join(dir, "doctor.json"), report);
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
