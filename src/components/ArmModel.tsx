import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { SelectablePart } from './SelectablePart';
import type { StructureCategory } from '../types/anatomy';

/** Maximum flexion angle of the elbow, in radians (~140 degrees). */
const MAX_FLEX = 2.45;

/**
 * Placeholder arm built from primitive geometry.
 * The architecture (named nodes, category-based layers, per-part selection)
 * is designed so these primitives can later be swapped for GLB meshes without
 * changing the surrounding UI or data model.
 */
export function ArmModel() {
  const forearmRef = useRef<THREE.Group>(null);
  const bicepsRef = useRef<THREE.Group>(null);
  const tricepsRef = useRef<THREE.Group>(null);

  const isPlaying = useStore((s) => s.isPlaying);
  const activeAnimationId = useStore((s) => s.activeAnimationId);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setElbowAngle = useStore((s) => s.setElbowAngle);
  const pause = useStore((s) => s.pause);

  const layers = useStore((s) => s.layers);
  const isolate = useStore((s) => s.isolate);
  const selectedId = useStore((s) => s.selectedId);
  const skinOpacity = useStore((s) => s.skinOpacity);

  // Plain helper (not a hook): a part is visible when its layer is on and,
  // while isolating, it is the selected part.
  const visible = (category: StructureCategory, id: string): boolean =>
    layers[category] && !(isolate && selectedId !== null && selectedId !== id);

  const skinVisible = visible('skin', 'skin-arm');

  useFrame((_, delta) => {
    const { elbowAngle } = useStore.getState();
    if (isPlaying && activeAnimationId) {
      const target = activeAnimationId === 'elbow-extension' ? 0 : 1;
      if (reducedMotion) {
        setElbowAngle(target);
        pause();
      } else {
        const step = Math.min(delta * 0.9, 0.05);
        const next = THREE.MathUtils.lerp(elbowAngle, target, step * 8);
        if (Math.abs(next - target) < 0.01) {
          setElbowAngle(target);
          pause();
        } else {
          setElbowAngle(next);
        }
      }
    }

    // Apply pose from angle (also runs while paused so scrubbing works).
    const angle = useStore.getState().elbowAngle;
    if (forearmRef.current) {
      forearmRef.current.rotation.x = angle * MAX_FLEX;
    }
    // Muscles change shape during movement: biceps shortens & bulges on
    // flexion; triceps does the opposite.
    if (bicepsRef.current) {
      bicepsRef.current.scale.set(1 + angle * 0.5, 1 - angle * 0.18, 1 + angle * 0.5);
    }
    if (tricepsRef.current) {
      const ext = 1 - angle;
      tricepsRef.current.scale.set(1 + ext * 0.4, 1 - ext * 0.15, 1 + ext * 0.4);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Humerus: fixed vertical upper-arm bone (shoulder at top, elbow at 0). */}
      {visible('bone', 'humerus') && (
        <group position={[0, 1, 0]}>
          <SelectablePart structureId="humerus" category="bone" color="#e7e2d3">
            <cylinderGeometry args={[0.16, 0.19, 2, 20]} />
          </SelectablePart>
        </group>
      )}

      {/* Biceps: anterior (front, +z). */}
      {visible('muscle', 'biceps-brachii') && (
        <group ref={bicepsRef} position={[0, 1, 0.22]}>
          <SelectablePart structureId="biceps-brachii" category="muscle" color="#c0392b">
            <capsuleGeometry args={[0.13, 1.1, 6, 14]} />
          </SelectablePart>
        </group>
      )}

      {/* Triceps: posterior (back, -z). */}
      {visible('muscle', 'triceps-brachii') && (
        <group ref={tricepsRef} position={[0, 1, -0.22]}>
          <SelectablePart structureId="triceps-brachii" category="muscle" color="#a93226">
            <capsuleGeometry args={[0.14, 1.15, 6, 14]} />
          </SelectablePart>
        </group>
      )}

      {/* Forearm assembly pivots at the elbow (origin). */}
      <group ref={forearmRef} position={[0, 0, 0]}>
        <group position={[0, -1, 0]}>
          {visible('bone', 'radius') && (
            <group position={[0.09, 0, 0.03]}>
              <SelectablePart structureId="radius" category="bone" color="#efeadb">
                <cylinderGeometry args={[0.1, 0.12, 1.9, 16]} />
              </SelectablePart>
            </group>
          )}
          {visible('bone', 'ulna') && (
            <group position={[-0.09, 0, -0.03]}>
              <SelectablePart structureId="ulna" category="bone" color="#e7e2d3">
                <cylinderGeometry args={[0.12, 0.09, 2, 16]} />
              </SelectablePart>
            </group>
          )}
          {/* Simple hand block for orientation. */}
          {visible('bone', 'ulna') && (
            <mesh position={[0, -1.15, 0]}>
              <boxGeometry args={[0.3, 0.35, 0.14]} />
              <meshStandardMaterial color="#efeadb" roughness={0.6} />
            </mesh>
          )}
        </group>
      </group>

      {/* Translucent skin sleeve over the upper arm (not selectable). */}
      {skinVisible && (
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.4, 1.7, 6, 16]} />
          <meshStandardMaterial
            color="#f3c9a8"
            transparent
            opacity={skinOpacity}
            depthWrite={false}
            roughness={0.9}
          />
        </mesh>
      )}
    </group>
  );
}
