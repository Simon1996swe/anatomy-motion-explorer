import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ArmModel } from './ArmModel';
import { ArmModelGLB } from './ArmModelGLB';
import { SkeletonModel } from './SkeletonModel';
import { MuscleSystemModel } from './MuscleSystemModel';
import { MuscleFillModel } from './MuscleFillModel';
import { FasciaModel } from './FasciaModel';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { useStore } from '../store/useStore';

// Camera presets in the shared body coordinate frame (elbow at the origin).
// Body centre ~ (0.98, -1.5, 1.6); height ~12, anterior = +Z, up = +Y.
type View = { position: [number, number, number]; target: [number, number, number] };
const C: [number, number, number] = [1.51, -1.74, 0.4];
const VIEWS: Record<string, View> = {
  front: { position: [C[0], C[1], C[2] + 20], target: C },
  back: { position: [C[0], C[1], C[2] - 20], target: C },
  left: { position: [C[0] - 20, C[1], C[2]], target: C },
  right: { position: [C[0] + 20, C[1], C[2]], target: C },
  top: { position: [C[0], C[1] + 15, C[2] + 0.01], target: C },
  bottom: { position: [C[0], C[1] - 15, C[2] + 0.01], target: C },
  arms: { position: [C[0], 0.2, C[2] + 12], target: [C[0], 0.2, C[2]] },
  legs: { position: [C[0], -4.7, C[2] + 12], target: [C[0], -4.7, C[2]] },
  arm: { position: [2.4, 0.9, 7.7], target: [-0.1, 0.2, 0.2] },
};

function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraResetToken = useStore((s) => s.cameraResetToken);
  const focus = useStore((s) => s.focus);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const view = VIEWS[focus];
    controls.object.position.set(...view.position);
    controls.target.set(...view.target);
    controls.update();
  }, [cameraResetToken, focus]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      // Damping needs a continuous render loop; disabled so on-demand
      // rendering can idle. Each interaction still invalidates and repaints.
      enableDamping={false}
      minDistance={2}
      maxDistance={45}
      target={VIEWS.front.target}
    />
  );
}

function Loader() {
  return (
    <Html center>
      <div className="canvas-loader" role="status">
        Loading model…
      </div>
    </Html>
  );
}

/** Clicking empty space clears the selection. */
function BackgroundDeselect() {
  const select = useStore((s) => s.select);
  return (
    <mesh position={[0, 0, -20]} onPointerDown={() => select(null)}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export function Viewer() {
  return (
    <Canvas
      // On-demand rendering: only repaint on interaction/animation, not every
      // frame. Keeps idle GPU/CPU near zero (fixes laptop lag & heat).
      frameloop="demand"
      camera={{ position: VIEWS.front.position, fov: 42, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {/* Illustrated look. Cel shading needs directional contrast: too much
          ambient light pushes every surface into the brightest band and the
          banding disappears, so ambient stays low. */}
      <color attach="background" args={['#111a2b']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 8]} intensity={2.1} />
      <directionalLight position={[-6, 3, -4]} intensity={0.7} />
      <directionalLight position={[0, -4, 3]} intensity={0.35} />
      <BackgroundDeselect />
      {/* Whole-body context meshes; failure here shouldn't break the arm. */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <SkeletonModel />
        </Suspense>
      </ModelErrorBoundary>
      {/* Full musculature underneath, then the named colour-coded groups. */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <MuscleFillModel />
        </Suspense>
      </ModelErrorBoundary>
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <MuscleSystemModel />
        </Suspense>
      </ModelErrorBoundary>
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FasciaModel />
        </Suspense>
      </ModelErrorBoundary>
      <ModelErrorBoundary fallback={<ArmModel />}>
        <Suspense fallback={<Loader />}>
          <ArmModelGLB />
        </Suspense>
      </ModelErrorBoundary>
      <CameraRig />
    </Canvas>
  );
}
