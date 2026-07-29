import { describe, it, expect } from 'vitest';
import { searchStructures } from './search';
import { structures } from '../data/structures';

describe('searchStructures', () => {
  it('finds a muscle by its English name', () => {
    const results = searchStructures(structures, 'biceps');
    expect(results[0].structure.id).toBe('biceps-brachii');
  });

  it('finds a muscle by its Latin name', () => {
    const results = searchStructures(structures, 'triceps brachii');
    expect(results.map((r) => r.structure.id)).toContain('triceps-brachii');
  });

  it('matches Latin-only queries', () => {
    const results = searchStructures(structures, 'os humeri');
    expect(results[0].structure.id).toBe('humerus');
  });

  it('is case- and accent-insensitive and supports partial queries', () => {
    const results = searchStructures(structures, 'TRICE');
    expect(results[0].structure.id).toBe('triceps-brachii');
  });

  it('finds structures via aliases', () => {
    const results = searchStructures(structures, 'bicep');
    expect(results[0].structure.id).toBe('biceps-brachii');
  });

  it('returns nothing for an empty query', () => {
    expect(searchStructures(structures, '   ')).toHaveLength(0);
  });

  it('returns nothing for an unknown term', () => {
    expect(searchStructures(structures, 'zzzzz')).toHaveLength(0);
  });
});
