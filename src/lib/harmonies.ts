import {
  clamp,
  contrastRatio,
  ensureContrast,
  hexToHsl,
  hslToHex,
  type HSL,
  wrapHue,
} from "./color";
import { TEXTURE_IDS, type TextureId } from "./textures";

export const SWATCH_ROLES = [
  "Paper",
  "Ink",
  "Accent",
  "Surface",
  "Mark",
] as const;

export type SwatchRole = (typeof SWATCH_ROLES)[number];

export const ROLE_HINTS: Record<SwatchRole, string> = {
  Paper: "Page and canvas",
  Ink: "Body text",
  Accent: "Primary action",
  Surface: "Raised panels",
  Mark: "Highlight and rules",
};

export const HARMONIES = [
  "editorial",
  "analogous",
  "complementary",
  "split",
  "triad",
  "mono",
  "earth",
  "coastal",
  "nocturne",
] as const;

export type Harmony = (typeof HARMONIES)[number];

export const HARMONY_LABELS: Record<Harmony, string> = {
  editorial: "Editorial",
  analogous: "Analogous",
  complementary: "Complement",
  split: "Split",
  triad: "Triad",
  mono: "Mono",
  earth: "Earth",
  coastal: "Coastal",
  nocturne: "Nocturne",
};

export interface Swatch {
  role: SwatchRole;
  hex: string;
  texture: TextureId;
  colorLocked: boolean;
  textureLocked: boolean;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)] as T;
}

function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

function hexFrom(h: number, s: number, l: number): string {
  return hslToHex({ h: wrapHue(h), s: clamp(s, 0, 100), l: clamp(l, 0, 100) });
}

interface Recipe {
  paper: HSL;
  ink: HSL;
  accent: HSL;
  surface: HSL;
  mark: HSL;
}

function recipeToHexes(recipe: Recipe): [string, string, string, string, string] {
  return [
    hslToHex(recipe.paper),
    hslToHex(recipe.ink),
    hslToHex(recipe.accent),
    hslToHex(recipe.surface),
    hslToHex(recipe.mark),
  ];
}

function generateRecipe(harmony: Harmony, rand: () => number, seedHue: number): Recipe {
  const dark = harmony === "nocturne" || (harmony !== "editorial" && rand() < 0.38);
  const h = seedHue;

  if (harmony === "nocturne") {
    const hue = wrapHue(h);
    return {
      paper: { h: hue, s: between(rand, 6, 14), l: between(rand, 7, 12) },
      ink: { h: hue, s: between(rand, 8, 16), l: between(rand, 90, 96) },
      accent: {
        h: wrapHue(hue + between(rand, -12, 18)),
        s: between(rand, 22, 38),
        l: between(rand, 52, 68),
      },
      surface: { h: hue, s: between(rand, 6, 14), l: between(rand, 14, 20) },
      mark: {
        h: wrapHue(hue + between(rand, 18, 40)),
        s: between(rand, 16, 30),
        l: between(rand, 42, 56),
      },
    };
  }

  if (harmony === "editorial") {
    const hue = wrapHue(between(rand, 28, 48));
    return {
      paper: { h: hue, s: between(rand, 10, 22), l: between(rand, 90, 95) },
      ink: { h: hue, s: between(rand, 8, 16), l: between(rand, 8, 13) },
      accent: {
        h: wrapHue(hue + pick(rand, [-80, 95, 130, 155])),
        s: between(rand, 18, 36),
        l: between(rand, 28, 42),
      },
      surface: { h: hue, s: between(rand, 10, 20), l: between(rand, 82, 88) },
      mark: {
        h: wrapHue(hue + between(rand, -18, 12)),
        s: between(rand, 14, 28),
        l: between(rand, 38, 52),
      },
    };
  }

  if (harmony === "earth") {
    const hue = wrapHue(between(rand, 18, 42));
    return {
      paper: { h: hue, s: between(rand, 14, 28), l: dark ? between(rand, 10, 16) : between(rand, 90, 95) },
      ink: { h: hue, s: between(rand, 12, 24), l: dark ? between(rand, 88, 94) : between(rand, 10, 16) },
      accent: { h: wrapHue(hue + between(rand, -8, 14)), s: between(rand, 28, 48), l: between(rand, 32, 46) },
      surface: { h: hue, s: between(rand, 12, 24), l: dark ? between(rand, 18, 24) : between(rand, 82, 88) },
      mark: { h: wrapHue(hue + between(rand, 18, 36)), s: between(rand, 22, 40), l: between(rand, 36, 50) },
    };
  }

  if (harmony === "coastal") {
    const hue = wrapHue(between(rand, 188, 214));
    return {
      paper: { h: hue, s: between(rand, 8, 18), l: dark ? between(rand, 8, 13) : between(rand, 92, 96) },
      ink: { h: hue, s: between(rand, 10, 20), l: dark ? between(rand, 90, 95) : between(rand, 10, 15) },
      accent: { h: wrapHue(hue + between(rand, -8, 10)), s: between(rand, 24, 42), l: between(rand, 30, 44) },
      surface: { h: hue, s: between(rand, 8, 16), l: dark ? between(rand, 15, 21) : between(rand, 84, 90) },
      mark: { h: wrapHue(hue + between(rand, 28, 50)), s: between(rand, 16, 30), l: between(rand, 40, 54) },
    };
  }

  if (harmony === "mono") {
    const hue = wrapHue(h);
    const s = between(rand, 6, 22);
    if (dark) {
      return {
        paper: { h: hue, s, l: between(rand, 8, 13) },
        ink: { h: hue, s: s + 4, l: between(rand, 90, 95) },
        accent: { h: hue, s: s + 18, l: between(rand, 48, 62) },
        surface: { h: hue, s, l: between(rand, 16, 22) },
        mark: { h: hue, s: s + 10, l: between(rand, 34, 46) },
      };
    }
    return {
      paper: { h: hue, s, l: between(rand, 91, 96) },
      ink: { h: hue, s: s + 4, l: between(rand, 9, 14) },
      accent: { h: hue, s: s + 16, l: between(rand, 32, 44) },
      surface: { h: hue, s, l: between(rand, 82, 88) },
      mark: { h: hue, s: s + 8, l: between(rand, 46, 58) },
    };
  }

  const offsets: Record<Harmony, number[]> = {
    editorial: [0, 0, 0, 0, 0],
    analogous: [-28, -8, 0, 12, 26],
    complementary: [0, 0, 180, 8, 172],
    split: [0, 0, 150, 10, 210],
    triad: [0, 0, 120, 8, 240],
    mono: [0, 0, 0, 0, 0],
    earth: [0, 0, 0, 0, 0],
    coastal: [0, 0, 0, 0, 0],
    nocturne: [0, 0, 0, 0, 0],
  };

  const [dPaper, dInk, dAccent, dSurface, dMark] = offsets[harmony];
  const sBase = between(rand, 14, 36);

  if (dark) {
    return {
      paper: { h: wrapHue(h + dPaper), s: sBase * 0.4, l: between(rand, 8, 13) },
      ink: { h: wrapHue(h + dInk), s: sBase * 0.45, l: between(rand, 90, 95) },
      accent: { h: wrapHue(h + dAccent), s: sBase + 8, l: between(rand, 48, 62) },
      surface: { h: wrapHue(h + dSurface), s: sBase * 0.4, l: between(rand, 16, 22) },
      mark: { h: wrapHue(h + dMark), s: sBase, l: between(rand, 36, 50) },
    };
  }

  return {
    paper: { h: wrapHue(h + dPaper), s: sBase * 0.45, l: between(rand, 91, 96) },
    ink: { h: wrapHue(h + dInk), s: sBase * 0.5, l: between(rand, 9, 14) },
    accent: { h: wrapHue(h + dAccent), s: sBase + 6, l: between(rand, 30, 42) },
    surface: { h: wrapHue(h + dSurface), s: sBase * 0.45, l: between(rand, 82, 88) },
    mark: { h: wrapHue(h + dMark), s: sBase, l: between(rand, 40, 54) },
  };
}

function seedHueFrom(swatches: Swatch[], rand: () => number): number {
  const locked = swatches.find((s) => s.colorLocked);
  if (locked) return hexToHsl(locked.hex).h;
  const accent = swatches.find((s) => s.role === "Accent");
  if (accent && rand() < 0.35) return hexToHsl(accent.hex).h;
  return rand() * 360;
}

export function generateHexes(
  harmony: Harmony,
  rand: () => number,
  current: Swatch[],
): string[] {
  const hue = seedHueFrom(current, rand);
  const recipe = generateRecipe(harmony, rand, hue);
  let [paper, ink, accent, surface, mark] = recipeToHexes(recipe);

  const paperLocked = current[0]?.colorLocked ? current[0].hex : paper;
  paper = paperLocked;
  if (!current[1]?.colorLocked) {
    ink = ensureContrast(ink, paper, 7);
  } else {
    ink = current[1].hex;
  }
  if (current[2]?.colorLocked) accent = current[2].hex;
  if (current[3]?.colorLocked) surface = current[3].hex;
  else {
    const paperHsl = hexToHsl(paper);
    const surfaceL =
      paperHsl.l > 50
        ? clamp(paperHsl.l - between(rand, 6, 12), 70, 92)
        : clamp(paperHsl.l + between(rand, 6, 12), 12, 30);
    surface = hexFrom(paperHsl.h, paperHsl.s * 0.9, surfaceL);
  }
  if (current[4]?.colorLocked) mark = current[4].hex;

  return [paper, ink, accent, surface, mark];
}

export function pickTextures(
  current: Swatch[],
  rand: () => number,
): TextureId[] {
  const used = new Set<TextureId>();
  const next: TextureId[] = current.map((swatch) => {
    if (swatch.textureLocked) {
      used.add(swatch.texture);
      return swatch.texture;
    }
    return "solid";
  });

  const pool = TEXTURE_IDS.filter((id) => !used.has(id));
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const a = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = a;
  }

  let cursor = 0;
  return next.map((texture, index) => {
    if (current[index]?.textureLocked) return texture;
    const chosen = pool[cursor] ?? pick(rand, TEXTURE_IDS);
    cursor += 1;
    return chosen;
  });
}

export const DEFAULT_SWATCHES: Swatch[] = [
  {
    role: "Paper",
    hex: "#f3efe6",
    texture: "laid",
    colorLocked: false,
    textureLocked: false,
  },
  {
    role: "Ink",
    hex: "#161513",
    texture: "grain",
    colorLocked: false,
    textureLocked: false,
  },
  {
    role: "Accent",
    hex: "#3f5850",
    texture: "linen",
    colorLocked: false,
    textureLocked: false,
  },
  {
    role: "Surface",
    hex: "#e4ddd0",
    texture: "solid",
    colorLocked: false,
    textureLocked: false,
  },
  {
    role: "Mark",
    hex: "#8a6a4a",
    texture: "hatch",
    colorLocked: false,
    textureLocked: false,
  },
];

export function contrastOk(swatches: Swatch[]): boolean {
  const paper = swatches[0]?.hex;
  const ink = swatches[1]?.hex;
  if (!paper || !ink) return false;
  return contrastRatio(paper, ink) >= 7;
}
