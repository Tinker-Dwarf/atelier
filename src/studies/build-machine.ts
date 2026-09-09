import * as THREE from "three";
import type { CabinVariant, MachineSpec, PartSpec } from "./machines/types";

const MATS = {
  caseRed: () =>
    new THREE.MeshStandardMaterial({
      color: 0xb33a1a,
      roughness: 0.84,
      metalness: 0.16,
    }),
  dark: () =>
    new THREE.MeshStandardMaterial({
      color: 0x1c1916,
      roughness: 0.92,
      metalness: 0.18,
    }),
  steel: () =>
    new THREE.MeshStandardMaterial({
      color: 0x5a5752,
      roughness: 0.55,
      metalness: 0.5,
    }),
  rubber: () =>
    new THREE.MeshStandardMaterial({
      color: 0x12100e,
      roughness: 0.97,
      metalness: 0.04,
    }),
  glass: () =>
    new THREE.MeshStandardMaterial({
      color: 0x6e8494,
      roughness: 0.3,
      metalness: 0.35,
      transparent: true,
      opacity: 0.45,
    }),
};

function geoFor(part: PartSpec): THREE.BufferGeometry {
  switch (part.op) {
    case "box": {
      const b = part.box!;
      return new THREE.BoxGeometry(b.w, b.h, b.d);
    }
    case "cylinder": {
      const c = part.cylinder!;
      return new THREE.CylinderGeometry(
        c.rTop,
        c.rBot,
        c.h,
        c.segments ?? 12,
      );
    }
    case "lathe": {
      const pts = (part.lathe ?? []).map(
        ([x, y]) => new THREE.Vector2(x, y),
      );
      return new THREE.LatheGeometry(pts, 28);
    }
    case "extrude": {
      const e = part.extrude!;
      const shape = new THREE.Shape();
      const p0 = e.profile[0];
      shape.moveTo(p0[0], p0[1]);
      for (let i = 1; i < e.profile.length; i++) {
        shape.lineTo(e.profile[i][0], e.profile[i][1]);
      }
      return new THREE.ExtrudeGeometry(shape, {
        depth: e.depth,
        bevelEnabled: !!e.bevel,
        bevelThickness: 0.015,
        bevelSize: 0.01,
        bevelSegments: 2,
      });
    }
    default:
      return new THREE.BoxGeometry(0.1, 0.1, 0.1);
  }
}

export type BuiltMachine = {
  root: THREE.Group;
  partNodes: Map<string, THREE.Object3D>;
  setExplode: (t: number) => void;
};

/** Pure-ish: MachineSpec + cabin → Three graph. */
export function buildMachine(
  spec: MachineSpec,
  cabin: CabinVariant,
): BuiltMachine {
  if (!spec.buildMesh) {
    const root = new THREE.Group();
    root.name = spec.id;
    return {
      root,
      partNodes: new Map(),
      setExplode: () => {},
    };
  }

  const root = new THREE.Group();
  root.name = spec.id;
  const partNodes = new Map<string, THREE.Object3D>();

  for (const part of spec.parts) {
    if (part.cabin && part.cabin !== "both" && part.cabin !== cabin) continue;

    const mat = MATS[part.material]();
    let mesh: THREE.Mesh = new THREE.Mesh(geoFor(part), mat);

    if (part.op === "lathe") {
      // axle along Z for wheels sitting on Y
      mesh.rotation.z = Math.PI / 2;
    }
    if (part.op === "extrude") {
      mesh.position.z -= (part.extrude?.depth ?? 0) / 2;
    }

    const g = new THREE.Group();
    g.name = part.id;
    g.add(mesh);
    const { x, y, z, rx = 0, ry = 0, rz = 0 } = part.rest;
    g.position.set(x, y, z);
    g.rotation.set(rx, ry, rz);
    g.userData.rest = { x, y, z };
    g.userData.explode = part.explode;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    root.add(g);
    partNodes.set(part.id, g);
  }

  function setExplode(t: number) {
    const k = Math.min(1, Math.max(0, t));
    for (const node of partNodes.values()) {
      const rest = node.userData.rest as { x: number; y: number; z: number };
      const exp = node.userData.explode as { x: number; y: number; z: number };
      node.position.set(
        rest.x + exp.x * k,
        rest.y + exp.y * k,
        rest.z + exp.z * k,
      );
    }
  }

  return { root, partNodes, setExplode };
}
