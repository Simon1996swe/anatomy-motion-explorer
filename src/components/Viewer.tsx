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
const VIEWS = {
  body: {
    position: [3, 0.5, 19] as [number, number, number],
    target: [1, -1.5, 1.6] as [number, number, number],
  },
  arm: {
    position: [2.5, 0.9, 7.6] as [number, number, number],
    target: [-0.1, 0.2, 0.1] as [number, number, number],
  },
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
      target={VIEWS.body.target}
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
      camera={{ position: VIEWS.body.position, fov: 42, near: 0.1, far: 200 }}
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
