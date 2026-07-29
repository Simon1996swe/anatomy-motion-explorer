import { useMemo, useState, useId } from 'react';
import { structures } from '../data/structures';
import { searchStructures } from '../lib/search';
import { useStore } from '../store/useStore';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const select = useStore((s) => s.select);
  const language = useStore((s) => s.language);
  const listId = useId();

  const results = useMemo(() => searchStructures(structures, query), [query]);

  return (
    <div className="search">
      <label htmlFor={`${listId}-input`} className="visually-hidden">
        Search structures (English or Latin)
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        className="search-input"
        placeholder="Search (English or Latin)…"
        value={query}
        autoComplete="off"
        aria-controls={`${listId}-results`}
        aria-expanded={results.length > 0}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <ul id={`${listId}-results`} className="search-results" role="listbox">
          {results.length === 0 && (
            <li className="search-empty" role="option" aria-selected={false}>
              No structures found for “{query}”.
            </li>
          )}
          {results.map(({ structure }) => (
            <li key={structure.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="search-result"
                onClick={() => {
                  select(structure.id);
                  setQuery('');
                }}
              >
                <span className="result-primary">
                  {language === 'en' ? structure.englishName : structure.latinName}
                </span>
                <span className="result-secondary">
                  {language === 'en' ? structure.latinName : structure.englishName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
