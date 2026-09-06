# Contrast check

The Contrast panel lists each swatch against White, Black, Ink, and Paper with a numeric ratio, a WCAG grade, and Body/Large pass-fail.

## Sub-features

- `contrast-table` renders heading `Contrast` and columns `Swatch`, `White`, `Black`, `Ink`, `Paper`.
- `contrast-rows` has one row per role: Paper, Ink, Accent, Surface, Mark.
- `contrast-grades` shows `AAA`, `AA`, `AA Large`, or `Fail` plus `Body pass`/`Body fail` and `Large pass`/`Large fail`.
- `contrast-follows-palette` updates ratios when a swatch hex changes (Shuffle or pick-color).

## How to get to it (user POV)

- Scroll to the `Contrast` heading on `/` (below Specimen and Brand Style Standard).
- Change a swatch (Shuffle or pick-color) and read the table again.

## Driving it with Playwright

Preconditions:

- Atelier is healthy at `http://127.0.0.1:8080/` and doctor passed.
- Starter palette is showing unless proving `contrast-follows-palette`.
- Viewport is `1280x800`.

- **Find the table.** Scroll the Contrast heading into view. Run `page.getByRole('heading', { name: 'Contrast' }).scrollIntoViewIfNeeded()`. Visible text includes `WCAG 2.2` and `Body 4.5:1 · Large 3:1 · AAA 7:1`.
- **Column headers.** The table header cells include `Swatch`, `White`, `Black`, `Ink`, `Paper`. Run `page.getByRole('columnheader', { name: 'White' })` (and the others). Each of White/Black/Ink/Paper is present.
- **Row headers.** Run `page.getByRole('rowheader', { name: 'Paper' })` and the same for Ink, Accent, Surface, Mark.
- **Starter Ink-on-Paper is body-passing.** In the Paper row, the Ink column (or the Ink row, Paper column — both pairs use the same two hexes) shows a ratio ≥ `4.5` and `Body pass`. On the starter kit Ink `#161513` vs Paper `#f3efe6` is well above 7:1 (`AAA`).
- **Grades exist.** At least one `AAA` or `AA` badge is visible on starter. Failures are labeled `Fail`, not omitted.
- **Follows shuffle.** Record the Paper-row White-column ratio text. Choose `Shuffle`. Run `page.getByRole('button', { name: 'Shuffle', exact: true }).click()`. Re-read that cell; it changes when Paper's hex changes. If Paper was color-locked, unlock it first.
- **Proof.** Full-page screenshot including the Contrast heading and the five role rows, plus an ARIA snapshot. Path: `artifacts/verify-atelier/$RUN_ID/contrast.png`.

## Gotchas

- The table is wide (`min-w-xl`) and horizontally scrollable. Full-page screenshots still include it; clipped viewport screenshots at 1280px may crop the Paper column — scroll the table or use `fullPage: true`.
- Ratio text is `toFixed(2)` (for example `14.12`), not a raw fraction. Assert with a numeric parse, not an exact starter string, if proving `contrast-follows-palette`.
- Ink and Paper columns use the live palette hexes, not `#ffffff`/`#000000`. After Shuffle those two columns change even when comparing a locked swatch.
- Badge `AA Large` means large-text only (ratio ≥ 3 and < 4.5). That is not a body pass.
