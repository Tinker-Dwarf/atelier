import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { copyText, pulseHaptic } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface CopyChipProps {
  label: string;
  value: string;
  display?: string;
  ink: string;
}

export function CopyChip({ label, value, display, ink }: CopyChipProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  function handleCopy() {
    window.clearTimeout(timer.current);
    setCopied(true);
    pulseHaptic(10);
    toast.success(`Copied ${label}`, {
      id: "atelier-copy",
      duration: 900,
      description: value,
    });
    timer.current = window.setTimeout(() => setCopied(false), 1100);
    void copyText(value);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label} ${value}`}
      className={cn(
        "group flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-[background-color,transform] duration-[var(--motion-micro)] ease-[var(--ease-out)]",
        "hover:bg-black/8 active:scale-[0.98]",
      )}
      style={{ color: ink }}
    >
      <span className="w-9 shrink-0 text-micro font-medium tracking-[0.14em] uppercase opacity-70">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-sm tabular-nums">
        {display ?? value}
      </span>
      <span className="relative size-4 shrink-0 opacity-70">
        <Copy
          className={cn(
            "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-200 ease-[var(--ease-out)]",
            copied ? "scale-25 opacity-0 blur-xs" : "scale-100 opacity-100 blur-none",
          )}
        />
        <Check
          className={cn(
            "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-200 ease-[var(--ease-out)]",
            copied ? "scale-100 opacity-100 blur-none" : "scale-25 opacity-0 blur-xs",
          )}
        />
      </span>
    </button>
  );
}
