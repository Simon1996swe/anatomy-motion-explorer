import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/**
 * Whole-body skeleton context (BodyParts3D, CC BY-SA 2.1 JP), built in the same
 * coordinate frame as the arm model (see scripts/build_skeleton.py). Rendered as
 * a single non-selectable object under the Bones layer; the detailed, selectable
 * arm bones are supplied separately by ArmModelGLB.
 *
 * The mesh is meshopt/quantization-compressed, so its de-quantization scale
 * lives on the node transform. We clone the whole loaded scene (preserving that
 * transform) and only swap the material — extracting the bare geometry would
 * drop the scale and render the skeleton at the wrong size.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/skeleton.glb`;

useGLTF.preload(MODEL_URL);

export function SkeletonModel() {
  const { scene } = useGLTF(MODEL_URL);
  const showBone = useStore((s) => s.layers.bone);

  const object = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#e8e2d2',
      roughness: 0.75,
      metalness: 0.02,
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
        mesh.raycast = () => {}; // non-selectable context
      }
    });
    return clone;
  }, [scene]);

  if (!showBone) return null;
  return <primitive object={object} />;
}
