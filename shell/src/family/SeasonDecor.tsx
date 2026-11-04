import { useMemo } from 'react';
import { decorOf, PARTICLES } from './season';

/** Сезонное оформление поверх неба дашборда: падающие снежинки, лепестки или листья, к Новому году гирлянда. */
export function SeasonDecor({ calm }: { calm: boolean }) {
  const decor = decorOf(new Date());
  const flakes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        char: PARTICLES[decor][i % PARTICLES[decor].length],
        left: (i * 61) % 100,
        delay: -((i * 37) % 120) / 10,
        duration: 9 + ((i * 7) % 8),
        size: 14 + ((i * 11) % 14),
      })),
    [decor],
  );
  return (
    <div className={`season season-${decor}${calm ? ' season-calm' : ''}`} aria-hidden="true">
      {decor === 'newyear' && (
        <div className="season-garland">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 3) * 0.5}s` }} />
          ))}
        </div>
      )}
      {!calm &&
        flakes.map((f, i) => (
          <span
            key={i}
            className="season-flake"
            style={{ left: `${f.left}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s`, fontSize: f.size }}
          >
            {f.char}
          </span>
        ))}
    </div>
  );
}
