#!/usr/bin/env node
/**
 * Prove shuffle-palette: Shuffle → Undo → Redo → Reset starter.
 * Usage: RUN_ID=… node .cursor/skills/verify-atelier/scripts/drive-shuffle-palette.mjs
 */
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import {
  STARTER_HEXES,
  captureEvidence,
  evidenceDir,
  launchBrowser,
  openStudio,
  readHexes,
  readPaletteStorage,
  requireRunId,
  writeJson,
} from "./lib.mjs";

const runId = requireRunId();
const dir = evidenceDir(runId);
const steps = [];
const failures = [];

function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function note(step, data) {
  steps.push({ step, ...data });
}

try {
  const { browser, page } = await launchBrowser();
  try {
    await openStudio(page, { waitForStarter: true });

    const undo = page.getByRole("button", { name: "Undo" });
    const redo = page.getByRole("button", { name: "Redo" });
    const shuffle = page.getByRole("button", { name: "Shuffle", exact: true });

    const before = await readHexes(page);
    note("starter", { hexes: before, undoDisabled: await undo.isDisabled() });
    if (!same(before, STARTER_HEXES)) {
      failures.push(`starter hexes ${JSON.stringify(before)} !== ${JSON.stringify(STARTER_HEXES)}`);
    }
    if (!(await undo.isDisabled())) {
      failures.push("Undo should be disabled on a fresh context");
    }
    await captureEvidence(page, dir, "01-before-shuffle");

    await shuffle.click();
    await page.waitForFunction(
      (prev) => {
        const labels = [...document.querySelectorAll('button[aria-label^="Copy Hex "]')].map((el) =>
          el.getAttribute("aria-label"),
        );
        return labels.some((label, i) => label !== `Copy Hex ${prev[i]}`);
      },
      before,
      { timeout: 10_000 },
    );

    const shuffled = await readHexes(page);
    note("shuffle", { hexes: shuffled, undoDisabled: await undo.isDisabled() });
    if (same(shuffled, before)) {
      failures.push("Shuffle did not change any hex");
    }
    if (await undo.isDisabled()) {
      failures.push("Undo stayed disabled after Shuffle");
    }
    const storageAfterShuffle = await readPaletteStorage(page);
    writeFileSync(join(dir, "atelier-palette.after-shuffle.json"), `${storageAfterShuffle ?? "null"}\n`);
    await captureEvidence(page, dir, "02-after-shuffle");

    await undo.click();
    await page.waitForFunction(
      (expected) => {
        const labels = [...document.querySelectorAll('button[aria-label^="Copy Hex "]')].map((el) =>
          el.getAttribute("aria-label")?.slice("Copy Hex ".length),
        );
        return JSON.stringify(labels) === JSON.stringify(expected);
      },
      before,
      { timeout: 10_000 },
    );
    const undone = await readHexes(page);
    note("undo", { hexes: undone, redoDisabled: await redo.isDisabled() });
    if (!same(undone, before)) {
      failures.push(`Undo restored ${JSON.stringify(undone)} not ${JSON.stringify(before)}`);
    }
    if (await redo.isDisabled()) {
      failures.push("Redo stayed disabled after Undo");
    }
    await captureEvidence(page, dir, "03-after-undo");

    await redo.click();
    await page.waitForFunction(
      (expected) => {
        const labels = [...document.querySelectorAll('button[aria-label^="Copy Hex "]')].map((el) =>
          el.getAttribute("aria-label")?.slice("Copy Hex ".length),
        );
        return JSON.stringify(labels) === JSON.stringify(expected);
      },
      shuffled,
      { timeout: 10_000 },
    );
    const redone = await readHexes(page);
    note("redo", { hexes: redone });
    if (!same(redone, shuffled)) {
      failures.push(`Redo restored ${JSON.stringify(redone)} not ${JSON.stringify(shuffled)}`);
    }
    await captureEvidence(page, dir, "04-after-redo");

    await page.getByRole("button", { name: "Shuffle options" }).click();
    await page.getByRole("menuitem", { name: "Reset starter" }).click();
    await page.getByRole("button", { name: `Copy Hex ${STARTER_HEXES[0]}` }).waitFor({
      timeout: 10_000,
    });
    const reset = await readHexes(page);
    const harmony = (await page.getByRole("button", { name: "Editorial" }).count()) > 0;
    note("reset", { hexes: reset, editorialVisible: harmony });
    if (!same(reset, STARTER_HEXES)) {
      failures.push(`Reset starter hexes ${JSON.stringify(reset)}`);
    }
    if (!harmony) failures.push("Reset starter did not show harmony Editorial");
    await captureEvidence(page, dir, "05-after-reset");
  } finally {
    await browser.close();
  }
} catch (err) {
  failures.push(String(err?.stack ?? err));
}

const ok = failures.length === 0;
const proof = [
  "# shuffle-palette proof",
  "",
  `- Feature: \`shuffle-palette\``,
  `- Entry point: button \`Shuffle\` (then Undo, Redo, Shuffle options → Reset starter)`,
  `- RUN_ID: \`${runId}\``,
  `- Result: ${ok ? "PASS" : "FAIL"}`,
  "",
  "## Steps",
  "",
  "```json",
  JSON.stringify(steps, null, 2),
  "```",
  "",
  "## Failures",
  "",
  failures.length ? failures.map((f) => `- ${f}`).join("\n") : "- none",
  "",
  "## Artifacts",
  "",
  "- `01-before-shuffle.png` / `.aria.yml`",
  "- `02-after-shuffle.png` / `.aria.yml` (action result)",
  "- `03-after-undo.png` / `.aria.yml`",
  "- `04-after-redo.png` / `.aria.yml`",
  "- `05-after-reset.png` / `.aria.yml`",
  "- `atelier-palette.after-shuffle.json` (localStorage)",
  "",
].join("\n");

writeFileSync(join(dir, "proof.md"), proof);
writeJson(join(dir, "drive-shuffle.json"), { ok, runId, steps, failures });
console.log(proof);
process.exit(ok ? 0 : 1);
