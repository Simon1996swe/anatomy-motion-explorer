import { useState } from 'react';
import { structures as initialStructures } from '../data/structures';
import type { AnatomicalStructure } from '../types/anatomy';

/**
 * Development-only content editor.
 *
 * This component is only mounted when import.meta.env.DEV is true (see App.tsx),
 * so it is never shipped in a public production build. It lets the project
 * owner edit names, description and functions, mark content reviewed, and
 * export the updated dataset as JSON to commit back into the repository.
 *
 * There is deliberately no public/write API and no authentication here — the
 * editor works entirely in-memory and only produces a JSON download.
 */
export function ContentEditor() {
  const [items, setItems] = useState<AnatomicalStructure[]>(() =>
    initialStructures.map((s) => ({ ...s })),
  );
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const active = items.find((i) => i.id === activeId);

  function update(patch: Partial<AnatomicalStructure>) {
    setItems((prev) => prev.map((i) => (i.id === activeId ? { ...i, ...patch } : i)));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'structures.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>Content editor (dev only)</h1>
        <div>
          <a className="btn btn-ghost" href="/">
            ← Back to app
          </a>
          <button type="button" className="btn" onClick={exportJson}>
            Export JSON
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-list" aria-label="Structures">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`admin-list-item ${i.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(i.id)}
            >
              {i.englishName} {i.reviewed ? '✓' : ''}
            </button>
          ))}
        </nav>

        {active && (
          <form className="admin-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              English name
              <input
                value={active.englishName}
                onChange={(e) => update({ englishName: e.target.value })}
              />
            </label>
            <label>
              Latin name
              <input
                value={active.latinName}
                onChange={(e) => update({ latinName: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={active.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </label>
            <label>
              Functions (one per line)
              <textarea
                rows={3}
                value={active.functions.join('\n')}
                onChange={(e) =>
                  update({ functions: e.target.value.split('\n').filter(Boolean) })
                }
              />
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={active.reviewed}
                onChange={(e) => update({ reviewed: e.target.checked })}
              />
              Mark as reviewed
            </label>

            <fieldset>
              <legend>Sources</legend>
              {active.sources.map((src, idx) => (
                <div key={idx} className="admin-source">
                  <input
                    placeholder="Title"
                    value={src.title}
                    onChange={(e) => {
                      const sources = active.sources.map((s, i) =>
                        i === idx ? { ...s, title: e.target.value } : s,
                      );
                      update({ sources });
                    }}
                  />
                  <input
                    placeholder="URL"
                    value={src.url}
                    onChange={(e) => {
                      const sources = active.sources.map((s, i) =>
                        i === idx ? { ...s, url: e.target.value } : s,
                      );
                      update({ sources });
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  update({
                    sources: [
                      ...active.sources,
                      { title: '', url: '', accessedAt: new Date().toISOString().slice(0, 10) },
                    ],
                  })
                }
              >
                + Add source
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}
