import { Download, FileCode2, FileJson, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyText, pulseHaptic } from "@/lib/clipboard";
import {
  downloadText,
  slugify,
  toBrandBookHtml,
  toCssVariables,
  toJson,
  toMarkdown,
  toSvgStrip,
  toTailwindTheme,
  type BrandKit,
} from "@/lib/export-brand";
import type { Harmony, Swatch } from "@/lib/harmonies";

interface ExportDockProps {
  brandName: string;
  harmony: Harmony;
  swatches: Swatch[];
  onBrandName: (name: string) => void;
}

function kitFrom(props: ExportDockProps): BrandKit {
  return {
    name: props.brandName.trim() || "Untitled brand",
    harmony: props.harmony,
    swatches: props.swatches,
    created: new Date().toISOString().slice(0, 10),
  };
}

export function ExportDock({ brandName, harmony, swatches, onBrandName }: ExportDockProps) {
  function kit() {
    return kitFrom({ brandName, harmony, swatches, onBrandName });
  }

  function copyCss() {
    pulseHaptic();
    void copyText(toCssVariables(kit())).then(() => {
      toast.success("Copied CSS tokens", { id: "atelier-copy", duration: 900 });
    });
  }

  function copyTailwind() {
    pulseHaptic();
    void copyText(toTailwindTheme(kit())).then(() => {
      toast.success("Copied Tailwind theme", { id: "atelier-copy", duration: 900 });
    });
  }

  function copyJson() {
    pulseHaptic();
    void copyText(toJson(kit())).then(() => {
      toast.success("Copied JSON standard", { id: "atelier-copy", duration: 900 });
    });
  }

  function downloadStandard() {
    const current = kit();
    const slug = slugify(current.name);
    downloadText(`${slug}-brand-standard.html`, toBrandBookHtml(current), "text/html;charset=utf-8");
    downloadText(`${slug}-tokens.css`, toCssVariables(current), "text/css;charset=utf-8");
    downloadText(`${slug}-tokens.json`, toJson(current), "application/json;charset=utf-8");
    downloadText(`${slug}-brand.md`, toMarkdown(current), "text/markdown;charset=utf-8");
    downloadText(`${slug}-swatches.svg`, toSvgStrip(current), "image/svg+xml;charset=utf-8");
    toast.success("Brand standard downloaded", {
      id: "atelier-copy",
      duration: 1400,
      description: "HTML book, CSS, JSON, Markdown, SVG",
    });
  }

  return (
    <section className="rounded-3xl bg-card p-5 sm:p-6">
      <header className="mb-5">
        <h2 className="font-display text-xl tracking-tight text-foreground">
          Brand Style Standard
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
          Export the canonical kit for every new app and document — tokens,
          contrast rules, and a printable brand book.
        </p>
      </header>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-2xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Brand name
        </span>
        <Input
          aria-label="Brand name"
          value={brandName}
          onChange={(e) => onBrandName(e.target.value)}
          className="h-11 rounded-xl bg-background"
        />
      </label>
      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" className="h-12 justify-between rounded-2xl" onClick={downloadStandard}>
          <span className="inline-flex items-center gap-2">
            <Download className="size-4" />
            Download brand standard
          </span>
          <span className="text-xs font-normal opacity-70">HTML · CSS · JSON · MD · SVG</span>
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={copyCss}>
            <FileCode2 />
            CSS
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={copyTailwind}>
            <FileCode2 />
            Tailwind
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={copyJson}>
            <FileJson />
            JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => {
              const current = kit();
              downloadText(
                `${slugify(current.name)}-swatches.svg`,
                toSvgStrip(current),
                "image/svg+xml;charset=utf-8",
              );
              toast.success("Downloaded SVG strip", { id: "atelier-copy", duration: 900 });
            }}
          >
            <Image />
            SVG
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start rounded-xl px-3 text-muted-foreground"
          onClick={() => {
            pulseHaptic();
            void copyText(toMarkdown(kit())).then(() => {
              toast.success("Copied Markdown standard", { id: "atelier-copy", duration: 900 });
            });
          }}
        >
          <FileText />
          Copy Markdown brand guide
        </Button>
      </div>
    </section>
  );
}