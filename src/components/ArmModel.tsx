import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import { SelectablePart } from './SelectablePart';
import type { StructureCategory } from '../types/anatomy';

/** Maximum flexion angle of the elbow, in radians (~145°, realistic range). */
const MAX_FLEX = 2.53;
/** Seconds for one half-swing (extend <-> fully flexed). */
const HALF_SWING = 1.5;

/** Smooth ease-in-out (sine) over a linear phase in [0, 1]. */
function easeInOut(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/**
 * Placeholder arm built from primitive geometry.
 *
 * Pose is derived from `elbowAngle` (0 = extended, 1 = fully flexed) and applied
 * declaratively, so any change repaints under on-demand rendering. A frame loop
 * runs only while an animation is playing, driving a smooth ping-pong curl.
 *
 * The architecture (named nodes, category layers, per-part selection) is built
 * so these primitives can later be swapped for GLB meshes without changing the
 * surrounding UI or data model.
 */
export function ArmModel() {
  const isPlaying = useStore((s) => s.isPlaying);
  const activeAnimationId = useStore((s) => s.activeAnimationId);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setElbowAngle = useStore((s) => s.setElbowAngle);
  const pause = useStore((s) => s.pause);
  const elbowAngle = useStore((s) => s.elbowAngle);

  const layers = useStore((s) => s.layers);
  const isolate = useStore((s) => s.isolate);
  const selectedId = useStore((s) => s.selectedId);
  const skinOpacity = useStore((s) => s.skinOpacity);

  const invalidate = useThree((s) => s.invalidate);
  const phaseRef = useRef(0); // linear 0..1 progress of the current swing
  const dirRef = useRef(1); // +1 flexing, -1 extending

  // Plain helper (not a hook): a part is visible when its layer is on and,
  // while isolating, it is the selected part.
  const visible = (category: StructureCategory, id: string): boolean =>
    layers[category] && !(isolate && selectedId !== null && selectedId !== id);

  const skinVisible = visible('skin', 'skin-arm');

  // Kick the frame loop when playback starts and sync the swing phase to the
  // clip (flexion starts extended and curls up; extension starts flexed).
  useEffect(() => {
    if (isPlaying && !reducedMotion) {
      const startFlexed = activeAnimationId === 'elbow-extension';
      phaseRef.current = startFlexed ? 1 : 0;
      dirRef.current = startFlexed ? -1 : 1;
      invalidate();
    }
  }, [isPlaying, activeAnimationId, reducedMotion, invalidate]);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    if (reducedMotion) {
      // Respect reduced motion: jump straight to the end pose, no tweening.
      setElbowAngle(activeAnimationId === 'elbow-extension' ? 0 : 1);
      pause();
      return;
    }

    phaseRef.current += (dirRef.current * Math.min(delta, 0.05)) / HALF_SWING;
    if (phaseRef.current >= 1) {
      phaseRef.current = 1;
      dirRef.current = -1;
    } else if (phaseRef.current <= 0) {
      phaseRef.current = 0;
      dirRef.current = 1;
    }
    setElbowAngle(easeInOut(phaseRef.current));
    invalidate(); // request the next frame while playing
  });

  // --- Pose derived from the current angle -------------------------------
  const forearmRot = elbowAngle * MAX_FLEX;
  // Biceps shortens and bulges as the elbow flexes.
  const bicepsScale: [number, number, number] = [
    1 + elbowAngle * 0.32,
    1 - elbowAngle * 0.14,
    1 + elbowAngle * 0.32,
  ];
  // Triceps does the opposite: fuller when the arm is extended.
  const ext = 1 - elbowAngle;
  const tricepsScale: [number, number, number] = [
    1 + ext * 0.22,
    1 - ext * 0.1,
    1 + ext * 0.22,
  ];

  return (
    // Shift up so the arm's geometric centre sits at the origin for framing.
    <group position={[0, 0.15, 0]}>
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
        <group position={[0, 1, 0.22]} scale={bicepsScale}>
          <SelectablePart structureId="biceps-brachii" category="muscle" color="#c0392b">
            <capsuleGeometry args={[0.13, 1.1, 8, 16]} />
          </SelectablePart>
        </group>
      )}

      {/* Triceps: posterior (back, -z). */}
      {visible('muscle', 'triceps-brachii') && (
        <group position={[0, 1, -0.22]} scale={tricepsScale}>
          <SelectablePart structureId="triceps-brachii" category="muscle" color="#a93226">
            <capsuleGeometry args={[0.14, 1.15, 8, 16]} />
          </SelectablePart>
        </group>
      )}

      {/* Forearm assembly pivots at the elbow (origin) around the X axis. */}
      <group rotation={[forearmRot, 0, 0]}>
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
          <capsuleGeometry args={[0.4, 1.7, 8, 20]} />
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
