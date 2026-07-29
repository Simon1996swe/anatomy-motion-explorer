import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ArmModel } from './ArmModel';
import { ArmModelGLB } from './ArmModelGLB';
import { SkeletonModel } from './SkeletonModel';
import { MuscleSystemModel } from './MuscleSystemModel';
import { ModelErrorBoundary } from './ModelErrorBoundary';
import { useStore } from '../store/useStore';

// Camera presets in the shared body coordinate frame (elbow at the origin).
// Body centre ~ (0.98, -1.5, 1.6); height ~12, anterior = +Z, up = +Y.
type View = { position: [number, number, number]; target: [number, number, number] };
const C: [number, number, number] = [0.98, -1.5, 1.6];
const VIEWS: Record<string, View> = {
  front: { position: [C[0], C[1], C[2] + 20], target: C },
  back: { position: [C[0], C[1], C[2] - 20], target: C },
  left: { position: [C[0] - 20, C[1], C[2]], target: C },
  right: { position: [C[0] + 20, C[1], C[2]], target: C },
  top: { position: [C[0], C[1] + 15, C[2] + 0.01], target: C },
  bottom: { position: [C[0], C[1] - 15, C[2] + 0.01], target: C },
  arms: { position: [C[0], 0, C[2] + 12], target: [C[0], 0, C[2]] },
  legs: { position: [C[0], -4.5, C[2] + 12], target: [C[0], -4.5, C[2]] },
  arm: { position: [2.5, 0.9, 7.6], target: [-0.1, 0.2, 0.1] },
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
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      <directionalLight position={[0, -3, 4]} intensity={0.35} />
      <hemisphereLight args={['#cfe0ff', '#20293d', 0.7]} />
      <BackgroundDeselect />
      {/* Whole-body context meshes; failure here shouldn't break the arm. */}
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <SkeletonModel />
        </Suspense>
      </ModelErrorBoundary>
      <ModelErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <MuscleSystemModel />
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
