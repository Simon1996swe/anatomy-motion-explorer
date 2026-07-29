import { lazy, Suspense, useEffect, useState } from 'react';
import { Viewer } from './components/Viewer';
import { WebGLFallback } from './components/WebGLFallback';
import { SearchBar } from './components/SearchBar';
import { LayerControls } from './components/LayerControls';
import { InfoPanel } from './components/InfoPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { isWebGLAvailable } from './lib/webgl';
import { useReducedMotionSync } from './hooks/useReducedMotion';
import { useStore } from './store/useStore';

// Dev-only content editor is code-split so it never ships in production.
const ContentEditor = lazy(() =>
  import('./admin/ContentEditor').then((m) => ({ default: m.ContentEditor })),
);

export default function App() {
  useReducedMotionSync();
  const [webgl] = useState(isWebGLAvailable);
  const [controlsOpen, setControlsOpen] = useState(false);
  const selectedId = useStore((s) => s.selectedId);

  // Collapse the menu once a structure is picked, so the model stays central.
  useEffect(() => {
    if (selectedId) setControlsOpen(false);
  }, [selectedId]);

  // Simple dev-only admin route (no router dependency needed for the MVP).
  if (import.meta.env.DEV && window.location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="app-loading">Loading editor…</div>}>
        <ContentEditor />
      </Suspense>
    );
  }

  if (!webgl) return <WebGLFallback />;

  return (
    <div className="app">
      {/* Full-screen 3D viewer is the main surface; panels float over it. */}
      <main className="app-viewer">
        <Viewer />
      </main>

      {/* Collapsible control cluster (top-left). Collapses to a single button. */}
      <div className={`controls-dock ${controlsOpen ? 'open' : ''}`}>
        <div className="dock-bar">
          <button
            type="button"
            className="btn dock-toggle"
            aria-expanded={controlsOpen}
            aria-controls="controls-body"
            onClick={() => setControlsOpen((o) => !o)}
          >
            {controlsOpen ? '✕ Close' : '☰ Menu'}
          </button>
          <span className="dock-title">Anatomy Motion Explorer</span>
        </div>

        {controlsOpen && (
          <div id="controls-body" className="dock-body">
            <LanguageToggle />
            <SearchBar />
            <LayerControls />
            <p className="model-credit">
              3D model derived from{' '}
              <a
                href="https://lifesciencedb.jp/bp3d/"
                target="_blank"
                rel="noreferrer"
              >
                BodyParts3D
              </a>{' '}
              © The Database Center for Life Science, CC BY-SA 2.1 JP.
            </p>
          </div>
        )}
      </div>

      {/* Info panel only mounts when something is selected, so it stays out of
          the way otherwise and the model gets the full screen. */}
      {selectedId && (
        <aside className="app-info has-selection">
          <InfoPanel />
        </aside>
      )}
    </div>
  );
}
