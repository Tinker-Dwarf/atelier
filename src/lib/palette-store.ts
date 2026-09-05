import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { normalizeHex } from "./color";
import {
  DEFAULT_SWATCHES,
  generateHexes,
  HARMONIES,
  mulberry32,
  pickTextures,
  type Harmony,
  type Swatch,
} from "./harmonies";
import { isTextureId, type TextureId } from "./textures";

const HISTORY_LIMIT = 24;

export type ShuffleTarget = "all" | "colors" | "textures";

interface PaletteState {
  brandName: string;
  harmony: Harmony;
  swatches: Swatch[];
  past: Swatch[][];
  future: Swatch[][];
  liveTheme: boolean;
  hydrated: boolean;
  setBrandName: (name: string) => void;
  setHarmony: (harmony: Harmony) => void;
  setLiveTheme: (on: boolean) => void;
  setHex: (index: number, hex: string) => void;
  setTexture: (index: number, texture: TextureId) => void;
  toggleColorLock: (index: number) => void;
  toggleTextureLock: (index: number) => void;
  shuffle: (target?: ShuffleTarget) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  markHydrated: () => void;
}

function snapshot(swatches: Swatch[]): Swatch[] {
  return swatches.map((s) => ({ ...s }));
}

function pushPast(past: Swatch[][], swatches: Swatch[]): Swatch[][] {
  const next = [...past, snapshot(swatches)];
  if (next.length > HISTORY_LIMIT) next.shift();
  return next;
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set, get) => ({
      brandName: "Atelier",
      harmony: "editorial",
      swatches: DEFAULT_SWATCHES,
      past: [],
      future: [],
      liveTheme: false,
      hydrated: false,
      markHydrated: () => set({ hydrated: true }),
      setBrandName: (brandName) => set({ brandName }),
      setHarmony: (harmony) => set({ harmony }),
      setLiveTheme: (liveTheme) => set({ liveTheme }),
      setHex: (index, hex) => {
        const nextHex = normalizeHex(hex);
        if (!nextHex) return;
        const { swatches, past } = get();
        if (!swatches[index] || swatches[index].hex === nextHex) return;
        const next = snapshot(swatches);
        next[index] = { ...next[index]!, hex: nextHex };
        set({ swatches: next, past: pushPast(past, swatches), future: [] });
      },
      setTexture: (index, texture) => {
        const { swatches, past } = get();
        if (!swatches[index] || swatches[index].texture === texture) return;
        const next = snapshot(swatches);
        next[index] = { ...next[index]!, texture };
        set({ swatches: next, past: pushPast(past, swatches), future: [] });
      },
      toggleColorLock: (index) => {
        const { swatches } = get();
        if (!swatches[index]) return;
        const next = snapshot(swatches);
        next[index] = {
          ...next[index]!,
          colorLocked: !next[index]!.colorLocked,
        };
        set({ swatches: next });
      },
      toggleTextureLock: (index) => {
        const { swatches } = get();
        if (!swatches[index]) return;
        const next = snapshot(swatches);
        next[index] = {
          ...next[index]!,
          textureLocked: !next[index]!.textureLocked,
        };
        set({ swatches: next });
      },
      shuffle: (target = "all") => {
        const { swatches, past, harmony } = get();
        const rand = mulberry32((Math.random() * 2 ** 32) >>> 0);
        const next = snapshot(swatches);
        if (target === "all" || target === "colors") {
          const hexes = generateHexes(harmony, rand, next);
          next.forEach((swatch, i) => {
            if (!swatch.colorLocked && hexes[i]) swatch.hex = hexes[i]!;
          });
        }
        if (target === "all" || target === "textures") {
          const textures = pickTextures(next, rand);
          next.forEach((swatch, i) => {
            if (!swatch.textureLocked && textures[i]) swatch.texture = textures[i]!;
          });
        }
        set({
          swatches: next,
          past: pushPast(past, swatches),
          future: [],
        });
      },
      undo: () => {
        const { past, future, swatches } = get();
        const prev = past[past.length - 1];
        if (!prev) return;
        set({
          swatches: snapshot(prev),
          past: past.slice(0, -1),
          future: [snapshot(swatches), ...future].slice(0, HISTORY_LIMIT),
        });
      },
      redo: () => {
        const { past, future, swatches } = get();
        const [nxt, ...rest] = future;
        if (!nxt) return;
        set({
          swatches: snapshot(nxt),
          future: rest,
          past: pushPast(past, swatches),
        });
      },
      reset: () => {
        const { swatches, past } = get();
        set({
          swatches: snapshot(DEFAULT_SWATCHES),
          past: pushPast(past, swatches),
          future: [],
          harmony: "editorial",
        });
      },
    }),
    {
      name: "atelier-palette",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        brandName: state.brandName,
        harmony: state.harmony,
        swatches: state.swatches,
        liveTheme: state.liveTheme,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PaletteState> | undefined;
        if (!saved) return current;
        const harmony = HARMONIES.includes(saved.harmony as Harmony)
          ? (saved.harmony as Harmony)
          : current.harmony;
        const swatches =
          Array.isArray(saved.swatches) && saved.swatches.length === 5
            ? saved.swatches.map((s, i) => {
                const base = DEFAULT_SWATCHES[i]!;
                return {
                  role: base.role,
                  hex: normalizeHex(s.hex) ?? base.hex,
                  texture: isTextureId(s.texture) ? s.texture : base.texture,
                  colorLocked: Boolean(s.colorLocked),
                  textureLocked: Boolean(s.textureLocked),
                };
              })
            : current.swatches;
        return {
          ...current,
          brandName:
            typeof saved.brandName === "string" && saved.brandName.trim()
              ? saved.brandName.slice(0, 48)
              : current.brandName,
          harmony,
          swatches,
          liveTheme: Boolean(saved.liveTheme),
        };
      },
    },
  ),
);
