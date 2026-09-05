import { Lock, Pipette, Unlock } from "lucide-react";
import { CopyChip } from "@/components/copy-chip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { bestNeutralText, formatHsl, formatRgb } from "@/lib/color";
import { ROLE_HINTS, type Swatch } from "@/lib/harmonies";
import { TEXTURE_IDS, TEXTURE_LABELS, textureOverlay, type TextureId } from "@/lib/textures";
import { cn } from "@/lib/utils";

interface SwatchCardProps {
  swatch: Swatch;
  index: number;
  onHex: (hex: string) => void;
  onTexture: (texture: TextureId) => void;
  onToggleColorLock: () => void;
  onToggleTextureLock: () => void;
}

export function SwatchCard({
  swatch,
  index,
  onHex,
  onTexture,
  onToggleColorLock,
  onToggleTextureLock,
}: SwatchCardProps) {
  const ink = bestNeutralText(swatch.hex);
  const overlayInk = ink === "#ffffff" ? "rgb(255 255 255 / 0.16)" : "rgb(0 0 0 / 0.1)";

  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded-3xl"
      style={{ backgroundColor: swatch.hex, color: ink }}
    >
      <div className="relative min-h-44 flex-1 sm:min-h-72">
        <div className="absolute inset-0" style={textureOverlay(swatch.texture)} />
        <div className="relative flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-2xs font-medium tracking-[0.2em] uppercase opacity-80">
                {swatch.role}
              </p>
              <p className="mt-1 text-sm opacity-70">{ROLE_HINTS[swatch.role]}</p>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full">
                    <input
                      type="color"
                      aria-label={`Pick ${swatch.role} color`}
                      value={swatch.hex}
                      onChange={(e) => onHex(e.target.value)}
                      className="absolute inset-0 size-10 cursor-pointer opacity-0"
                    />
                    <span
                      className="flex size-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: overlayInk }}
                    >
                      <Pipette className="size-4" />
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Pick color</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-pressed={swatch.colorLocked}
                    aria-label={
                      swatch.colorLocked ? `Unlock ${swatch.role} color` : `Lock ${swatch.role} color`
                    }
                    onClick={onToggleColorLock}
                    className="size-10 rounded-full hover:bg-black/10"
                    style={{ backgroundColor: overlayInk, color: ink }}
                  >
                    {swatch.colorLocked ? <Lock /> : <Unlock />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {swatch.colorLocked ? "Unlock color" : "Lock color"}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="min-h-11 rounded-full px-3 text-left text-sm font-medium"
                  style={{ backgroundColor: overlayInk }}
                >
                  {TEXTURE_LABELS[swatch.texture]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {TEXTURE_IDS.map((id) => (
                  <DropdownMenuItem
                    key={id}
                    onSelect={() => onTexture(id)}
                    className={cn(id === swatch.texture && "bg-foreground/6")}
                  >
                    {TEXTURE_LABELS[id]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-pressed={swatch.textureLocked}
                  aria-label={
                    swatch.textureLocked
                      ? `Unlock ${swatch.role} texture`
                      : `Lock ${swatch.role} texture`
                  }
                  onClick={onToggleTextureLock}
                  className="size-10 rounded-full hover:bg-black/10"
                  style={{ backgroundColor: overlayInk, color: ink }}
                >
                  {swatch.textureLocked ? <Lock /> : <Unlock />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {swatch.textureLocked ? "Unlock texture" : "Lock texture"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div
        className="space-y-0.5 border-t px-2 py-2"
        style={{ borderColor: ink === "#ffffff" ? "rgb(255 255 255 / 0.14)" : "rgb(0 0 0 / 0.1)" }}
      >
        <CopyChip label="Hex" value={swatch.hex} ink={ink} />
        <CopyChip label="RGB" value={formatRgb(swatch.hex)} ink={ink} />
        <CopyChip label="HSL" value={formatHsl(swatch.hex)} ink={ink} />
      </div>
      <span className="sr-only">Swatch {index + 1}</span>
    </article>
  );
}
