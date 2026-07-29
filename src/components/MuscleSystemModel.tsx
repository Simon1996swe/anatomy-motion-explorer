import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/**
 * Whole-body musculature context (BodyParts3D, CC BY-SA 2.1 JP), built in the
 * shared coordinate frame (scripts/build_system.py). Rendered as one
 * non-selectable object under the Muscle layer; the selectable/animated arm
 * muscles (biceps, triceps) are supplied separately by ArmModelGLB and are
 * excluded from this mesh to avoid overlap.
 *
 * Meshopt/quantization-compressed, so we keep the node transform (see
 * SkeletonModel for why) and only swap the material.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/muscles.glb`;

useGLTF.preload(MODEL_URL);

export function MuscleSystemModel() {
  const { scene } = useGLTF(MODEL_URL);
  const showMuscle = useStore((s) => s.layers.muscle);

  const object = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#b23a2e',
      roughness: 0.6,
      metalness: 0.03,
    });
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = material;
        if (!mesh.geometry.getAttribute('normal')) {
          mesh.geometry = mesh.geometry.clone();
          mesh.geometry.computeVertexNormals();
        }
        mesh.raycast = () => {};
      }
    });
    return clone;
  }, [scene]);

  if (!showMuscle) return null;
  return <primitive object={object} />;
}
