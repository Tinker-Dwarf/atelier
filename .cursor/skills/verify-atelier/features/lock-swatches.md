# Lock swatches

Each of the five roles can lock or unlock its color and its texture independently, pick a new hex, and choose a texture from a named menu. Locked channels stay put when Shuffle runs.

## Sub-features

- `lock-color` toggles a role's color lock (`Lock Paper color` ↔ `Unlock Paper color`, `aria-pressed`).
- `lock-texture` toggles a role's texture lock (`Lock Paper texture` ↔ `Unlock Paper texture`).
- `lock-survives-shuffle` keeps a locked Paper hex (or texture) unchanged across Shuffle.
- `lock-pick-color` sets a role hex from `Pick <role> color`.
- `lock-texture-menu` sets a role texture from the swatch's texture dropdown.

## How to get to it (user POV)

- On a swatch card, choose the lock control at the top-right to lock color, or the lock next to the texture name to lock texture.
- Choose the pipette control (`Pick Paper color` and the other roles) and commit a hex.
- Choose the texture name on the card (starter Paper is `Laid paper`) and pick another texture such as `Grain`.

## Driving it with Playwright

Preconditions:

- Atelier is healthy at `http://127.0.0.1:8080/` and doctor passed.
- Starter palette is showing (`Copy Hex #f3efe6`).
- Viewport is `1280x800`.

- **Lock Paper color.** Choose `Lock Paper color`. Run `page.getByRole('button', { name: 'Lock Paper color' }).click()`. The same control's accessible name is `Unlock Paper color` and `aria-pressed` is `true`.
- **Shuffle around the lock.** Choose `Shuffle`. Run `page.getByRole('button', { name: 'Shuffle', exact: true }).click()`. `Copy Hex #f3efe6` remains. At least one of Ink/Accent/Surface/Mark hex names changes.
- **Unlock Paper color.** Choose `Unlock Paper color`. Run `page.getByRole('button', { name: 'Unlock Paper color' }).click()`. Name returns to `Lock Paper color` and `aria-pressed` is `false`.
- **Lock Paper texture.** Note Paper's texture trigger name (`Laid paper` on starter). Choose `Lock Paper texture`. Run `page.getByRole('button', { name: 'Lock Paper texture' }).click()`. Choose `Shuffle options` → `Textures only`. Paper's texture trigger name is unchanged.
- **Pick color.** Set Paper via the color input. Run `page.getByLabel('Pick Paper color').fill('#cc3333')` (if fill is ignored, set `.value` and dispatch `input`+`change`). `Copy Hex #cc3333` appears. This **does** push undo history.
- **Texture menu.** On the Paper article choose `Laid paper` (or the current texture name), then `Grain`. Run `page.locator('article').filter({ hasText: 'Page and canvas' }).getByRole('button', { name: 'Laid paper' }).click()` and `page.getByRole('menuitem', { name: 'Grain' }).click()`. Paper's texture trigger reads `Grain`.
- **Other roles.** Repeat lock-color once each for `Lock Ink color`, `Lock Accent color`, `Lock Surface color`, `Lock Mark color` so every role's control exists.
- **Proof.** After locking Paper color and shuffling, capture the page. The ARIA snapshot still has `Copy Hex #f3efe6` and `Unlock Paper color`. Screenshot path: `artifacts/verify-atelier/$RUN_ID/lock-after-shuffle.png`.

## Gotchas

- Color lock and texture lock are independent. Proving one does not prove the other.
- Lock toggles do not enable Undo. Shuffle and pick-color do. Do not use Undo as proof that a lock happened.
- After Shuffle, two swatches may share a texture name. Scope texture clicks to the article that contains the role hint (`Page and canvas` for Paper, `Body text` for Ink, `Primary action` for Accent, `Raised panels` for Surface, `Highlight and rules` for Mark).
- Native `input type=color` often ignores keyboard `fill` in headless Chromium. Dispatch `input` and `change` if the hex chip does not update.
- `sr-only` text `Swatch 1`…`Swatch 5` matches role order Paper…Mark if the article filter is ambiguous.
