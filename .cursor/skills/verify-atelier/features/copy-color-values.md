# Copy color values

Each swatch exposes Hex, RGB, and HSL copy chips. Choosing a chip copies that string and shows a short success toast.

## Sub-features

- `copy-hex` copies the hex string (starter Paper `#f3efe6`).
- `copy-rgb` copies `rgb(r, g, b)` (starter Paper `rgb(243, 239, 230)`).
- `copy-hsl` copies `hsl(h s% l%)` (starter Paper `hsl(42 35% 93%)`).
- `copy-toast` shows `Copied Hex` / `Copied RGB` / `Copied HSL` with the value as description.

## How to get to it (user POV)

- On any swatch card, choose the row labeled `Hex`, `RGB`, or `HSL`.
- The accessible name of each control is `Copy <label> <value>` and updates when the swatch hex changes.

## Driving it with Playwright

Preconditions:

- Atelier is healthy at `http://127.0.0.1:8080/` and doctor passed.
- Starter palette is showing.
- The Playwright context granted `clipboard-read` and `clipboard-write` for `http://127.0.0.1:8080`.
- Viewport is `1280x800`.

- **Grant clipboard.** Before navigation or immediately after. Run `context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:8080' })`.
- **Copy Hex.** Choose Paper's hex chip. Run `page.getByRole('button', { name: 'Copy Hex #f3efe6' }).click()`. A toast containing `Copied Hex` appears. `navigator.clipboard.readText()` is `#f3efe6`.
- **Copy RGB.** Choose Paper's RGB chip. Run `page.getByRole('button', { name: 'Copy RGB rgb(243, 239, 230)' }).click()`. Toast `Copied RGB`. Clipboard is `rgb(243, 239, 230)`.
- **Copy HSL.** Choose Paper's HSL chip. Run `page.getByRole('button', { name: 'Copy HSL hsl(42 35% 93%)' }).click()`. Toast `Copied HSL`. Clipboard is `hsl(42 35% 93%)`.
- **Other roles.** Copy Ink hex `Copy Hex #161513` once so a second swatch is covered.
- **Proof.** Screenshot as soon as the toast is visible (`Copied Hex` is enough). Toast duration is 900ms and later copies reuse toast id `atelier-copy`, so they replace the previous toast. Save clipboard text to `artifacts/verify-atelier/$RUN_ID/copy-clipboard.txt` and an ARIA snapshot while the toast is up if possible.

## Gotchas

- Do not assert on the visual checkmark alone; the clipboard string is the side effect.
- Headless Chromium without clipboard permission returns empty or throws. Grant the origin explicitly.
- After Shuffle the accessible names change with the hex. Re-read `Copy Hex …` names instead of hard-coding starter values unless you just reset.
- Toasts sit at the bottom center with class `atelier-toast`. Query text `Copied Hex`, not a CSS class.
