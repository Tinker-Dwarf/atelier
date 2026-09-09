"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildMachine } from "../build-machine";
import { getMachine } from "../machines/registry";
import type { CabinVariant } from "../machines/types";
import { dimMm } from "../machines/types";

type Props = {
  machineId: string;
};

export function StudyShell({ machineId }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const explodeRef = useRef<(t: number) => void>(() => {});
  const [explode, setExplode] = useState(0);
  const [cabin, setCabin] = useState<CabinVariant>("rops");
  const [partIds, setPartIds] = useState<string[]>([]);

  const spec = useMemo(() => getMachine(machineId), [machineId]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !spec?.buildMesh) return;

    const studio = 0xf4f1ea;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(studio);

    const camera = new THREE.PerspectiveCamera(
      35,
      el.clientWidth / Math.max(el.clientHeight, 1),
      0.05,
      80,
    );
    camera.position.set(4.8, 2.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.9, 0);

    scene.add(new THREE.AmbientLight(0xf4f1ea, 0.5));
    scene.add(new THREE.HemisphereLight(0xfff8ef, 0xcfc6b8, 0.55));
    const key = new THREE.DirectionalLight(0xfff6e8, 1.1);
    key.position.set(4, 10, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 5;
    scene.add(key);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 48),
      new THREE.ShadowMaterial({ opacity: 0.22 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const built = buildMachine(spec, cabin);
    scene.add(built.root);
    explodeRef.current = built.setExplode;
    built.setExplode(explode);
    setPartIds([...built.partNodes.keys()]);

    let frame = 0;
    let alive = true;
    function tick() {
      if (!alive) return;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    function onResize() {
      if (!el) return;
      camera.aspect = el.clientWidth / Math.max(el.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
    // rebuild when cabin changes
  }, [spec, cabin]);

  useEffect(() => {
    explodeRef.current(explode);
  }, [explode]);

  if (!spec) {
    return <p className="p-6 text-sm text-neutral-600">Unknown machine: {machineId}</p>;
  }

  const frontOd = spec.dims.front_tire_od;
  const rearOd = spec.dims.rear_tire_od;

  return (
    <div className="study-page mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-neutral-500">
            Study / parametric
          </p>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-neutral-900">
            {spec.label}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            architecture: <code>{spec.architecture}</code>
            {" · "}
            hitch: Type {spec.hitch.type}
            {" · "}
            implements: {spec.implements.length}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`border px-3 py-1.5 ${cabin === "rops" ? "bg-neutral-900 text-white" : "bg-white"}`}
            onClick={() => setCabin("rops")}
          >
            ROPS
          </button>
          <button
            type="button"
            className={`border px-3 py-1.5 ${cabin === "cab" ? "bg-neutral-900 text-white" : "bg-white"}`}
            onClick={() => setCabin("cab")}
          >
            Cab
          </button>
        </div>
      </header>

      <figure className="overflow-hidden rounded-sm border border-[#d4cdc0] bg-[#f4f1ea] shadow-sm">
        <div className="flex items-baseline justify-between border-b border-[#e2dbcf] bg-[#f7f4ee] px-3 py-2 text-[0.65rem]">
          <span className="uppercase tracking-[0.14em] text-neutral-900">
            Study / {spec.id}
          </span>
          <span className="text-neutral-500">
            no GLTF · dims mm · tire OD unverified
          </span>
        </div>
        <div
          ref={mountRef}
          className="h-[min(52vh,480px)] min-h-[300px] cursor-grab bg-[#f4f1ea] active:cursor-grabbing"
        />
        <figcaption className="border-t border-[#e2dbcf] bg-[#f2eee6] px-3 py-2 text-center text-[0.62rem] uppercase tracking-[0.14em] text-neutral-500">
          Drag to orbit · Scroll to zoom
        </figcaption>
      </figure>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
        <label className="block text-sm text-neutral-700">
          Explode
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <div className="text-xs text-neutral-600">
          <p className="font-medium uppercase tracking-wider text-neutral-500">
            Parts
          </p>
          <ul className="mt-1 max-h-40 overflow-auto font-mono">
            {partIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="mt-6 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
        <div>
          <dt className="uppercase tracking-wider text-neutral-400">Wheelbase</dt>
          <dd>{dimMm(spec.dims.wheelbase)} mm</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-neutral-400">Length</dt>
          <dd>{dimMm(spec.dims.length)} mm</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-neutral-400">
            Front tire OD
          </dt>
          <dd>
            {typeof frontOd === "object"
              ? `${frontOd.mm} mm (${frontOd.status})`
              : `${frontOd} mm`}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wider text-neutral-400">
            Rear tire OD
          </dt>
          <dd>
            {typeof rearOd === "object"
              ? `${rearOd.mm} mm (${rearOd.status})`
              : `${rearOd} mm`}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-neutral-500">
        Sources: {spec.sources.join(" · ")}
      </p>
    </div>
  );
}
