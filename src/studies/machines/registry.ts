import { caseIh695 } from "./case-ih-695";
import { jd8970Stub } from "./jd-8970";
import type { MachineSpec } from "./types";

/** Spec-driven machine registry. Geometry = f(spec) when buildMesh. */
export const machineRegistry: Record<string, MachineSpec> = {
  "case-ih-695": caseIh695,
  "jd-8970": jd8970Stub,
};

export function getMachine(id: string): MachineSpec | undefined {
  return machineRegistry[id];
}

export const machineIds = Object.keys(machineRegistry);
