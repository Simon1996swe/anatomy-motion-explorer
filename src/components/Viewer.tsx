import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ArmModel } from './ArmModel';
import { useStore } from '../store/useStore';

const CAMERA_START: [number, number, number] = [2.6, 0.6, 7.5];
const CAMERA_TARGET: [number, number, number] = [0, 0, 0];

function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraResetToken = useStore((s) => s.cameraResetToken);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...CAMERA_START);
    controls.target.set(...CAMERA_TARGET);
    controls.update();
  }, [cameraResetToken]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableDamping
      minDistance={3}
      maxDistance={16}
      target={CAMERA_TARGET}
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
      camera={{ position: CAMERA_START, fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0b1220']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.6} />
      <directionalLight position={[0, -3, 4]} intensity={0.35} />
      <hemisphereLight args={['#cfe0ff', '#20293d', 0.7]} />
      <Suspense fallback={<Loader />}>
        <BackgroundDeselect />
        <ArmModel />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
