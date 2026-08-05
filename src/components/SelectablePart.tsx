import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { makeToonMaterial } from '../lib/toonStyle';
import type { StructureCategory } from '../types/anatomy';

type Props = {
  structureId: string;
  category: StructureCategory;
  color: string;
  children: ReactNode;
  /** When false the mesh cannot be selected (e.g. the skin sleeve). */
  selectable?: boolean;
};

/**
 * Wraps a mesh so it can be selected, hovered and highlighted.
 * Highlight uses both an emissive glow AND a scale bump, so colour is never
 * the only cue that something is selected (accessibility requirement).
 */
export function SelectablePart({
  structureId,
  category,
  color,
  children,
  selectable = true,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useStore((s) => s.selectedId);
  const hoveredId = useStore((s) => s.hoveredId);
  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);

  const isSelected = selectable && selectedId === structureId;
  const isHovered = selectable && hoveredId === structureId;

  const material = useMemo(() => makeToonMaterial(color), [color]);

  material.emissive = new THREE.Color(isSelected ? '#fde047' : isHovered ? '#38bdf8' : '#000000');
  material.emissiveIntensity = isSelected ? 0.7 : isHovered ? 0.35 : 0;

  return (
    <mesh
      ref={meshRef}
      material={material}
      scale={isSelected ? 1.06 : 1}
      userData={{ structureId, category }}
      onPointerDown={
        selectable
          ? (e) => {
              e.stopPropagation();
              select(structureId);
            }
          : undefined
      }
      onPointerOver={
        selectable
          ? (e) => {
              e.stopPropagation();
              hover(structureId);
              document.body.style.cursor = 'pointer';
            }
          : undefined
      }
      onPointerOut={
        selectable
          ? () => {
              hover(null);
              document.body.style.cursor = 'default';
            }
          : undefined
      }
    >
      {children}
    </mesh>
  );
}
