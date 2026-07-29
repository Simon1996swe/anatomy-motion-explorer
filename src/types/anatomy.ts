/**
 * Anatomical content model.
 * Content is deliberately kept separate from rendering code so that the
 * data files can be reviewed, edited and version-controlled independently.
 */

export type StructureCategory = 'skin' | 'muscle' | 'bone' | 'nerve' | 'fascia';

export type ContentSource = {
  title: string;
  url: string;
  author?: string;
  licence?: string;
  /** ISO-8601 date the source was accessed. */
  accessedAt: string;
};

export type AnatomicalStructure = {
  /** Stable ID, independent of English/Latin display names. */
  id: string;
  englishName: string;
  latinName: string;
  aliases: string[];
  category: StructureCategory;
  region: string;
  description: string;
  functions: string[];
  origin?: string[];
  insertion?: string[];
  innervation?: string[];
  movements: string[];
  everydayExamples: string[];
  relatedStructureIds: string[];
  antagonistIds: string[];
  /** Names of nodes/meshes in the 3D scene this structure maps to. */
  modelNodeNames: string[];
  animationIds: string[];
  sources: ContentSource[];
  reviewed: boolean;
};

/** A named movement the viewer can animate. */
export type AnimationClip = {
  id: string;
  englishName: string;
  latinName: string;
  /** Text alternative describing the movement for non-visual users. */
  textAlternative: string;
  /** Structure IDs primarily responsible for this movement (agonists). */
  agonistIds: string[];
  /** Structure IDs producing the opposite movement (antagonists). */
  antagonistIds: string[];
};
