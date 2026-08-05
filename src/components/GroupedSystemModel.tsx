import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { nodeNameToStructureId } from '../data/structures';
import { makeToonMaterial, makeOutlineMesh } from '../lib/toonStyle';

/**
 * Renders a glTF whose meshes are named anatomical groups. Each group gets its
 * own colour so neighbouring structures stay distinguishable, and each is
 * clickable: the mesh name is resolved to a structure via `modelNodeNames`.
 *
 * The models are meshopt/quantization-compressed, so the de-quantization scale
 * lives on the node transform: we clone the loaded scene (preserving those
 * transforms) and only swap materials. Extracting bare geometry would drop the
 * scale and render the model at the wrong size.
 */
type Props = {
  url: string;
  colors: Record<string, string>;
  fallbackColor: string;
  /** Optional transparency (used for fascia sheets). */
  opacity?: number;
};

/** Strips the suffix three.js appends to duplicated node names. */
function baseName(name: string): string {
  return name.replace(/[.#]\d+$/, '');
}

/** Vertical axis of the body in the shared frame (x, z); used for exploding. */
const BODY_AXIS_X = 1.51;
const BODY_AXIS_Z = 0.4;
/** How far structures travel at explode = 1. */
const EXPLODE_DISTANCE = 3.2;

export function GroupedSystemModel({
  url,
  colors,
  fallbackColor,
  opacity = 1,
}: Props) {
  const { scene } = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);

  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);
  const selectedId = useStore((s) => s.selectedId);
  const hoveredId = useStore((s) => s.hoveredId);
  const isolate = useStore((s) => s.isolate);

  const explode = useStore((s) => s.explode);

  // Meshes owned by this model, indexed by the structure they represent.
  const byStructure = useRef(new Map<string, THREE.Mesh[]>());
  // Outward direction for each mesh, used by the explode slider.
  const explodeDirs = useRef(new Map<THREE.Mesh, THREE.Vector3>());

  const object = useMemo(() => {
    const clone = scene.clone(true);
    // Needed so localToWorld below reflects the glTF node transforms.
    clone.updateMatrixWorld(true);
    const index = new Map<string, THREE.Mesh[]>();
    const dirs = new Map<THREE.Mesh, THREE.Vector3>();

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;

      const key = baseName(mesh.name);
      const structureId = nodeNameToStructureId[key];

      // Direction this mesh moves when the model is exploded: straight out
      // from the body's vertical axis, so structures separate sideways
      // instead of piling up.
      mesh.geometry.computeBoundingBox();
      const c = new THREE.Vector3();
      mesh.geometry.boundingBox!.getCenter(c);
      mesh.localToWorld(c);
      const dir = new THREE.Vector3(c.x - BODY_AXIS_X, 0, c.z - BODY_AXIS_Z);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      dirs.set(mesh, dir.normalize());

      if (!mesh.geometry.getAttribute('normal')) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
      }

      // Each mesh gets its own cel-shaded material so it can be highlighted
      // individually, plus an ink outline for the illustrated look.
      mesh.material = makeToonMaterial(colors[key] ?? fallbackColor, {
        opacity,
        doubleSided: opacity < 1,
      });
      if (opacity >= 1) mesh.add(makeOutlineMesh(mesh, 0.012));

      if (structureId) {
        const list = index.get(structureId) ?? [];
        list.push(mesh);
        index.set(structureId, list);
      } else {
        mesh.raycast = () => {}; // no content for this mesh: not selectable
      }
    });

    byStructure.current = index;
    explodeDirs.current = dirs;
    return clone;
  }, [scene, colors, fallbackColor, opacity]);

  // Pull structures away from the body axis.
  useEffect(() => {
    for (const [mesh, dir] of explodeDirs.current) {
      mesh.position.copy(dir).multiplyScalar(explode * EXPLODE_DISTANCE);
    }
    invalidate();
  }, [explode, object, invalidate]);

  // Highlight selection / hover, and honour isolate mode.
  useEffect(() => {
    const index = byStructure.current;
    for (const [structureId, meshes] of index) {
      const isSelected = structureId === selectedId;
      const isHovered = structureId === hoveredId;
      for (const mesh of meshes) {
        const m = mesh.material as THREE.MeshToonMaterial;
        m.emissive.set(isSelected ? '#fde047' : isHovered ? '#38bdf8' : '#000000');
        m.emissiveIntensity = isSelected ? 0.65 : isHovered ? 0.3 : 0;
        // Selection is also shown by a scale bump, so colour is never the only
        // cue that something is selected.
        const s = isSelected ? 1.02 : 1;
        mesh.scale.setScalar(s);
        mesh.visible = !isolate || !selectedId || isSelected;
      }
    }
    invalidate();
  }, [selectedId, hoveredId, isolate, object, invalidate]);

  return (
    <primitive
      object={object}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        const id = nodeNameToStructureId[baseName(e.object.name)];
        if (!id) return;
        e.stopPropagation();
        select(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        const id = nodeNameToStructureId[baseName(e.object.name)];
        if (!id) return;
        e.stopPropagation();
        hover(id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        hover(null);
        document.body.style.cursor = 'default';
      }}
    />
  );
}
