import type { CSSProperties, PointerEvent } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { BIG_IDS, showcaseGame, type BigId } from '../showcase';

interface Props {
  thumbs: Partial<Record<BigId, string>>;
  onOpen: (id: BigId) => void;
}

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function tilt(e: PointerEvent<HTMLButtonElement>) {
  if (reduce()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--ry', `${x * 14}deg`);
  el.style.setProperty('--rx', `${-y * 12}deg`);
}

function untilt(e: PointerEvent<HTMLButtonElement>) {
  e.currentTarget.style.setProperty('--ry', '0deg');
  e.currentTarget.style.setProperty('--rx', '0deg');
}

/** Полка «Самые яркие миры»: картинки снимаются из той же 3D-сцены, карточки наклоняются за курсором. */
export function WorldShelf({ thumbs, onOpen }: Props) {
  const { t, locale } = useI18n();
  return (
    <section className="wl-block" id="worlds">
      <div className="wl-wrap">
        <div className="wl-section-head">
          <h2>{t.shelf.title}</h2>
          <p>{t.shelf.text}</p>
        </div>
        <div className="wl-shelf">
          {BIG_IDS.map((id) => {
            const g = showcaseGame(id, locale);
            return (
              <button
                key={id}
                type="button"
                className="wl-card"
                style={{ '--c': g.color } as CSSProperties}
                onPointerMove={tilt}
                onPointerLeave={untilt}
                onClick={() => onOpen(id)}
              >
                <div className="wl-thumb">
                  {thumbs[id] ? <img src={thumbs[id]} alt="" /> : <span className="wl-thumb-icon" aria-hidden="true">{g.icon}</span>}
                  <span className="wl-badge">{g.kind}</span>
                  <span className="wl-age">{g.ages}</span>
                </div>
                <div className="wl-card-body">
                  <h3>
                    <span aria-hidden="true">{g.icon}</span>
                    {g.title}
                  </h3>
                  <p>{g.card}</p>
                  <span className="wl-go">{t.shelf.open}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
