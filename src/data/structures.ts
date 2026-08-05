import type { AnatomicalStructure, AnimationClip } from '../types/anatomy';
import { bodyStructures } from './bodyStructures';

/**
 * MVP content: the elbow prototype.
 * Only structures needed to demonstrate selection, information display and
 * elbow flexion / extension are included. Every entry records its sources so
 * anatomical claims stay reviewable.
 *
 * All content below is original prose written for this project, summarising
 * widely established, non-copyrightable anatomical facts. No text was copied
 * from any commercial product.
 */

const wikiElbow = {
  title: 'Elbow — anatomy overview',
  url: 'https://en.wikipedia.org/wiki/Elbow',
  licence: 'CC BY-SA 4.0',
  accessedAt: '2026-07-29',
};

const armStructures: AnatomicalStructure[] = [
  {
    id: 'biceps-brachii',
    englishName: 'Biceps brachii',
    latinName: 'Musculus biceps brachii',
    aliases: ['biceps', 'bicep'],
    category: 'muscle',
    region: 'Upper arm (anterior compartment)',
    description:
      'A two-headed muscle on the front of the upper arm. It crosses both the shoulder and elbow joints and is the strongest supinator of the forearm when the elbow is flexed.',
    functions: ['Elbow flexion', 'Forearm supination', 'Weak shoulder flexion'],
    origin: [
      'Long head: supraglenoid tubercle of the scapula',
      'Short head: coracoid process of the scapula',
    ],
    insertion: ['Radial tuberosity of the radius', 'Bicipital aponeurosis into forearm fascia'],
    innervation: ['Musculocutaneous nerve (C5–C6)'],
    movements: ['elbow-flexion', 'forearm-supination'],
    everydayExamples: [
      'Bending the elbow to lift a mug of coffee toward your chest',
      'Turning a doorknob or a screwdriver (supination)',
    ],
    relatedStructureIds: ['triceps-brachii', 'humerus', 'radius', 'brachioradialis'],
    antagonistIds: ['triceps-brachii'],
    // Right arm mesh (arm.glb) and left arm mesh (muscles.glb).
    modelNodeNames: ['muscle_biceps', 'biceps_brachii'],
    animationIds: ['elbow-flexion'],
    sources: [
      {
        title: 'Biceps brachii muscle',
        url: 'https://en.wikipedia.org/wiki/Biceps',
        licence: 'CC BY-SA 4.0',
        accessedAt: '2026-07-29',
      },
    ],
    reviewed: false,
  },
  {
    id: 'triceps-brachii',
    englishName: 'Triceps brachii',
    latinName: 'Musculus triceps brachii',
    aliases: ['triceps', 'tricep'],
    category: 'muscle',
    region: 'Upper arm (posterior compartment)',
    description:
      'A three-headed muscle on the back of the upper arm. It is the main extensor of the elbow and the direct antagonist of the biceps brachii.',
    functions: ['Elbow extension', 'Long head assists shoulder extension and adduction'],
    origin: [
      'Long head: infraglenoid tubercle of the scapula',
      'Lateral head: posterior humerus above the radial groove',
      'Medial head: posterior humerus below the radial groove',
    ],
    insertion: ['Olecranon process of the ulna'],
    innervation: ['Radial nerve (C6–C8)'],
    movements: ['elbow-extension'],
    everydayExamples: [
      'Straightening the arm to push a door open',
      'Pushing yourself up from a chair',
    ],
    relatedStructureIds: ['biceps-brachii', 'humerus', 'ulna', 'deltoid'],
    antagonistIds: ['biceps-brachii', 'brachioradialis'],
    // Right arm mesh (arm.glb) and left arm mesh (muscles.glb).
    modelNodeNames: ['muscle_triceps', 'triceps_brachii'],
    animationIds: ['elbow-extension'],
    sources: [
      {
        title: 'Triceps brachii muscle',
        url: 'https://en.wikipedia.org/wiki/Triceps',
        licence: 'CC BY-SA 4.0',
        accessedAt: '2026-07-29',
      },
    ],
    reviewed: false,
  },
  {
    id: 'humerus',
    englishName: 'Humerus',
    latinName: 'Os humeri',
    aliases: ['upper arm bone'],
    category: 'bone',
    region: 'Upper arm',
    description:
      'The single long bone of the upper arm, running from the shoulder to the elbow. It provides attachment for the biceps and triceps and forms the upper half of the elbow joint.',
    functions: ['Structural support of the upper arm', 'Attachment site for arm muscles'],
    movements: [],
    everydayExamples: ['Acts as the lever the arm muscles pull on when you lift something'],
    relatedStructureIds: ['radius', 'ulna', 'biceps-brachii', 'triceps-brachii'],
    antagonistIds: [],
    modelNodeNames: ['bone_humerus'],
    animationIds: [],
    sources: [wikiElbow],
    reviewed: false,
  },
  {
    id: 'radius',
    englishName: 'Radius',
    latinName: 'Radius',
    aliases: ['forearm bone (thumb side)'],
    category: 'bone',
    region: 'Forearm (lateral)',
    description:
      'The lateral (thumb-side) bone of the forearm. It rotates around the ulna to produce supination and pronation and receives the tendon of the biceps brachii.',
    functions: ['Forms the lower forearm', 'Rotates to turn the palm up or down'],
    movements: [],
    everydayExamples: ['Rotates when you turn your palm to face up or down'],
    relatedStructureIds: ['humerus', 'ulna', 'biceps-brachii'],
    antagonistIds: [],
    modelNodeNames: ['bone_radius'],
    animationIds: [],
    sources: [wikiElbow],
    reviewed: false,
  },
  {
    id: 'ulna',
    englishName: 'Ulna',
    latinName: 'Ulna',
    aliases: ['forearm bone (little-finger side)'],
    category: 'bone',
    region: 'Forearm (medial)',
    description:
      'The medial (little-finger side) bone of the forearm. Its olecranon process forms the point of the elbow and is the insertion point of the triceps brachii.',
    functions: ['Forms the hinge of the elbow joint', 'Attachment for the triceps'],
    movements: [],
    everydayExamples: ['Forms the bony point you feel when you rest on your elbow'],
    relatedStructureIds: ['humerus', 'radius', 'triceps-brachii'],
    antagonistIds: [],
    modelNodeNames: ['bone_ulna'],
    animationIds: [],
    sources: [wikiElbow],
    reviewed: false,
  },
];

/** All structures: the detailed arm plus the whole-body groups. */
export const structures: AnatomicalStructure[] = [...armStructures, ...bodyStructures];

/** Maps a 3D mesh/node name to the structure id it represents. */
export const nodeNameToStructureId: Record<string, string> = Object.fromEntries(
  structures.flatMap((s) => s.modelNodeNames.map((n) => [n, s.id])),
);

export const animations: AnimationClip[] = [
  {
    id: 'elbow-flexion',
    englishName: 'Elbow flexion',
    latinName: 'Flexio cubiti',
    textAlternative:
      'The forearm swings upward toward the shoulder, reducing the angle at the elbow. The biceps brachii shortens (contracts) while the triceps brachii lengthens.',
    agonistIds: ['biceps-brachii'],
    antagonistIds: ['triceps-brachii'],
  },
  {
    id: 'elbow-extension',
    englishName: 'Elbow extension',
    latinName: 'Extensio cubiti',
    textAlternative:
      'The forearm swings downward away from the shoulder, opening the angle at the elbow toward straight. The triceps brachii shortens (contracts) while the biceps brachii lengthens.',
    agonistIds: ['triceps-brachii'],
    antagonistIds: ['biceps-brachii'],
  },
];

export const DISCLAIMER =
  'This application provides general educational information about human anatomy. It is not medical advice, a diagnostic tool, or a replacement for guidance from a qualified healthcare professional.';
