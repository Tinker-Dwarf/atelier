import type { CSSProperties } from "react";

export const TEXTURE_IDS = [
  "solid",
  "grain",
  "linen",
  "laid",
  "speckle",
  "hatch",
  "grid",
  "dots",
  "stripe",
  "weave",
  "stipple",
  "mesh",
] as const;

export type TextureId = (typeof TEXTURE_IDS)[number];

export const TEXTURE_LABELS: Record<TextureId, string> = {
  solid: "Solid",
  grain: "Grain",
  linen: "Linen",
  laid: "Laid paper",
  speckle: "Speckle",
  hatch: "Hatch",
  grid: "Grid",
  dots: "Dots",
  stripe: "Stripe",
  weave: "Weave",
  stipple: "Stipple",
  mesh: "Mesh",
};

function svgData(markup: string): string {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(markup)}")`;
}

function grainSvg(opacity = 0.42): string {
  return svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" opacity="${opacity}"/>
    </svg>`,
  );
}

function speckleSvg(): string {
  const dots = Array.from({ length: 70 }, (_, i) => {
    const x = ((i * 47) % 160) + (i % 5);
    const y = ((i * 97) % 160) + ((i * 3) % 7);
    const r = 0.4 + (i % 4) * 0.35;
    const o = 0.18 + (i % 5) * 0.05;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="black" opacity="${o}"/>`;
  }).join("");
  return svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">${dots}</svg>`,
  );
}

function stippleSvg(): string {
  const dots = Array.from({ length: 140 }, (_, i) => {
    const x = (i * 13) % 160;
    const y = (i * 29) % 160;
    return `<circle cx="${x}" cy="${y}" r="0.7" fill="black" opacity="0.28"/>`;
  }).join("");
  return svgData(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">${dots}</svg>`,
  );
}

export function textureOverlay(id: TextureId): CSSProperties {
  switch (id) {
    case "solid":
      return { backgroundImage: "none" };
    case "grain":
      return {
        backgroundImage: grainSvg(),
        backgroundSize: "160px 160px",
        mixBlendMode: "soft-light",
        opacity: 0.7,
      };
    case "linen":
      return {
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent 0 2px, rgb(0 0 0 / 0.06) 2px 3px), repeating-linear-gradient(0deg, transparent 0 2px, rgb(0 0 0 / 0.045) 2px 3px)",
        mixBlendMode: "multiply",
        opacity: 0.7,
      };
    case "laid":
      return {
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0 7px, rgb(0 0 0 / 0.05) 7px 8px), repeating-linear-gradient(90deg, transparent 0 28px, rgb(0 0 0 / 0.035) 28px 29px)",
        mixBlendMode: "multiply",
        opacity: 0.75,
      };
    case "speckle":
      return {
        backgroundImage: speckleSvg(),
        backgroundSize: "160px 160px",
        mixBlendMode: "multiply",
        opacity: 0.85,
      };
    case "hatch":
      return {
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 6px, rgb(0 0 0 / 0.07) 6px 7px)",
        mixBlendMode: "multiply",
        opacity: 0.8,
      };
    case "grid":
      return {
        backgroundImage:
          "repeating-linear-gradient(0deg, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 12px)",
        mixBlendMode: "multiply",
        opacity: 0.55,
      };
    case "dots":
      return {
        backgroundImage:
          "radial-gradient(circle at 2px 2px, rgb(0 0 0 / 0.18) 1.1px, transparent 1.25px)",
        backgroundSize: "10px 10px",
        mixBlendMode: "multiply",
        opacity: 0.7,
      };
    case "stripe":
      return {
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent 0 8px, rgb(0 0 0 / 0.07) 8px 16px)",
        mixBlendMode: "multiply",
        opacity: 0.7,
      };
    case "weave":
      return {
        backgroundImage:
          "repeating-linear-gradient(90deg, rgb(0 0 0 / 0.05) 0 1px, transparent 1px 5px), repeating-linear-gradient(0deg, rgb(0 0 0 / 0.05) 0 1px, transparent 1px 5px)",
        mixBlendMode: "multiply",
        opacity: 0.75,
      };
    case "stipple":
      return {
        backgroundImage: stippleSvg(),
        backgroundSize: "160px 160px",
        mixBlendMode: "multiply",
        opacity: 0.8,
      };
    case "mesh":
      return {
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent 0 10px, rgb(0 0 0 / 0.05) 10px 11px), repeating-linear-gradient(-45deg, transparent 0 10px, rgb(0 0 0 / 0.05) 10px 11px)",
        mixBlendMode: "multiply",
        opacity: 0.7,
      };
    default:
      return {};
  }
}

export function isTextureId(value: string): value is TextureId {
  return (TEXTURE_IDS as readonly string[]).includes(value);
}
