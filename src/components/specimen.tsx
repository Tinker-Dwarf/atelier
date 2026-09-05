import { bestNeutralText } from "@/lib/color";
import { ROLE_HINTS, type Swatch } from "@/lib/harmonies";
import { textureOverlay } from "@/lib/textures";

interface SpecimenProps {
  brandName: string;
  swatches: Swatch[];
}

export function Specimen({ brandName, swatches }: SpecimenProps) {
  const paper = swatches[0]!;
  const ink = swatches[1]!;
  const accent = swatches[2]!;
  const surface = swatches[3]!;
  const mark = swatches[4]!;
  const accentInk = bestNeutralText(accent.hex);

  return (
    <section className="overflow-hidden rounded-3xl" style={{ backgroundColor: paper.hex, color: ink.hex }}>
      <div className="relative">
        <div className="absolute inset-0" style={textureOverlay(paper.texture)} />
        <div className="relative p-5 sm:p-7">
          <p
            className="text-2xs font-medium tracking-[0.2em] uppercase"
            style={{ color: mark.hex }}
          >
            Specimen
          </p>
          <h2
            className="font-display mt-2 max-w-xl text-3xl leading-tight tracking-tight text-balance sm:text-4xl"
            style={{ color: ink.hex }}
          >
            {brandName}
          </h2>
          <p className="mt-3 max-w-prose text-pretty opacity-80">
            Paper carries the page. Ink sets the voice. Accent is the only loud
            move — a primary action, not a wash. Surface lifts a panel. Mark
            draws the rule.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium"
              style={{ backgroundColor: accent.hex, color: accentInk }}
            >
              Primary action
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium outline outline-1 -outline-offset-1"
              style={{ color: ink.hex, outlineColor: `${ink.hex}22` }}
            >
              Ghost
            </button>
          </div>
          <div
            className="relative mt-6 rounded-2xl p-5"
            style={{ backgroundColor: surface.hex }}
          >
            <div className="absolute inset-0 rounded-2xl" style={textureOverlay(surface.texture)} />
            <div className="relative">
              <p className="text-xs tracking-[0.16em] uppercase opacity-70">Raised panel</p>
              <p className="mt-2 text-sm text-pretty">
                {ROLE_HINTS.Surface}. Keep body copy on Paper; use this step for
                cards, tables, and grouped controls.
              </p>
              <div className="mt-4 h-px" style={{ backgroundColor: mark.hex, opacity: 0.55 }} />
              <p className="mt-4 text-sm opacity-80">
                Mark rules and captions sit at reduced presence so Accent can
                stay scarce.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
