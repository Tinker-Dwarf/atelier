# Shuffle palette

Shuffle replaces unlocked swatch colors and/or textures, Reset starter restores the default five-swatch kit, and Undo/Redo walk the in-session history of those mutations.

## Sub-features

- `shuffle-all` shuffles unlocked color and texture from the Shuffle button.
- `shuffle-space` shuffles unlocked color and texture from Space when focus is not in an input.
- `shuffle-colors-only` changes hex values and leaves texture labels in place.
- `shuffle-textures-only` changes texture labels and leaves hex values in place (Shift+Space or the menu).
- `shuffle-reset` restores Paper `#f3efe6`, Ink `#161513`, Accent `#3f5850`, Surface `#e4ddd0`, Mark `#8a6a4a`, and harmony `Editorial`.
- `shuffle-undo-redo` restores the pre-shuffle swatches, then re-applies them.

## How to get to it (user POV)

- Choose `Shuffle` in the header.
- Choose `Shuffle options` and then `Shuffle unlocked`, `Colors only`, `Textures only`, or `Reset starter`.
- Press `Space` (all) or `Shift+Space` (textures only) while not typing in Brand name or a color input.
- Choose `Undo` or `Redo`, or press `Control+z` / `Control+Shift+z`.

## Driving it with Playwright

Preconditions:

- Atelier is healthy at `http://127.0.0.1:8080/` and doctor passed.
- Playwright context is fresh (or `Reset starter` has been chosen) and `Copy Hex #f3efe6` is visible.
- Viewport is `1280x800`.
- Undo is disabled (empty history after a fresh load).

- **Read starter hexes.** Note the five `Copy Hex …` names. Run `page.getByRole('button', { name: /^Copy Hex / })`. They are `#f3efe6`, `#161513`, `#3f5850`, `#e4ddd0`, `#8a6a4a`.
- **Shuffle unlocked.** Choose `Shuffle`. Run `page.getByRole('button', { name: 'Shuffle', exact: true }).click()`. At least one `Copy Hex …` name changes. `Undo` becomes enabled.
- **Undo.** Choose `Undo`. Run `page.getByRole('button', { name: 'Undo' }).click()`. The five hex names match the starter set. `Redo` is enabled.
- **Redo.** Choose `Redo`. Run `page.getByRole('button', { name: 'Redo' }).click()`. The five hex names match the shuffled set.
- **Colors only.** Choose `Shuffle options`, then `Colors only`. Run `page.getByRole('button', { name: 'Shuffle options' }).click()` and `page.getByRole('menuitem', { name: 'Colors only' }).click()`. Hex names change; the five texture trigger labels stay as they were immediately before this click.
- **Textures only.** Choose `Shuffle options`, then `Textures only`. Run `page.getByRole('button', { name: 'Shuffle options' }).click()` and `page.getByRole('menuitem', { name: 'Textures only' }).click()`. Texture labels change; hex names stay.
- **Keyboard Space.** Click the hero heading to move focus out of controls, then press Space. Run `page.getByRole('heading', { name: 'Five swatches. Lock what holds.' }).click()` and `page.keyboard.press('Space')`. Hex and/or texture values of unlocked swatches change.
- **Reset starter.** Choose `Shuffle options`, then `Reset starter`. Run `page.getByRole('button', { name: 'Shuffle options' }).click()` and `page.getByRole('menuitem', { name: 'Reset starter' }).click()`. `Copy Hex #f3efe6` is visible again and the harmony button name is `Editorial`.
- **Proof.** After Shuffle (before Undo) capture the mutated palette. Run `page.screenshot({ path: 'artifacts/verify-atelier/' + RUN_ID + '/shuffle-after.png', fullPage: true })` and `page.locator('body').ariaSnapshot()` to `shuffle-after.aria.yml`. The screenshot shows `Atelier` and at least one hex other than `#f3efe6`. Also dump `localStorage.atelier-palette`.

A packaged run of Shuffle → Undo → Redo → Reset starter:

```bash
RUN_ID=… node .cursor/skills/verify-atelier/scripts/drive-shuffle-palette.mjs
```

## Gotchas

- Two Shuffle buttons exist in the DOM (mobile `lg:hidden` vs desktop `lg:flex`). Stay at `1280x800` so Playwright's visible-role query hits the desktop control. Always pass `{ exact: true }` for the name `Shuffle` or Playwright also matches `Shuffle options`.
- Space while Brand name or a color `<input>` is focused types a space / does nothing instead of shuffling.
- History is not persisted. Reload clears Undo/Redo even though swatches remain in `atelier-palette`.
- Lock is not pushed onto the undo stack, but Undo replaces the whole swatch snapshot, so a lock made after a shuffle is lost on Undo.
- Shuffle of a fully color-locked palette still runs and still pushes history; hexes will not change. Unlock at least one color before proving `shuffle-all`.
- `Reset starter` does not reset brand name or `Preview on studio` / `Studio uses kit`.
- Toasts are not used for shuffle. Absence of a toast is not a failure.
