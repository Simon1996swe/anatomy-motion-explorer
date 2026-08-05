import * as THREE from 'three';

/**
 * Stylised ("animated" / illustrated) rendering.
 *
 * Instead of photoreal cadaver shading we use:
 *   - cel shading: a stepped gradient map, so light falls in flat bands
 *   - ink outlines: a back-facing hull pushed out along the vertex normals
 *
 * The result reads like an anatomy cartoon/illustration rather than a scan,
 * which is easier to look at and much cheaper to render.
 */

/** Stepped gradient used by MeshToonMaterial to produce flat bands of light. */
let gradientMap: THREE.DataTexture | null = null;

function getGradientMap(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  // 4 tones: shadow -> mid -> light -> highlight
  const data = new Uint8Array([90, 150, 210, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradientMap = tex;
  return tex;
}

export function makeToonMaterial(
  color: string,
  opts: { opacity?: number; doubleSided?: boolean } = {},
): THREE.MeshToonMaterial {
  const { opacity = 1, doubleSided = false } = opts;
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    transparent: opacity < 1,
    opacity,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  });
}

/** Ink outline: back faces pushed outward along their normals. */
export function makeOutlineMaterial(thickness: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineThickness: { value: thickness },
      outlineColor: { value: new THREE.Color('#101826') },
    },
    vertexShader: `
      uniform float outlineThickness;
      void main() {
        vec3 displaced = position + normal * outlineThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      void main() { gl_FragColor = vec4(outlineColor, 1.0); }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });
}

/**
 * Adds an outline shell around a mesh. Returned mesh must be added as a child
 * so it inherits the parent's transform (including explode offsets).
 */
export function makeOutlineMesh(
  source: THREE.Mesh,
  thickness: number,
): THREE.Mesh {
  const outline = new THREE.Mesh(source.geometry, makeOutlineMaterial(thickness));
  outline.raycast = () => {};
  outline.renderOrder = -1;
  return outline;
}
