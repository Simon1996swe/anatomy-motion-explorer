import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Renders a glTF whose meshes are named anatomical groups, giving each group
 * its own colour so neighbouring structures are visually distinguishable.
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

export function GroupedSystemModel({
  url,
  colors,
  fallbackColor,
  opacity = 1,
  roughness = 0.6,
}: Props) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const clone = scene.clone(true);
    const cache = new Map<string, THREE.MeshStandardMaterial>();

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;

      // Node names come from the build scripts (e.g. "quadriceps").
      const key = mesh.name.replace(/[.#].*$/, '');
      const color = colors[key] ?? fallbackColor;
      let material = cache.get(color);
      if (!material) {
        material = new THREE.MeshStandardMaterial({
          color,
          roughness,
          metalness: 0.02,
          transparent: opacity < 1,
          opacity,
          side: opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
        });
        cache.set(color, material);
      }
      mesh.material = material;

      if (!mesh.geometry.getAttribute('normal')) {
        mesh.geometry = mesh.geometry.clone();
        mesh.geometry.computeVertexNormals();
      }
      mesh.raycast = () => {}; // context geometry: not selectable
    });
    return clone;
  }, [scene, colors, fallbackColor, opacity, roughness]);

  return <primitive object={object} />;
}
