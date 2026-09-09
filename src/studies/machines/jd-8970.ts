import type { MachineSpec } from "./types";

/**
 * John Deere 8970 — stub only (INGOT-38).
 * architecture: articulated. Hinge API reserved. buildMesh: false — no JD geometry this PR.
 */
export const jd8970Stub: MachineSpec = {
  id: "jd-8970",
  label: "John Deere 8970 (stub)",
  architecture: "articulated",
  cabinDefault: "cab",
  buildMesh: false,
  sources: [
    "https://www.tractordata.com/farm-tractors/000/1/7/172-john-deere-8970.html",
    "INGOT-37 Hermes JD brief",
  ],
  dims: {
    wheelbase: 3404,
    length: 6830,
    axle_od: 110,
    axle_length: 3251,
    hp_gross: 400,
  },
  profiles: {},
  parts: [],
  hitch: { type: "none", point: { x: 0, y: 0, z: 0 } },
  implements: [],
  hinge: {
    frontModuleId: "front_module",
    rearModuleId: "rear_module",
    steerAngle: 0,
  },
};
