import { useStore } from '../store/useStore';
import type { StructureCategory } from '../types/anatomy';
import type { PanelPosition, CameraFocus } from '../store/useStore';

const VIEWS: { value: CameraFocus; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'arm', label: 'Right arm' },
];

const LAYERS: { category: StructureCategory; label: string }[] = [
  { category: 'skin', label: 'Skin' },
  { category: 'muscle', label: 'Muscles' },
  { category: 'bone', label: 'Bones' },
  { category: 'nerve', label: 'Nerves' },
  { category: 'fascia', label: 'Fascia' },
];

const POSITIONS: { value: PanelPosition; label: string }[] = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'top', label: 'Top' },
];

export function LayerControls() {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const showOnlyLayer = useStore((s) => s.showOnlyLayer);
  const showAllLayers = useStore((s) => s.showAllLayers);
  const skinOpacity = useStore((s) => s.skinOpacity);
  const setSkinOpacity = useStore((s) => s.setSkinOpacity);
  const resetCamera = useStore((s) => s.resetCamera);
  const resetView = useStore((s) => s.resetView);
  const panelPosition = useStore((s) => s.panelPosition);
  const setPanelPosition = useStore((s) => s.setPanelPosition);
  const focus = useStore((s) => s.focus);
  const setFocus = useStore((s) => s.setFocus);

  const allOn = LAYERS.every(({ category }) => layers[category]);

  return (
    <div className="layer-controls">
      {/* Camera views: click to move the camera to that angle / region. */}
      <div className="layer-group" role="group" aria-label="Camera view">
        <span className="layer-group-label">Camera</span>
        <div className="chip-row">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`chip ${focus === value ? 'chip-active' : ''}`}
              aria-pressed={focus === value}
              onClick={() => setFocus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-row">
        <button type="button" className="btn btn-sm" onClick={resetCamera}>
          Reset view
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={resetView}>
          Reset all
        </button>
      </div>

      {/* Quick layer switch: show everything, or isolate a single layer. */}
      <div className="layer-group" role="group" aria-label="Quick layer switch">
        <span className="layer-group-label">Show</span>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${allOn ? 'chip-active' : ''}`}
            onClick={showAllLayers}
          >
            All
          </button>
          {LAYERS.map(({ category, label }) => {
            const onlyThis =
              !allOn &&
              layers[category] &&
              LAYERS.every((l) => l.category === category || !layers[l.category]);
            return (
              <button
                key={category}
                type="button"
                className={`chip ${onlyThis ? 'chip-active' : ''}`}
                onClick={() => showOnlyLayer(category)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine control: toggle individual layers on/off. */}
      <fieldset className="layer-panel">
        <legend className="visually-hidden">Toggle individual layers</legend>
        {LAYERS.map(({ category, label }) => (
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

      {/* Where the info panel appears when a structure is selected. */}
      <div className="layer-group" role="group" aria-label="Info panel position">
        <span className="layer-group-label">Info panel</span>
        <div className="chip-row">
          {POSITIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`chip ${panelPosition === value ? 'chip-active' : ''}`}
              aria-pressed={panelPosition === value}
              onClick={() => setPanelPosition(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
