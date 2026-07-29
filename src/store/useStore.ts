import { create } from 'zustand';
import type { StructureCategory } from '../types/anatomy';

export type Language = 'en' | 'la';

export type PanelPosition = 'bottom' | 'right' | 'left' | 'top';

export type CameraFocus = 'body' | 'arm';

export type LayerVisibility = Record<StructureCategory, boolean>;

export type AppState = {
  selectedId: string | null;
  hoveredId: string | null;
  isolate: boolean;
  language: Language;
  skinOpacity: number;
  layers: LayerVisibility;
  /** Currently playing animation clip id, or null when idle. */
  activeAnimationId: string | null;
  isPlaying: boolean;
  /** 0 = fully extended, 1 = fully flexed. */
  elbowAngle: number;
  reducedMotion: boolean;
  cameraResetToken: number;
  /** Where the info panel docks. */
  panelPosition: PanelPosition;
  /** Which part of the model the camera frames. */
  focus: CameraFocus;

  select: (id: string | null) => void;
  setPanelPosition: (position: PanelPosition) => void;
  setFocus: (focus: CameraFocus) => void;
  showOnlyLayer: (category: StructureCategory) => void;
  showAllLayers: () => void;
  hover: (id: string | null) => void;
  toggleIsolate: () => void;
  setLanguage: (language: Language) => void;
  setSkinOpacity: (value: number) => void;
  toggleLayer: (category: StructureCategory) => void;
  playAnimation: (id: string) => void;
  pause: () => void;
  restart: () => void;
  setElbowAngle: (value: number) => void;
  setReducedMotion: (value: boolean) => void;
  resetView: () => void;
  resetCamera: () => void;
};

const defaultLayers: LayerVisibility = {
  skin: true,
  muscle: true,
  bone: true,
  nerve: true,
  fascia: true,
};

export const useStore = create<AppState>((set) => ({
  selectedId: null,
  hoveredId: null,
  isolate: false,
  language: 'en',
  skinOpacity: 0.25,
  layers: { ...defaultLayers },
  activeAnimationId: null,
  isPlaying: false,
  elbowAngle: 0,
  reducedMotion: false,
  cameraResetToken: 0,
  panelPosition: 'bottom',
  focus: 'body',

  select: (id) => set({ selectedId: id, isolate: false }),
  setPanelPosition: (position) => set({ panelPosition: position }),
  setFocus: (focus) => set((s) => ({ focus, cameraResetToken: s.cameraResetToken + 1 })),
  showOnlyLayer: (category) =>
    set(() => ({
      layers: {
        skin: category === 'skin',
        muscle: category === 'muscle',
        bone: category === 'bone',
        nerve: category === 'nerve',
        fascia: category === 'fascia',
      },
    })),
  showAllLayers: () => set({ layers: { ...defaultLayers } }),
  hover: (id) => set({ hoveredId: id }),
  toggleIsolate: () => set((s) => ({ isolate: !s.isolate })),
  setLanguage: (language) => set({ language }),
  setSkinOpacity: (value) => set({ skinOpacity: value }),
  toggleLayer: (category) =>
    set((s) => ({ layers: { ...s.layers, [category]: !s.layers[category] } })),
  playAnimation: (id) =>
    set({
      activeAnimationId: id,
      isPlaying: true,
      elbowAngle: id === 'elbow-extension' ? 1 : 0,
    }),
  pause: () => set({ isPlaying: false }),
  restart: () => set((s) => ({ isPlaying: true, elbowAngle: s.activeAnimationId === 'elbow-extension' ? 1 : 0 })),
  setElbowAngle: (value) => set({ elbowAngle: value }),
  setReducedMotion: (value) => set({ reducedMotion: value }),
  resetCamera: () => set((s) => ({ cameraResetToken: s.cameraResetToken + 1 })),
  resetView: () =>
    set((s) => ({
      selectedId: null,
      isolate: false,
      isPlaying: false,
      activeAnimationId: null,
      elbowAngle: 0,
      skinOpacity: 0.25,
      layers: { ...defaultLayers },
      cameraResetToken: s.cameraResetToken + 1,
    })),
}));
