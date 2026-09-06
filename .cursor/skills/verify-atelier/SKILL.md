---
name: verify-atelier
description: "Launch, doctor, and Playwright-drive the Atelier brand style studio (Vite/React 19 at http://127.0.0.1:8080). Use when proving shuffle, lock, copy, export, or contrast on this app."
---

# Verify Atelier

Atelier is a single-route brand style studio. `/` renders `PaletteStudio`. A user forges five swatches (Paper, Ink, Accent, Surface, Mark), locks color or texture independently, shuffles the rest, copies Hex/RGB/HSL, checks WCAG contrast, and downloads a Brand Style Standard.

This skill is the scripted way to drive that UI. Read `features/` before a run. Prove one mapped feature per drive unless a maintenance pass asks for more.

## Surface

- Web UI. React 19, TanStack Start/Router, Tailwind v4, Zustand.
- Route: `http://127.0.0.1:8080/` only (no other app routes to drive).
- Auth exists in the scaffold (`AuthProvider`) but does **not** gate PaletteStudio. Do not sign in.
- Persistence: browser `localStorage` key `atelier-palette` (Zustand persist). Undo/redo history is in-memory only and does not survive reload.
- Repo root is the directory that contains `package.json` and `src/components/palette-studio.tsx`. Helpers resolve it as four parents above `scripts/`.

## Launch

One instance. Vite is `strictPort: 8080` on `0.0.0.0`. A second start fails instead of picking another port. Never double-drive whatever already owns 8080.

From repo root:

```bash
export RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
.cursor/skills/verify-atelier/scripts/launch.sh
```

What launch does:

1. Creates `artifacts/verify-atelier/$RUN_ID/` (gitignored).
2. Refuses if `http://127.0.0.1:8080/` already answers **and** the answering process is not the PID recorded for this `RUN_ID`.
3. Runs `npm run dev` (`node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080`) from the repo root, in a process group, logging to `artifacts/verify-atelier/$RUN_ID/dev.log`.
4. Writes `launch.pid`, `launch.json`, and `artifacts/verify-atelier/.current-run`.
5. Waits until `curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/` succeeds (up to 120s).

Ready signal: HTTP 200 from `http://127.0.0.1:8080/`. Then run Doctor — HTML-only is not identity.

Do **not** use `startup.sh` for verification. It `cd`s to `/workspace` and backgrounds `npm run dev` without a recorded PID. Verification owns its PID.

First-time machine:

```bash
npm install
npx playwright install chromium
```

`playwright` is already a `package.json` devDependency (`^1.62.0`). There is no Cypress and no repo e2e spec directory.

## Doctor

Read-only. Run before the first drive, after any failed drive, and whenever the UI looks off.

```bash
export RUN_ID  # same id launch printed
node .cursor/skills/verify-atelier/scripts/doctor.mjs
```

Doctor must report all of:

- `http://127.0.0.1:8080/` returns HTTP 200.
- If `artifacts/verify-atelier/$RUN_ID/launch.pid` exists, that PID is alive and 8080 is in its process tree (or is the recorded child). Refuse to drive a stranger on 8080.
- Playwright, desktop viewport `1280x800`, page shows Atelier identity:
  - document title `Atelier`
  - text `Atelier` and `Brand style studio` (rendered as `BRAND STYLE STUDIO` via CSS `uppercase`; match case-insensitively)
  - heading `Five swatches. Lock what holds.`
  - button `Shuffle`
  - `aria-label` `Undo`, `Redo`, `Shuffle options`
  - roles `Paper`, `Ink`, `Accent`, `Surface`, `Mark`
  - heading `Brand Style Standard`
  - heading `Contrast`
  - text `Specimen`

Writes `artifacts/verify-atelier/$RUN_ID/doctor.json`. Exit `0` only when every check passed.

If doctor fails because the process wedged, run Cleanup, Launch, Doctor again. Do not keep driving.

## Drive

Harness: Playwright (`chromium` from `npx playwright`, this repo's `playwright` package). Isolated browser **context** per drive so `localStorage` is not the user's and not a previous run.

Default context:

```js
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
```

Viewport `1280x800` (`lg`) is required so the header uses the desktop Shuffle cluster (`hidden lg:flex`). Below `lg` (1024px) a duplicate mobile Shuffle is shown instead. `getByRole` skips `display: none`, but keep the viewport stable.

Stable handles (from `src/components/palette-studio.tsx` and children):

| What | Handle |
| --- | --- |
| Identity | text `Atelier`, `Brand style studio` |
| Hero | `getByRole('heading', { name: 'Five swatches. Lock what holds.' })` |
| Shuffle | `getByRole('button', { name: 'Shuffle', exact: true })` (without `exact`, this also matches `Shuffle options`) |
| Shuffle menu | `getByRole('button', { name: 'Shuffle options' })` then menuitems `Shuffle unlocked`, `Colors only`, `Textures only`, `Reset starter` |
| Undo / Redo | `getByRole('button', { name: 'Undo' })` / `'Redo'` (disabled when stacks are empty) |
| Live theme | `getByRole('button', { name: 'Preview on studio' })` toggles to `Studio uses kit` (`aria-pressed`) |
| Harmony | outline button whose name is the current label (`Editorial` on a fresh store) |
| Swatch lock color | `getByRole('button', { name: 'Lock Paper color' })` → name becomes `Unlock Paper color`, `aria-pressed=true` (same for Ink/Accent/Surface/Mark) |
| Swatch lock texture | `Lock Paper texture` / `Unlock Paper texture` |
| Pick color | `getByLabel('Pick Paper color')` (`input type=color`) |
| Copy values | `getByRole('button', { name: 'Copy Hex #f3efe6' })` (RGB/HSL analogously; name includes the live value) |
| Brand name | `getByLabel('Brand name')` |
| Download kit | `getByRole('button', { name: 'Download brand standard' })` |
| Copy exports | buttons `CSS`, `Tailwind`, `JSON`, `SVG`; `Copy Markdown brand guide` |
| Contrast | `getByRole('heading', { name: 'Contrast' })` |
| Specimen | text `Specimen` (kicker, not a heading); specimen `h2` is the brand name |

Fresh context + completed rehydrate → starter palette (also `Reset starter`):

- Paper `#f3efe6` Laid paper
- Ink `#161513` Grain
- Accent `#3f5850` Linen
- Surface `#e4ddd0` Solid
- Mark `#8a6a4a` Hatch
- Harmony `Editorial`, brand name `Atelier`

Wait for `getByRole('button', { name: 'Copy Hex #f3efe6' })` before asserting starter state. Rehydrate runs in `useEffect`; racing Shuffle against a dirty persisted palette invalidates the run.

Keyboard (focus must not be an `INPUT`/`TEXTAREA` for Space):

- `Space` → shuffle unlocked color **and** texture
- `Shift+Space` → textures only
- `Control+z` / `Meta+z` → undo (this handler **does** fire while typing)
- `Control+Shift+z` / `Meta+Shift+z` → redo

Toasts (Sonner, `id: atelier-copy`, ~900ms except download at 1400ms): `Copied Hex` / `Copied RGB` / `Copied HSL`, `Copied CSS tokens`, `Copied Tailwind theme`, `Copied JSON standard`, `Copied Markdown standard`, `Brand standard downloaded`, `Downloaded SVG strip`. Capture immediately; they replace each other.

Mapped features live in `features/`. Recipes there are the source of truth. The helper that has been executed end-to-end is shuffle:

```bash
export RUN_ID
node .cursor/skills/verify-atelier/scripts/drive-shuffle-palette.mjs
```

Drive other features with the same Playwright context recipe in the matching `features/*.md` file. Do not call internal Zustand setters. Do not hit test-only endpoints (there are none for the studio).

## Evidence

Root: `artifacts/verify-atelier/<run-id>/` (directory `artifacts/` is gitignored). Proof that belongs in git is the short note at `.cursor/skills/verify-atelier/PROOF.md`, which **points at** that path.

Every drive writes at least:

- `*-before.png` and `*-after.png` (or numbered steps) — app identity visible (`Atelier`, `Brand style studio`)
- `*-before.aria.yml` and `*-after.aria.yml` from `page.locator('body').ariaSnapshot()`
- `proof.md` — feature id, entry point, what changed, pass/fail
- side-effect dump when the feature has one: `localStorage` key `atelier-palette`, downloaded files, clipboard text, toast text

Standards:

- Exercise the real user path (click Shuffle, not `usePaletteStore.getState().shuffle()`).
- Capture the action **and** the resulting state, not only the final screen.
- Shuffle proof: hex (and/or texture) values before vs after, plus Undo restoring the before values.
- Export proof: the five downloaded filenames and a toast, not only a click.
- Copy proof: toast **and** clipboard contents (grant `clipboard-read` / `clipboard-write` on origin `http://127.0.0.1:8080`).
- Mocks: none. This app is local-only for the studio.

## Cleanup

```bash
export RUN_ID  # or omit to use artifacts/verify-atelier/.current-run
.cursor/skills/verify-atelier/scripts/cleanup.sh
```

Cleanup kills **only** the process tree of `launch.pid` for that run (TERM, then KILL). It does not `pkill node`, does not `pkill vite`, and does **not** delete `artifacts/`. After cleanup, `ls artifacts/verify-atelier/$RUN_ID` must still list screenshots and `proof.md`.

If 8080 still answers after cleanup, the listener is not ours — stop and report the PID; do not kill it.

## Helpers

All under `.cursor/skills/verify-atelier/scripts/`. They are executable. Invoke from repo root.

| Script | Invocation | Purpose |
| --- | --- | --- |
| `launch.sh` | `RUN_ID=… .cursor/skills/verify-atelier/scripts/launch.sh` | Start `npm run dev` if 8080 is free; record PID; wait until the port answers |
| `doctor.mjs` | `RUN_ID=… node .cursor/skills/verify-atelier/scripts/doctor.mjs` | HTTP + PID + Playwright identity |
| `drive-shuffle-palette.mjs` | `RUN_ID=… node .cursor/skills/verify-atelier/scripts/drive-shuffle-palette.mjs` | Prove `shuffle-palette` (Shuffle, Undo, Redo, Reset starter) |
| `cleanup.sh` | `RUN_ID=… .cursor/skills/verify-atelier/scripts/cleanup.sh` | Kill the recorded PID tree; leave evidence |
| `lib.mjs` | imported by the Node helpers | Paths, identity wait, hex readout, screenshots |

Chromium args `--no-sandbox --disable-dev-shm-usage` are required in this container-style environment.

## Isolate

- One Vite on 8080. `strictPort: true`.
- One `RUN_ID` per verification run. Evidence is namespaced by that id.
- Playwright uses a fresh context (empty `localStorage`). Do not attach to the user's Chrome profile.
- Do not run `startup.sh` in parallel with `launch.sh`.

## Maintenance

When the studio UI changes, run `/maintain-verification-skill` against this skill so `features/` stays honest.
