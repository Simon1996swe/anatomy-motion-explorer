import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

const reset = () => useStore.getState().resetView();

describe('useStore', () => {
  beforeEach(reset);

  it('selects and clears a structure', () => {
    useStore.getState().select('biceps-brachii');
    expect(useStore.getState().selectedId).toBe('biceps-brachii');
    useStore.getState().select(null);
    expect(useStore.getState().selectedId).toBeNull();
  });

  it('toggles layers', () => {
    expect(useStore.getState().layers.bone).toBe(true);
    useStore.getState().toggleLayer('bone');
    expect(useStore.getState().layers.bone).toBe(false);
  });

  it('switches language', () => {
    useStore.getState().setLanguage('la');
    expect(useStore.getState().language).toBe('la');
  });

  it('sets the start pose when playing an animation', () => {
    useStore.getState().playAnimation('elbow-extension');
    expect(useStore.getState().elbowAngle).toBe(1);
    expect(useStore.getState().isPlaying).toBe(true);
    useStore.getState().playAnimation('elbow-flexion');
    expect(useStore.getState().elbowAngle).toBe(0);
  });

  it('reset view restores defaults and bumps the camera token', () => {
    const before = useStore.getState().cameraResetToken;
    useStore.getState().select('triceps-brachii');
    useStore.getState().toggleLayer('skin');
    useStore.getState().resetView();
    const s = useStore.getState();
    expect(s.selectedId).toBeNull();
    expect(s.layers.skin).toBe(true);
    expect(s.cameraResetToken).toBe(before + 1);
  });
});
