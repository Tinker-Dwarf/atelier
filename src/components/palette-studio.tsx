import { useEffect } from "react";
import {
  ChevronDown,
  Dices,
  Palette,
  Redo2,
  RotateCcw,
  SwatchBook,
  Undo2,
} from "lucide-react";
import { Toaster } from "sonner";
import { ContrastPanel } from "@/components/contrast-panel";
import { ExportDock } from "@/components/export-dock";
import { Specimen } from "@/components/specimen";
import { SwatchCard } from "@/components/swatch-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HARMONIES, HARMONY_LABELS } from "@/lib/harmonies";
import { usePaletteStore } from "@/lib/palette-store";
import { cn } from "@/lib/utils";

const TOKEN_MAP = [
  ["--live-paper", 0],
  ["--live-ink", 1],
  ["--live-accent", 2],
  ["--live-surface", 3],
  ["--live-mark", 4],
] as const;

export function PaletteStudio() {
  const brandName = usePaletteStore((s) => s.brandName);
  const harmony = usePaletteStore((s) => s.harmony);
  const swatches = usePaletteStore((s) => s.swatches);
  const liveTheme = usePaletteStore((s) => s.liveTheme);
  const past = usePaletteStore((s) => s.past);
  const future = usePaletteStore((s) => s.future);
  const setBrandName = usePaletteStore((s) => s.setBrandName);
  const setHarmony = usePaletteStore((s) => s.setHarmony);
  const setLiveTheme = usePaletteStore((s) => s.setLiveTheme);
  const setHex = usePaletteStore((s) => s.setHex);
  const setTexture = usePaletteStore((s) => s.setTexture);
  const toggleColorLock = usePaletteStore((s) => s.toggleColorLock);
  const toggleTextureLock = usePaletteStore((s) => s.toggleTextureLock);
  const shuffle = usePaletteStore((s) => s.shuffle);
  const undo = usePaletteStore((s) => s.undo);
  const redo = usePaletteStore((s) => s.redo);
  const reset = usePaletteStore((s) => s.reset);

  useEffect(() => {
    void usePaletteStore.persist.rehydrate();
    usePaletteStore.getState().markHydrated();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!liveTheme) {
      root.removeAttribute("data-live-brand");
      for (const [token] of TOKEN_MAP) root.style.removeProperty(token);
      return;
    }
    root.setAttribute("data-live-brand", "");
    for (const [token, index] of TOKEN_MAP) {
      const hex = swatches[index]?.hex;
      if (hex) root.style.setProperty(token, hex);
    }
  }, [liveTheme, swatches]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (typing) return;
      if (event.code === "Space") {
        event.preventDefault();
        shuffle(event.shiftKey ? "textures" : "all");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, shuffle, undo]);

  return (
    <TooltipProvider>
      <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
        <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 sm:py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl leading-none tracking-tight">Atelier</p>
                <p className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                  Brand style studio
                </p>
              </div>
              <div className="flex items-center lg:hidden">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 rounded-l-full rounded-r-none pr-3"
                  onClick={() => shuffle("all")}
                >
                  <Dices />
                  Shuffle
                </Button>
                <ShuffleMenu
                  className="h-11 w-10 rounded-l-none rounded-r-full border-l border-primary-foreground/15"
                  shuffle={shuffle}
                  reset={reset}
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 rounded-full">
                    <Palette />
                    {HARMONY_LABELS[harmony]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Harmony</DropdownMenuLabel>
                  {HARMONIES.map((id) => (
                    <DropdownMenuItem
                      key={id}
                      onSelect={() => setHarmony(id)}
                      className={cn(id === harmony && "bg-foreground/6")}
                    >
                      {HARMONY_LABELS[id]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 rounded-full"
                aria-label="Undo"
                disabled={past.length === 0}
                onClick={undo}
              >
                <Undo2 />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 rounded-full"
                aria-label="Redo"
                disabled={future.length === 0}
                onClick={redo}
              >
                <Redo2 />
              </Button>
              <div className="hidden items-center lg:flex">
                <Button
                  type="button"
                  className="h-11 rounded-l-full rounded-r-none pr-3"
                  onClick={() => shuffle("all")}
                >
                  <Dices />
                  Shuffle
                </Button>
                <ShuffleMenu
                  className="h-11 w-10 rounded-l-none rounded-r-full border-l border-primary-foreground/15"
                  shuffle={shuffle}
                  reset={reset}
                />
              </div>
              <Button
                type="button"
                variant={liveTheme ? "default" : "outline"}
                className="h-11 rounded-full"
                aria-pressed={liveTheme}
                onClick={() => setLiveTheme(!liveTheme)}
              >
                <SwatchBook />
                <span className="hidden sm:inline">
                  {liveTheme ? "Studio uses kit" : "Preview on studio"}
                </span>
                <span className="sm:hidden">{liveTheme ? "On kit" : "Preview"}</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl tracking-tight text-balance sm:text-3xl lg:text-4xl">
                  Five swatches. Lock what holds.
                </h1>
                <p className="mt-2 hidden max-w-xl text-sm text-muted-foreground text-pretty sm:block">
                  Click any Hex, RGB, or HSL value to copy. Space shuffles
                  unlocked color and texture. Shift-Space shuffles texture only.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {swatches.map((swatch, index) => (
                <SwatchCard
                  key={swatch.role}
                  swatch={swatch}
                  index={index}
                  onHex={(hex) => setHex(index, hex)}
                  onTexture={(texture) => setTexture(index, texture)}
                  onToggleColorLock={() => toggleColorLock(index)}
                  onToggleTextureLock={() => toggleTextureLock(index)}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Specimen brandName={brandName} swatches={swatches} />
            <ExportDock
              brandName={brandName}
              harmony={harmony}
              swatches={swatches}
              onBrandName={setBrandName}
            />
          </div>

          <ContrastPanel swatches={swatches} />
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
          Lock a color or a texture independently. Export is the brand style
          standard for new apps and documents.
        </footer>
        <Toaster
          position="bottom-center"
          theme="dark"
          offset={24}
          toastOptions={{
            className: "atelier-toast",
            duration: 900,
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function ShuffleMenu({
  className,
  shuffle,
  reset,
}: {
  className?: string;
  shuffle: (target?: "all" | "colors" | "textures") => void;
  reset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" className={className} aria-label="Shuffle options">
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => shuffle("all")}>Shuffle unlocked</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => shuffle("colors")}>Colors only</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => shuffle("textures")}>Textures only</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={reset}>
          <RotateCcw />
          Reset starter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
