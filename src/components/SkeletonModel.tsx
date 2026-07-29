import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/**
 * Whole-body skeleton context (BodyParts3D, CC BY-SA 2.1 JP), built in the same
 * coordinate frame as the arm model (see scripts/build_skeleton.py). Rendered as
 * a single non-selectable mesh under the Bones layer; the detailed, selectable
 * arm bones are supplied separately by ArmModelGLB.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/skeleton.glb`;

useGLTF.preload(MODEL_URL);

export function SkeletonModel() {
  const { nodes } = useGLTF(MODEL_URL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const showBone = useStore((s) => s.layers.bone);

  const geometry = useMemo(() => {
    const src = nodes.skeleton ?? Object.values(nodes).find((n) => n.geometry);
    const geo = src!.geometry.clone();
    geo.computeVertexNormals();
    return geo;
  }, [nodes]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8e2d2',
        roughness: 0.75,
        metalness: 0.02,
      }),
    [],
  );

  if (!showBone) return null;
  return <mesh geometry={geometry} material={material} />;
}
