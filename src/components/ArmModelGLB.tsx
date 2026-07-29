import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { SelectablePart } from './SelectablePart';
import type { StructureCategory } from '../types/anatomy';

/**
 * Real anatomical arm loaded from a compressed glTF built from BodyParts3D
 * (CC BY-SA 2.1 Japan). See public/models/ATTRIBUTION.txt and ASSET_REGISTER.md.
 *
 * The model is authored (see scripts/build_arm_model.py) with the elbow joint
 * at the local origin and the arm upright, so the forearm bones can hinge about
 * the elbow exactly like the placeholder model — reusing the same animation and
 * selection systems.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/arm.glb`;
const MAX_FLEX = 2.53;
const HALF_SWING = 1.5;

const NODE = {
  humerus: 'bone_humerus',
  radius: 'bone_radius',
  ulna: 'bone_ulna',
  biceps: 'muscle_biceps',
  triceps: 'muscle_triceps',
} as const;

useGLTF.preload(MODEL_URL);

function easeInOut(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

export function ArmModelGLB() {
  const { nodes } = useGLTF(MODEL_URL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };

  const isPlaying = useStore((s) => s.isPlaying);
  const activeAnimationId = useStore((s) => s.activeAnimationId);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setElbowAngle = useStore((s) => s.setElbowAngle);
  const pause = useStore((s) => s.pause);
  const elbowAngle = useStore((s) => s.elbowAngle);

  const layers = useStore((s) => s.layers);
  const isolate = useStore((s) => s.isolate);
  const selectedId = useStore((s) => s.selectedId);

  const invalidate = useThree((s) => s.invalidate);
  const phaseRef = useRef(0);
  const dirRef = useRef(1);

  const visible = (category: StructureCategory, id: string): boolean =>
    layers[category] && !(isolate && selectedId !== null && selectedId !== id);

  // Extract geometries, generate smooth normals (the source has none), compute
  // an offset that centres the whole arm for framing, and re-centre the muscle
  // meshes on their own centroid so they can be scaled (bulge) about themselves.
  const { geos, center, bicepsCenter, tricepsCenter } = useMemo(() => {
    const g: Record<string, THREE.BufferGeometry> = {};
    const box = new THREE.Box3();
    for (const key of Object.values(NODE)) {
      const geo = nodes[key].geometry.clone();
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      g[key] = geo;
      box.union(geo.boundingBox!);
    }
    const c = new THREE.Vector3();
    box.getCenter(c);

    const bc = new THREE.Vector3();
    const tc = new THREE.Vector3();
    g[NODE.biceps].boundingBox!.getCenter(bc);
    g[NODE.triceps].boundingBox!.getCenter(tc);
    // Translate muscle geometry to its centroid; the group is then placed back
    // at that centroid, so scaling the group bulges the muscle in place.
    g[NODE.biceps].translate(-bc.x, -bc.y, -bc.z);
    g[NODE.triceps].translate(-tc.x, -tc.y, -tc.z);
    return { geos: g, center: c, bicepsCenter: bc, tricepsCenter: tc };
  }, [nodes]);

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
    invalidate();
  });

  const forearmRot = elbowAngle * MAX_FLEX;
  // Approximate contraction: the biceps shortens (−Y) and bulges (X/Z) as the
  // elbow flexes; the triceps does the opposite as it extends. This is a visual
  // suggestion of movement, not a rigged deformation.
  const ext = 1 - elbowAngle;
  const bicepsScale: [number, number, number] = [
    1 + elbowAngle * 0.28,
    1 - elbowAngle * 0.14,
    1 + elbowAngle * 0.28,
  ];
  const tricepsScale: [number, number, number] = [
    1 + ext * 0.2,
    1 - ext * 0.1,
    1 + ext * 0.2,
  ];

  return (
    // Outer group recentres the arm on the origin. Its local origin stays at
    // the elbow, so the forearm subgroup still hinges about the joint.
    <group position={[-center.x, -center.y, -center.z]}>
      {visible('bone', 'humerus') && (
        <SelectablePart structureId="humerus" category="bone" color="#e7e2d3">
          <primitive object={geos[NODE.humerus]} attach="geometry" />
        </SelectablePart>
      )}
      {visible('muscle', 'biceps-brachii') && (
        <group position={bicepsCenter} scale={bicepsScale}>
          <SelectablePart structureId="biceps-brachii" category="muscle" color="#b8402f">
            <primitive object={geos[NODE.biceps]} attach="geometry" />
          </SelectablePart>
        </group>
      )}
      {visible('muscle', 'triceps-brachii') && (
        <group position={tricepsCenter} scale={tricepsScale}>
          <SelectablePart structureId="triceps-brachii" category="muscle" color="#9c3526">
            <primitive object={geos[NODE.triceps]} attach="geometry" />
          </SelectablePart>
        </group>
      )}

      {/* Forearm bones hinge at the elbow (local origin). */}
      <group rotation={[forearmRot, 0, 0]}>
        {visible('bone', 'radius') && (
          <SelectablePart structureId="radius" category="bone" color="#efeadb">
            <primitive object={geos[NODE.radius]} attach="geometry" />
          </SelectablePart>
        )}
        {visible('bone', 'ulna') && (
          <SelectablePart structureId="ulna" category="bone" color="#e7e2d3">
            <primitive object={geos[NODE.ulna]} attach="geometry" />
          </SelectablePart>
        )}
      </group>
    </group>
  );
}
