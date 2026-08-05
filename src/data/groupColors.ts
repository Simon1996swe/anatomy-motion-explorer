/**
 * Colour assignments for the whole-body context models.
 *
 * Keys match the mesh names produced by scripts/build_muscle_groups.py.
 * Hues are spread widely so adjacent groups never blend into one red mass,
 * while staying in a muted, clinical range rather than a bright rainbow.
 * Labels are shown in the legend so colour is never the only way to identify
 * a group (accessibility requirement).
 */

export type GroupInfo = { key: string; label: string; color: string };

export const MUSCLE_GROUPS: GroupInfo[] = [
  { key: 'trapezius', label: 'Trapezius', color: '#c0392b' },
  { key: 'deltoid', label: 'Deltoid', color: '#e8833a' },
  { key: 'pectoralis_major', label: 'Pectoralis major', color: '#d94f70' },
  { key: 'latissimus_dorsi', label: 'Latissimus dorsi', color: '#8e44ad' },
  { key: 'teres_major', label: 'Teres major', color: '#a569bd' },
  { key: 'infraspinatus', label: 'Infraspinatus', color: '#5b6cb0' },
  { key: 'sternocleidomastoid', label: 'Sternocleidomastoid', color: '#e05a47' },
  { key: 'rectus_abdominis', label: 'Rectus abdominis', color: '#e0a33a' },
  { key: 'external_oblique', label: 'External oblique', color: '#b5a642' },
  { key: 'biceps_brachii', label: 'Biceps brachii (left)', color: '#cf4436' },
  { key: 'triceps_brachii', label: 'Triceps brachii (left)', color: '#8d6e5c' },
  { key: 'brachioradialis', label: 'Brachioradialis', color: '#d98a3d' },
  { key: 'gluteus_maximus', label: 'Gluteus maximus', color: '#7e57a0' },
  { key: 'gluteus_medius', label: 'Gluteus medius', color: '#9b7bb8' },
  { key: 'quadriceps', label: 'Quadriceps', color: '#3f9aa8' },
  { key: 'hamstrings', label: 'Hamstrings', color: '#2f8b7a' },
  { key: 'sartorius', label: 'Sartorius', color: '#5aa457' },
  { key: 'gastrocnemius', label: 'Gastrocnemius', color: '#4a86c4' },
  { key: 'soleus', label: 'Soleus', color: '#6fa8d4' },
  { key: 'tibialis_anterior', label: 'Tibialis anterior', color: '#7d8fa0' },
];

export const FASCIA_GROUPS: GroupInfo[] = [
  { key: 'iliotibial_tract', label: 'Iliotibial tract', color: '#e8e0c8' },
  {
    key: 'interosseous_membrane_forearm',
    label: 'Interosseous membrane (forearm)',
    color: '#d8d2bd',
  },
  {
    key: 'interosseous_membrane_leg',
    label: 'Interosseous membrane (leg)',
    color: '#cfc9b4',
  },
  { key: 'flexor_retinaculum_wrist', label: 'Flexor retinaculum (wrist)', color: '#e2dcc6' },
  { key: 'linea_alba', label: 'Linea alba', color: '#efe9d5' },
  { key: 'epicranial_aponeurosis', label: 'Epicranial aponeurosis', color: '#ddd7c2' },
];

function toMap(groups: GroupInfo[]): Record<string, string> {
  return Object.fromEntries(groups.map((g) => [g.key, g.color]));
}

export const MUSCLE_COLORS = toMap(MUSCLE_GROUPS);
export const FASCIA_COLORS = toMap(FASCIA_GROUPS);
