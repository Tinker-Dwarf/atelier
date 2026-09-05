import { Badge } from "@/components/ui/badge";
import {
  contrastGrade,
  contrastRatio,
  passesBody,
  passesLarge,
  type ContrastGrade,
} from "@/lib/color";
import type { Swatch } from "@/lib/harmonies";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "black", label: "Black", hex: "#000000" },
] as const;

interface ContrastPanelProps {
  swatches: Swatch[];
}

function gradeVariant(grade: ContrastGrade): "pass" | "warn" | "fail" {
  if (grade === "AAA" || grade === "AA") return "pass";
  if (grade === "AA Large") return "warn";
  return "fail";
}

export function ContrastPanel({ swatches }: ContrastPanelProps) {
  const paper = swatches[0]?.hex ?? "#f4f1ea";
  const ink = swatches[1]?.hex ?? "#161513";
  const texts = [
    ...TEXT_COLORS,
    { id: "ink", label: "Ink", hex: ink },
    { id: "paper", label: "Paper", hex: paper },
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-3xl bg-card p-5 sm:p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight text-foreground">Contrast</h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
            WCAG 2.2 against white, black, and the palette’s own Ink and Paper.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Body 4.5:1 · Large 3:1 · AAA 7:1
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
              <th className="pb-3 font-medium">Swatch</th>
              {texts.map((text) => (
                <th key={text.id} className="pb-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-3 rounded-full outline outline-1 -outline-offset-1 outline-foreground/15"
                      style={{ backgroundColor: text.hex }}
                    />
                    {text.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swatches.map((swatch) => (
              <tr key={swatch.role} className="border-t border-border">
                <th className="py-3 pr-3 font-medium text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-3.5 rounded-sm outline outline-1 -outline-offset-1 outline-foreground/15"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    {swatch.role}
                  </span>
                </th>
                {texts.map((text) => {
                  const ratio = contrastRatio(swatch.hex, text.hex);
                  const grade = contrastGrade(ratio);
                  return (
                    <td key={text.id} className="py-3 pr-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono tabular-nums text-foreground">
                          {ratio.toFixed(2)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={gradeVariant(grade)}>{grade}</Badge>
                          <span
                            className={cn(
                              "text-2xs tracking-wide uppercase",
                              passesBody(ratio) ? "text-pass" : "text-muted-foreground",
                            )}
                          >
                            Body {passesBody(ratio) ? "pass" : "fail"}
                          </span>
                          <span
                            className={cn(
                              "text-2xs tracking-wide uppercase",
                              passesLarge(ratio) ? "text-pass" : "text-muted-foreground",
                            )}
                          >
                            Large {passesLarge(ratio) ? "pass" : "fail"}
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
