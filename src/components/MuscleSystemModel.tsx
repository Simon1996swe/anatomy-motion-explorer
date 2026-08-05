import { useGLTF } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { GroupedSystemModel } from './GroupedSystemModel';
import { MUSCLE_COLORS } from '../data/groupColors';

/**
 * Major muscle groups (BodyParts3D, CC BY-SA 2.1 JP), built in the shared
 * upright frame by scripts/build_muscle_groups.py. Each group is a separately
 * named mesh so it gets its own colour; the selectable/animated right biceps
 * and triceps come from ArmModelGLB and are excluded here to avoid overlap.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/muscles.glb`;

useGLTF.preload(MODEL_URL);

export function MuscleSystemModel() {
  const showMuscle = useStore((s) => s.layers.muscle);
  if (!showMuscle) return null;
  return (
    <GroupedSystemModel
      url={MODEL_URL}
      colors={MUSCLE_COLORS}
      fallbackColor="#b23a2e"
    />
  );
}
