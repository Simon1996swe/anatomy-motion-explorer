import { animations, structures } from '../data/structures';
import { useStore } from '../store/useStore';
import type { AnatomicalStructure } from '../types/anatomy';

function nameFor(id: string, lang: 'en' | 'la'): string {
  const s = structures.find((x) => x.id === id);
  if (!s) return id;
  return lang === 'en' ? s.englishName : s.latinName;
}

type Props = { structure: AnatomicalStructure };

/**
 * Play / pause / restart controls for the movements a structure is involved in.
 * A text alternative describes each movement for users who cannot see or have
 * disabled the animation.
 */
export function AnimationControls({ structure }: Props) {
  const language = useStore((s) => s.language);
  const isPlaying = useStore((s) => s.isPlaying);
  const activeAnimationId = useStore((s) => s.activeAnimationId);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const playAnimation = useStore((s) => s.playAnimation);
  const pause = useStore((s) => s.pause);
  const restart = useStore((s) => s.restart);
  const setElbowAngle = useStore((s) => s.setElbowAngle);
  const elbowAngle = useStore((s) => s.elbowAngle);

  // Movements this structure participates in, as agonist or antagonist.
  const relevant = animations.filter(
    (a) => a.agonistIds.includes(structure.id) || a.antagonistIds.includes(structure.id),
  );
  if (relevant.length === 0) return null;

  const active = animations.find((a) => a.id === activeAnimationId) ?? null;

  return (
    <section className="animation-controls" aria-label="Movement animation">
      <h3>Movements</h3>
      <div className="anim-buttons">
        {relevant.map((clip) => (
          <button
            key={clip.id}
            type="button"
            className={`btn ${activeAnimationId === clip.id ? 'btn-active' : ''}`}
            onClick={() => playAnimation(clip.id)}
          >
            ▶ {language === 'en' ? clip.englishName : clip.latinName}
          </button>
        ))}
      </div>

      {active && (
        <>
          <div className="anim-transport">
            <button
              type="button"
              className="btn"
              onClick={() => (isPlaying ? pause() : playAnimation(active.id))}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn" onClick={restart}>
              Restart
            </button>
            <label className="scrub">
              <span className="visually-hidden">Movement position</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={elbowAngle}
                onChange={(e) => {
                  pause();
                  setElbowAngle(Number(e.target.value));
                }}
              />
            </label>
          </div>

          <p className="anim-text-alt">
            <strong>{language === 'en' ? active.englishName : active.latinName}:</strong>{' '}
            {active.textAlternative}
          </p>
          <p className="anim-roles">
            Agonist (prime mover): {active.agonistIds.map((id) => nameFor(id, language)).join(', ')}.{' '}
            Antagonist (opposing): {active.antagonistIds.map((id) => nameFor(id, language)).join(', ')}.
          </p>
          {reducedMotion && (
            <p className="anim-reduced">
              Reduced motion is on: the movement jumps to its end position instead of animating.
            </p>
          )}
        </>
      )}
    </section>
  );
}
