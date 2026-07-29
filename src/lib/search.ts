import type { AnatomicalStructure } from '../types/anatomy';

/** Normalise for accent- and case-insensitive matching. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export type SearchResult = {
  structure: AnatomicalStructure;
  /** Lower is better. */
  score: number;
};

/**
 * Search structures by English name, Latin name or alias.
 * Works with partial queries in either language.
 */
export function searchStructures(
  structures: AnatomicalStructure[],
  rawQuery: string,
): SearchResult[] {
  const query = normalise(rawQuery);
  if (!query) return [];

  const results: SearchResult[] = [];

  for (const structure of structures) {
    const haystacks: Array<{ value: string; weight: number }> = [
      { value: structure.englishName, weight: 0 },
      { value: structure.latinName, weight: 1 },
      ...structure.aliases.map((a) => ({ value: a, weight: 2 })),
    ];

    let best = Infinity;
    for (const { value, weight } of haystacks) {
      const candidate = normalise(value);
      if (candidate === query) {
        best = Math.min(best, weight);
      } else if (candidate.startsWith(query)) {
        best = Math.min(best, weight + 3);
      } else if (candidate.includes(query)) {
        best = Math.min(best, weight + 6);
      }
    }

    if (best !== Infinity) {
      results.push({ structure, score: best });
    }
  }

  return results.sort(
    (a, b) => a.score - b.score || a.structure.englishName.localeCompare(b.structure.englishName),
  );
}
