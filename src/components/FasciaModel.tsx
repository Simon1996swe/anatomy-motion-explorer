import { useGLTF } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { GroupedSystemModel } from './GroupedSystemModel';
import { FASCIA_COLORS } from '../data/groupColors';

/**
 * Fascial / connective-tissue structures (BodyParts3D, CC BY-SA 2.1 JP):
 * iliotibial tract, interosseous membranes, flexor retinaculum, linea alba and
 * the epicranial aponeurosis. Rendered as pale, slightly translucent sheets and
 * double-sided, since fascia is thin and often viewed edge-on.
 *
 * Note: BodyParts3D has no surface mesh for fascia lata itself, so the broad
 * limb-wrapping fascia sheets are not represented.
 */
const MODEL_URL = `${import.meta.env.BASE_URL}models/fascia.glb`;

useGLTF.preload(MODEL_URL);

export function FasciaModel() {
  const showFascia = useStore((s) => s.layers.fascia);
  if (!showFascia) return null;
  return (
    <GroupedSystemModel
      url={MODEL_URL}
      colors={FASCIA_COLORS}
      fallbackColor="#e2dcc6"
      opacity={0.85}
    />
  );
}
