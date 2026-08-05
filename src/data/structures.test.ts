import { describe, it, expect } from 'vitest';
import { structures, nodeNameToStructureId } from './structures';
import { MUSCLE_GROUPS, FASCIA_GROUPS } from './groupColors';

describe('anatomical content', () => {
  it('has unique ids', () => {
    const ids = structures.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every mesh in the muscle model resolves to a structure', () => {
    for (const { key } of MUSCLE_GROUPS) {
      expect(nodeNameToStructureId[key], `no structure for mesh "${key}"`).toBeDefined();
    }
  });

  it('every mesh in the fascia model resolves to a structure', () => {
    for (const { key } of FASCIA_GROUPS) {
      expect(nodeNameToStructureId[key], `no structure for mesh "${key}"`).toBeDefined();
    }
  });

  it('maps both arms of the biceps to the same structure', () => {
    expect(nodeNameToStructureId['muscle_biceps']).toBe('biceps-brachii');
    expect(nodeNameToStructureId['biceps_brachii']).toBe('biceps-brachii');
  });

  it('references only structures that exist', () => {
    const ids = new Set(structures.map((s) => s.id));
    for (const s of structures) {
      for (const ref of [...s.relatedStructureIds, ...s.antagonistIds]) {
        expect(ids.has(ref), `${s.id} references missing "${ref}"`).toBe(true);
      }
    }
  });

  it('gives every structure a Latin name and a source', () => {
    for (const s of structures) {
      expect(s.latinName.length, s.id).toBeGreaterThan(0);
      expect(s.sources.length, s.id).toBeGreaterThan(0);
    }
  });

  it('keeps antagonist pairs symmetrical where both are modelled', () => {
    const byId = new Map(structures.map((s) => [s.id, s]));
    for (const s of structures) {
      for (const a of s.antagonistIds) {
        const other = byId.get(a);
        if (other && other.antagonistIds.length > 0) {
          expect(
            other.antagonistIds.includes(s.id),
            `${s.id} lists ${a} as antagonist but not vice versa`,
          ).toBe(true);
        }
      }
    }
  });
});
