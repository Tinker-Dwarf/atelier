# Export brand standard

Export names the kit, downloads the five-file Brand Style Standard, copies CSS / Tailwind / JSON / Markdown to the clipboard, and downloads an SVG strip on its own.

## Sub-features

- `export-brand-name` edits the `Brand name` field (default `Atelier`, max 48 characters persisted).
- `export-download-kit` downloads HTML, CSS, JSON, Markdown, and SVG together and toasts `Brand standard downloaded`.
- `export-copy-css` copies CSS tokens and toasts `Copied CSS tokens`.
- `export-copy-tailwind` copies a `@theme` block and toasts `Copied Tailwind theme`.
- `export-copy-json` copies JSON with `"kind": "atelier.brand-standard"` and toasts `Copied JSON standard`.
- `export-copy-markdown` copies the Markdown guide via `Copy Markdown brand guide` and toasts `Copied Markdown standard`.
- `export-svg` downloads `<slug>-swatches.svg` and toasts `Downloaded SVG strip`.

## How to get to it (user POV)

- Scroll to the `Brand Style Standard` heading on `/`.
- Type a brand name in `Brand name`.
- Choose `Download brand standard` (subtitle HTML · CSS · JSON · MD · SVG).
- Choose `CSS`, `Tailwind`, `JSON`, `SVG`, or `Copy Markdown brand guide`.

## Driving it with Playwright

Preconditions:

- Atelier is healthy at `http://127.0.0.1:8080/` and doctor passed.
- Starter palette is showing unless the recipe is proving export of a shuffled kit.
- Clipboard permission granted for copy sub-features.
- Viewport is `1280x800`. Collect downloads on the page before clicking.

- **Name the kit.** Replace brand name with `Verify Kit`. Run `page.getByLabel('Brand name').fill('Verify Kit')`. The Specimen heading reads `Verify Kit`.
- **Arm downloads.** Before the click, collect `page.on('download')` into an array (the kit click fires five).
- **Download brand standard.** Choose `Download brand standard`. Run `page.getByRole('button', { name: 'Download brand standard' }).click()` (accessible name also includes `HTML · CSS · JSON · MD · SVG`). Toast `Brand standard downloaded` with description `HTML book, CSS, JSON, Markdown, SVG`. Five suggested filenames:
  - `verify-kit-brand-standard.html`
  - `verify-kit-tokens.css`
  - `verify-kit-tokens.json`
  - `verify-kit-brand.md`
  - `verify-kit-swatches.svg`
  Save them under `artifacts/verify-atelier/$RUN_ID/downloads/`. The HTML contains `Verify Kit` and `Brand Style Standard`. The JSON contains `"kind": "atelier.brand-standard"`. The CSS starts with `:root {`.
- **Copy CSS.** Choose `CSS`. Run `page.getByRole('button', { name: 'CSS' }).click()`. Toast `Copied CSS tokens`. Clipboard includes `--color-paper:` and `--brand-name: "Verify Kit"`.
- **Copy Tailwind.** Choose `Tailwind`. Run `page.getByRole('button', { name: 'Tailwind' }).click()`. Toast `Copied Tailwind theme`. Clipboard starts with `@theme {`.
- **Copy JSON.** Choose `JSON`. Run `page.getByRole('button', { name: 'JSON' }).click()`. Toast `Copied JSON standard`. Clipboard parses as JSON with five `colors` entries.
- **Copy Markdown.** Choose `Copy Markdown brand guide`. Run `page.getByRole('button', { name: 'Copy Markdown brand guide' }).click()`. Toast `Copied Markdown standard`. Clipboard starts with `# Verify Kit — Brand Style Standard`.
- **SVG only.** Choose `SVG`. Run `page.getByRole('button', { name: 'SVG' }).click()`. One download `verify-kit-swatches.svg` and toast `Downloaded SVG strip`.
- **Empty name fallback.** Clear Brand name and download. Run `page.getByLabel('Brand name').fill('')` then download. Filenames use slug `untitled-brand` (export treats a blank name as `Untitled brand`).
- **Proof.** Keep the five kit files plus a screenshot of `Brand Style Standard` with toast `Brand standard downloaded` when possible. List the download filenames in `proof.md`.

## Gotchas

- Default brand `Atelier` slugs to `atelier-…` filenames. Always set a distinctive name (`Verify Kit`) so leftover downloads from a previous run cannot be mistaken for this one.
- Five `<a download>` clicks fire in one handler. Wait for five `download` events, not one.
- Export toast lasts 1400ms; copy toasts last 900ms. Same toast id, so a later copy wipes the download toast.
- Blank brand name still shows an empty input; only the exported kit substitutes `Untitled brand`.
- `Reset starter` does not restore brand name. Fill `Atelier` if the next feature assumes the default.
- Specimen's `h2` is the brand name, not the word `Specimen`.
