import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { StructureCategory } from '../types/anatomy';

const LAYER_LABELS: { category: StructureCategory; label: string }[] = [
  { category: 'skin', label: 'Skin' },
  { category: 'muscle', label: 'Muscles' },
  { category: 'bone', label: 'Bones' },
  { category: 'nerve', label: 'Nerves' },
  { category: 'fascia', label: 'Fascia' },
];

export function LayerControls() {
  const [open, setOpen] = useState(false);
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const skinOpacity = useStore((s) => s.skinOpacity);
  const setSkinOpacity = useStore((s) => s.setSkinOpacity);
  const resetCamera = useStore((s) => s.resetCamera);
  const resetView = useStore((s) => s.resetView);

  return (
    <div className="layer-controls">
      <div className="control-row">
        <button
          type="button"
          className="btn"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          Layers
        </button>
        <button type="button" className="btn" onClick={resetCamera}>
          Reset view
        </button>
        <button type="button" className="btn btn-ghost" onClick={resetView}>
          Reset all
        </button>
      </div>

      {open && (
        <fieldset className="layer-panel">
          <legend className="visually-hidden">Toggle anatomical layers</legend>
          {LAYER_LABELS.map(({ category, label }) => (
            <label key={category} className="layer-toggle">
              <input
                type="checkbox"
                checked={layers[category]}
                onChange={() => toggleLayer(category)}
              />
              <span>{label}</span>
            </label>
          ))}
          <label className="skin-slider">
            <span>Skin transparency</span>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={skinOpacity}
              disabled={!layers.skin}
              onChange={(e) => setSkinOpacity(Number(e.target.value))}
            />
          </label>
        </fieldset>
      )}
    </div>
  );
}
