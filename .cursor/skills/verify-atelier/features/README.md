# Atelier verification map

This directory is the maintained source for verifying the user-facing behavior of Atelier. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch Atelier with `.cursor/skills/verify-atelier/scripts/launch.sh` so this run owns `http://127.0.0.1:8080`.
- Set `RUN_ID` and write evidence under `artifacts/verify-atelier/$RUN_ID/`.
- Run `node .cursor/skills/verify-atelier/scripts/doctor.mjs` and require HTTP 200, a live launch PID, and Atelier identity (`Atelier`, `Brand style studio`, heading `Five swatches. Lock what holds.`).
- Drive Playwright at viewport `1280x800` in a **new browser context** (empty `localStorage`). Wait for `Copy Hex #f3efe6` before treating the palette as starter.
- Never drive an instance that was not started by this verification run.
- Do not open a second Vite on 8080 (`strictPort`).

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise. `Reset starter` (Shuffle options) restores the five default swatches and `Editorial` harmony; it does not clear brand name or live-theme.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- The header kicker `Brand style studio` is CSS-uppercased. Use `/brand style studio/i`, not `{ exact: true }`, so a late stylesheet does not drop the match.
- `getByRole('button', { name: 'Shuffle' })` also matches `Shuffle options`. Pass `{ exact: true }`.
- Treat every command as literal. Keep quoted names unchanged.
- Run browser actions through Playwright against `http://127.0.0.1:8080/`.
- Restore starter swatches after a mutation if another feature will run in the same context. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot (`page.locator('body').ariaSnapshot()`) and a screenshot with Atelier identity visible.
- Mutation proof includes a second observation: Undo, a copied clipboard, a downloaded file, or `localStorage` key `atelier-palette`.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with Playwright` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Shuffle palette](./shuffle-palette.md) covers Shuffle, Space, colors-only, textures-only, Reset starter, Undo, and Redo.
- [Lock swatches](./lock-swatches.md) covers independent color and texture locks, the color picker, and the texture menu on Paper/Ink/Accent/Surface/Mark.
- [Copy color values](./copy-color-values.md) covers Hex/RGB/HSL copy chips and their toasts.
- [Export brand standard](./export-brand-standard.md) covers brand name, the five-file download, copy CSS/Tailwind/JSON/Markdown, and SVG download.
- [Contrast check](./contrast-check.md) covers the WCAG table of each swatch against White, Black, Ink, and Paper.
