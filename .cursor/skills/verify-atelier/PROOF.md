# Proof: verify-atelier (INGOT-12)

Proven 2026-09-06 against this checkout. Evidence is **not** in git (`artifacts/` is gitignored). Re-run the helpers to regenerate it.

## What was proven

Feature **`shuffle-palette`**, user path:

1. Launch `npm run dev` on `http://127.0.0.1:8080/` (owned PID).
2. Doctor: HTTP 200, launch PID alive, port 8080 in that PID tree, Atelier identity in Chromium (`Atelier`, `Brand style studio`, h1 `Five swatches. Lock what holds.`, `Shuffle` / `Undo` / `Redo` / roles / `Contrast` / `Brand Style Standard` / `Specimen`).
3. Drive (Playwright, viewport 1280×800, fresh context):
   - Starter hexes `#f3efe6` `#161513` `#3f5850` `#e4ddd0` `#8a6a4a`; Undo disabled.
   - Click **Shuffle** (exact name). Hexes became `#f3f2ef` `#23211d` `#3a655f` `#e0ded7` `#897f53`; textures Speckle / Laid paper / Grain / Weave / Mesh; Undo enabled.
   - **Undo** restored starter hexes; Redo enabled.
   - **Redo** restored the shuffled hexes.
   - **Shuffle options → Reset starter** restored starter hexes and harmony **Editorial**.
4. Cleanup killed the recorded PID tree. `http://127.0.0.1:8080/` stopped answering. Evidence files were still on disk.

## Evidence path

`artifacts/verify-atelier/ingot-12-shuffle-20260906T001255Z/`

| File | Role |
| --- | --- |
| `doctor.json` / `doctor.png` / `doctor.aria.yml` | Identity check |
| `01-before-shuffle.png` + `.aria.yml` | Starter kit |
| `02-after-shuffle.png` + `.aria.yml` | Result of Shuffle |
| `03-after-undo.png` + `.aria.yml` | Undo restored starter |
| `04-after-redo.png` + `.aria.yml` | Redo restored shuffle |
| `05-after-reset.png` + `.aria.yml` | Reset starter |
| `atelier-palette.after-shuffle.json` | `localStorage` key `atelier-palette` |
| `proof.md` / `drive-shuffle.json` | Machine-readable pass |
| `launch.pid` / `launch.json` / `dev.log` | Instance this run started |

## Re-run

```bash
export RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
.cursor/skills/verify-atelier/scripts/launch.sh
node .cursor/skills/verify-atelier/scripts/doctor.mjs
node .cursor/skills/verify-atelier/scripts/drive-shuffle-palette.mjs
.cursor/skills/verify-atelier/scripts/cleanup.sh
ls "artifacts/verify-atelier/$RUN_ID/proof.md"
```

Other mapped features (`lock-swatches`, `copy-color-values`, `export-brand-standard`, `contrast-check`) have recipes in `features/` and were not driven in this pass.
