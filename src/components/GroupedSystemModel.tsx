import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { nodeNameToStructureId } from '../data/structures';

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
  roughness?: number;
};

/** Strips the suffix three.js appends to duplicated node names. */
function baseName(name: string): string {
  return name.replace(/[.#]\d+$/, '');
}

export function GroupedSystemModel({
  url,
  colors,
  fallbackColor,
  opacity = 1,
  roughness = 0.6,
}: Props) {
  const { scene } = useGLTF(url);
  const invalidate = useThree((s) => s.invalidate);

  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);
  const selectedId = useStore((s) => s.selectedId);
  const hoveredId = useStore((s) => s.hoveredId);
  const isolate = useStore((s) => s.isolate);

  // Meshes owned by this model, indexed by the structure they represent.
  const byStructure = useRef(new Map<string, THREE.Mesh[]>());

  const object = useMemo(() => {
    const clone = scene.clone(true);
    const index = new Map<string, THREE.Mesh[]>();

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;

      const key = baseName(mesh.name);
      const structureId = nodeNameToStructureId[key];

      // Each mesh gets its own material so it can be highlighted individually.
      mesh.material = new THREE.MeshStandardMaterial({
        color: colors[key] ?? fallbackColor,
        roughness,
        metalness: 0.02,
        transparent: opacity < 1,
        opacity,
        side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
      });

      if (!mesh.geometry.getAttribute('normal')) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
      }

      if (structureId) {
        const list = index.get(structureId) ?? [];
        list.push(mesh);
        index.set(structureId, list);
      } else {
        mesh.raycast = () => {}; // no content for this mesh: not selectable
      }
    });

    byStructure.current = index;
    return clone;
  }, [scene, colors, fallbackColor, opacity, roughness]);

  // Highlight selection / hover, and honour isolate mode.
  useEffect(() => {
    const index = byStructure.current;
    for (const [structureId, meshes] of index) {
      const isSelected = structureId === selectedId;
      const isHovered = structureId === hoveredId;
      for (const mesh of meshes) {
        const m = mesh.material as THREE.MeshStandardMaterial;
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
