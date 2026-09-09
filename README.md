# Atelier

Five-swatch brand style studio. Lock color or texture independently, shuffle the rest, copy Hex / RGB / HSL, check WCAG contrast, and export a Brand Style Standard for new apps and documents.

## Roles

| Role | Use |
| --- | --- |
| Paper | Page and canvas |
| Ink | Body text |
| Accent | Primary action |
| Surface | Raised panels |
| Mark | Highlight and rules |

## Run

```bash
npm install
npm run dev
```

## Stack

React 19, TanStack Start, Tailwind v4, Zustand.

Palettes persist in the browser. Export writes an HTML brand book plus CSS tokens, JSON, Markdown, and an SVG strip.

## Parametric machine studies (INGOT-38)

- Route: `/studies/case-ih-695` — Case IH 695 first slice (rigid, hitch Type II, empty `implements[]`).
- Registry: `src/studies/machines/` — `case-ih-695.ts` builds mesh; `jd-8970.ts` is an **articulated stub** (`buildMesh: false`, hinge API reserved). No JD geometry yet.
- Doctrine: `parametric-three-study` — dims/profiles/parts → lathe/extrude/box; no GLTF.
- Tire OD dims are marked `unverified` until Hermes catalogs them on the ticket.
