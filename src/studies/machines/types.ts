/** Serializable machine study types — geometry = f(spec). Unit: mm in dims. */

export type Architecture = "rigid" | "articulated";

export type CabinVariant = "cab" | "rops";

export type PartOp = "lathe" | "extrude" | "box" | "cylinder";

export type UnverifiedDim = {
  mm: number;
  status: "unverified";
  note: string;
};

export type DimValue = number | UnverifiedDim;

export function dimMm(d: DimValue): number {
  return typeof d === "number" ? d : d.mm;
}

export type Vec2 = [number, number];

export type PartSpec = {
  id: string;
  op: PartOp;
  /** material key resolved in builder */
  material: "caseRed" | "dark" | "steel" | "rubber" | "glass";
  parent?: string;
  /** rest pose in scene meters (mm/1000) */
  rest: { x: number; y: number; z: number; rx?: number; ry?: number; rz?: number };
  /** explode offset direction (unit-ish) in meters */
  explode: { x: number; y: number; z: number };
  /** op-specific params in meters */
  box?: { w: number; h: number; d: number };
  cylinder?: { rTop: number; rBot: number; h: number; segments?: number };
  /** lathe profile in meters: [radius, y] */
  lathe?: Vec2[];
  /** extrude profile in meters: [x, y] shape, depth along z */
  extrude?: { profile: Vec2[]; depth: number; bevel?: boolean };
  /** only include when cabin matches (cab study parts) */
  cabin?: CabinVariant | "both";
};

export type HitchSpec = {
  type: "II" | "III" | "none";
  /** hitch point in meters */
  point: { x: number; y: number; z: number };
};

export type ImplementSpec = {
  id: string;
  label: string;
  /** reserved — empty for now */
};

/** Articulated hinge API reserved for JD — interface only on Case. */
export type ArticulatedHingeApi = {
  frontModuleId: string;
  rearModuleId: string;
  /** radians; reserved */
  steerAngle: number;
};

export type MachineSpec = {
  id: string;
  label: string;
  architecture: Architecture;
  cabinDefault: CabinVariant;
  dims: Record<string, DimValue>;
  profiles: Record<string, Vec2[]>;
  parts: PartSpec[];
  hitch: HitchSpec;
  implements: ImplementSpec[];
  /** only when architecture === 'articulated' */
  hinge?: ArticulatedHingeApi;
  /** mesh builder enabled? stubs set false */
  buildMesh: boolean;
  sources: string[];
};
