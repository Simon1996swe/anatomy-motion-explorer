import { DISCLAIMER } from '../data/structures';

export function WebGLFallback() {
  return (
    <div className="fallback" role="alert">
      <h1>3D view unavailable</h1>
      <p>
        Your browser or device could not start WebGL, which this app needs to
        show the 3D model. Try updating your browser, enabling hardware
        acceleration, or opening the app on another device.
      </p>
      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
