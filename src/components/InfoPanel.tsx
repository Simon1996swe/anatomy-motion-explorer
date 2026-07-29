import { structures } from '../data/structures';
import { useStore } from '../store/useStore';
import { AnimationControls } from './AnimationControls';
import { Disclaimer } from './Disclaimer';
import type { AnatomicalStructure } from '../types/anatomy';

const CATEGORY_LABELS: Record<AnatomicalStructure['category'], string> = {
  skin: 'Skin',
  muscle: 'Muscle',
  bone: 'Bone',
  nerve: 'Nerve',
  fascia: 'Fascia',
};

function nameOf(id: string, lang: 'en' | 'la'): string {
  const s = structures.find((x) => x.id === id);
  if (!s) return id;
  return lang === 'en' ? s.englishName : s.latinName;
}

function Related({ title, ids }: { title: string; ids: string[] }) {
  const language = useStore((s) => s.language);
  const select = useStore((s) => s.select);
  if (ids.length === 0) return null;
  return (
    <div className="info-block">
      <h3>{title}</h3>
      <div className="chip-row">
        {ids.map((id) => (
          <button key={id} type="button" className="chip" onClick={() => select(id)}>
            {nameOf(id, language)}
          </button>
        ))}
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="info-block">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function InfoPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const language = useStore((s) => s.language);
  const isolate = useStore((s) => s.isolate);
  const toggleIsolate = useStore((s) => s.toggleIsolate);
  const select = useStore((s) => s.select);

  const structure = structures.find((s) => s.id === selectedId) ?? null;

  if (!structure) {
    return (
      <div className="info-panel info-empty">
        <p>Tap a muscle or bone, or use search, to see details here.</p>
        <Disclaimer />
      </div>
    );
  }

  const primary = language === 'en' ? structure.englishName : structure.latinName;
  const secondary = language === 'en' ? structure.latinName : structure.englishName;

  return (
    <div className="info-panel" aria-live="polite">
      <div className="info-header">
        <div>
          <h2>{primary}</h2>
          <p className="info-sub">{secondary}</p>
          <p className="info-type">
            {CATEGORY_LABELS[structure.category]} · {structure.region}
          </p>
        </div>
        <div className="info-header-actions">
          <button
            type="button"
            className={`btn ${isolate ? 'btn-active' : ''}`}
            onClick={toggleIsolate}
            aria-pressed={isolate}
          >
            {isolate ? 'Show all' : 'Isolate'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Close details"
            onClick={() => select(null)}
          >
            ✕
          </button>
        </div>
      </div>

      <p className="info-description">{structure.description}</p>

      <List title="Main functions" items={structure.functions} />
      <List title="Origin" items={structure.origin} />
      <List title="Insertion" items={structure.insertion} />
      <List title="Innervation" items={structure.innervation} />
      <List title="Everyday examples" items={structure.everydayExamples} />

      <AnimationControls structure={structure} />

      <Related title="Opposing muscles" ids={structure.antagonistIds} />
      <Related
        title="Related structures"
        ids={structure.relatedStructureIds.filter(
          (id) => !structure.antagonistIds.includes(id),
        )}
      />

      {structure.sources.length > 0 && (
        <div className="info-block">
          <h3>Sources</h3>
          <ul>
            {structure.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.title}
                </a>
                {src.licence ? ` — ${src.licence}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
