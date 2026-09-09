import type { MachineSpec, PartSpec } from "./types";

const WB = 2253 / 1000;
const HALF_TREAD = 1905 / 1000 / 2;

function tireLathe(odMm: number, widthMm: number): [number, number][] {
  const r = odMm / 1000 / 2;
  const w = widthMm / 1000;
  return [
    [r * 0.55, -w / 2],
    [r * 0.92, -w / 2 + 0.02],
    [r, -w * 0.3],
    [r, w * 0.3],
    [r * 0.92, w / 2 - 0.02],
    [r * 0.55, w / 2],
    [r * 0.42, w * 0.2],
    [r * 0.42, -w * 0.2],
    [r * 0.55, -w / 2],
  ];
}

/** Case IH 695 — first slice. Dims from TractorData / Hermes INGOT-37 (mm). */
export const caseIh695: MachineSpec = {
  id: "case-ih-695",
  label: "Case IH 695",
  architecture: "rigid",
  cabinDefault: "rops",
  buildMesh: true,
  sources: [
    "https://www.tractordata.com/farm-tractors/001/1/5/1155-caseih-695.html",
    "https://www.tractordata.com/photos/F001/1155/1155-td3a.jpg",
    "INGOT-37 Hermes brief",
  ],
  dims: {
    wheelbase: 2253,
    length: 3607,
    width_min_tread: 1905,
    height_rops: 2451,
    height_cab: 2550,
    hp_gross: 72,
    front_tire_od: {
      mm: 810,
      status: "catalog",
      note: "7.50-16 Samson R-1S; Astro/Forlander 808–810",
      source: "INGOT-38 Hermes catalog",
    },
    rear_tire_od: {
      mm: 1265,
      status: "catalog",
      note: "14.9-24 BKT TR-135 (Goodyear 1243 / Firestone ~1260 brand spread — not averaged)",
      source: "INGOT-38 Hermes catalog",
    },
    front_tire_width: {
      mm: 190,
      status: "unverified",
      note: "width estimate from 7.50-16 code",
    },
    rear_tire_width: {
      mm: 380,
      status: "unverified",
      note: "width estimate from 14.9-24 code",
    },
  },
  profiles: {
    hood: [
      [0, 0],
      [1.35, 0],
      [1.45, 0.08],
      [1.4, 0.45],
      [0.15, 0.55],
      [0, 0.4],
      [0, 0],
    ],
  },
  hitch: { type: "II", point: { x: -1.15, y: 0.55, z: 0 } },
  implements: [],
  parts: buildParts(),
};

function buildParts(): PartSpec[] {
  const frontOd = 810;
  const rearOd = 1265;
  const frontW = 190;
  const rearW = 380;
  const frontR = frontOd / 1000 / 2;
  const rearR = rearOd / 1000 / 2;
  const frontLathe = tireLathe(frontOd, frontW);
  const rearLathe = tireLathe(rearOd, rearW);

  return [
    {
      id: "chassis",
      op: "box",
      material: "dark",
      rest: { x: 0.1, y: 0.55, z: 0 },
      explode: { x: 0, y: 0.45, z: 0 },
      box: { w: WB + 0.45, h: 0.18, d: 0.45 },
      cabin: "both",
    },
    {
      id: "hood",
      op: "extrude",
      material: "caseRed",
      rest: { x: 0.35, y: 0.7, z: 0 },
      explode: { x: 0.55, y: 0.25, z: 0 },
      extrude: {
        profile: [
          [0, 0],
          [1.35, 0],
          [1.45, 0.08],
          [1.4, 0.45],
          [0.15, 0.55],
          [0, 0.4],
          [0, 0],
        ],
        depth: 0.85,
        bevel: true,
      },
      cabin: "both",
    },
    {
      id: "stack",
      op: "cylinder",
      material: "dark",
      rest: { x: 0.55, y: 1.45, z: 0.28 },
      explode: { x: 0.15, y: 0.85, z: 0.25 },
      cylinder: { rTop: 0.045, rBot: 0.055, h: 0.7, segments: 12 },
      cabin: "both",
    },
    {
      id: "cab",
      op: "box",
      material: "dark",
      rest: { x: -0.55, y: 1.45, z: 0 },
      explode: { x: -0.35, y: 0.75, z: 0 },
      box: { w: 0.95, h: 1.0, d: 1.05 },
      cabin: "cab",
    },
    {
      id: "rops_post_l",
      op: "cylinder",
      material: "steel",
      rest: { x: -0.55, y: 1.5, z: 0.45 },
      explode: { x: -0.25, y: 0.65, z: 0.4 },
      cylinder: { rTop: 0.035, rBot: 0.035, h: 1.1, segments: 10 },
      cabin: "rops",
    },
    {
      id: "rops_post_r",
      op: "cylinder",
      material: "steel",
      rest: { x: -0.55, y: 1.5, z: -0.45 },
      explode: { x: -0.25, y: 0.65, z: -0.4 },
      cylinder: { rTop: 0.035, rBot: 0.035, h: 1.1, segments: 10 },
      cabin: "rops",
    },
    {
      id: "rops_beam",
      op: "box",
      material: "steel",
      rest: { x: -0.55, y: 2.05, z: 0 },
      explode: { x: -0.25, y: 0.95, z: 0 },
      box: { w: 0.08, h: 0.08, d: 1.0 },
      cabin: "rops",
    },
    {
      id: "axle_front",
      op: "cylinder",
      material: "steel",
      rest: { x: WB / 2, y: frontR, z: 0, rx: Math.PI / 2 },
      explode: { x: 0.45, y: 0, z: 0 },
      cylinder: { rTop: 0.05, rBot: 0.05, h: HALF_TREAD * 2, segments: 10 },
      cabin: "both",
    },
    {
      id: "axle_rear",
      op: "cylinder",
      material: "steel",
      rest: { x: -WB / 2, y: rearR, z: 0, rx: Math.PI / 2 },
      explode: { x: -0.45, y: 0, z: 0 },
      cylinder: { rTop: 0.06, rBot: 0.06, h: HALF_TREAD * 2 + 0.1, segments: 10 },
      cabin: "both",
    },
    {
      id: "hitch_type_ii",
      op: "box",
      material: "steel",
      rest: { x: -1.15, y: 0.55, z: 0 },
      explode: { x: -0.65, y: 0, z: 0 },
      box: { w: 0.2, h: 0.25, d: 0.55 },
      cabin: "both",
    },
    {
      id: "wheel_fl",
      op: "lathe",
      material: "rubber",
      rest: { x: WB / 2, y: frontR, z: HALF_TREAD },
      explode: { x: 0.55, y: 0, z: 0.55 },
      lathe: frontLathe,
      cabin: "both",
    },
    {
      id: "wheel_fr",
      op: "lathe",
      material: "rubber",
      rest: { x: WB / 2, y: frontR, z: -HALF_TREAD },
      explode: { x: 0.55, y: 0, z: -0.55 },
      lathe: frontLathe,
      cabin: "both",
    },
    {
      id: "wheel_rl",
      op: "lathe",
      material: "rubber",
      rest: { x: -WB / 2, y: rearR, z: HALF_TREAD },
      explode: { x: -0.55, y: 0, z: 0.6 },
      lathe: rearLathe,
      cabin: "both",
    },
    {
      id: "wheel_rr",
      op: "lathe",
      material: "rubber",
      rest: { x: -WB / 2, y: rearR, z: -HALF_TREAD },
      explode: { x: -0.55, y: 0, z: -0.6 },
      lathe: rearLathe,
      cabin: "both",
    },
  ];
}

// silence unused import if tree-shaken — dimMm reserved for shell readouts
