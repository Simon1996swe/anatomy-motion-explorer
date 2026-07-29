import { lazy, Suspense, useState } from 'react';
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
  const selectedId = useStore((s) => s.selectedId);

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
      <header className="app-top">
        <div className="app-title">
          <h1>Anatomy Motion Explorer</h1>
          <LanguageToggle />
        </div>
        <SearchBar />
        <LayerControls />
      </header>

      <main className="app-viewer">
        <Viewer />
      </main>

      <aside className={`app-info ${selectedId ? 'has-selection' : ''}`}>
        <InfoPanel />
      </aside>
    </div>
  );
}
