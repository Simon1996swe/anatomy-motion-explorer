import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/**
 * Every remaining muscle of the muscular system (BodyParts3D, CC BY-SA 2.1 JP)
 * merged into one filler mesh, so the figure reads as a complete body rather
 * than isolated muscles on bare bone.
 *
 * Deliberately rendered in a single natural muscle tone and left unselectable:
 * the named, colour-coded groups sit on top of this and stay the readable,
 * clickable layer. Toggle off ("Deep muscles") to study the superficial groups
 * against the skeleton.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/muscles_fill.glb`;

useGLTF.preload(MODEL_URL);

export function MuscleFillModel() {
  const { scene } = useGLTF(MODEL_URL);
  const showMuscle = useStore((s) => s.layers.muscle);
  const showAllMuscles = useStore((s) => s.showAllMuscles);

  const object = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#9d4a3f',
      roughness: 0.72,
      metalness: 0.02,
    });
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = material;
      if (!mesh.geometry.getAttribute('normal')) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
      }
      mesh.raycast = () => {}; // filler context: named groups stay clickable
    });
    return clone;
  }, [scene]);

  if (!showMuscle || !showAllMuscles) return null;
  return <primitive object={object} />;
}
