import { useState, type CSSProperties } from 'react';
import { games } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { isNewGame } from '@/catalog/subjects';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { ageRange, gameCount } from '@/i18n/plural';
import { GameLink } from '@/info/components/GameLink';
import { BIG_IDS } from '../showcase';

/** Возрасты для быстрого фильтра: «покажи, что подойдёт моему ребёнку». */
const AGES = [3, 5, 7, 10] as const;

/** Все остальные игры каталога настоящими обложками, с фильтром по возрасту и подборкой «Новые». Большие миры — на полке выше. */
export function MoreGames() {
  const { t, locale } = useI18n();
  const [age, setAge] = useState<number | 'new' | null>(null);
  const rest = games.filter((g) => !(BIG_IDS as readonly string[]).includes(g.id));
  const fresh = rest.filter((g) => isNewGame(g));
  const shown = age === null ? rest : age === 'new' ? fresh : rest.filter((g) => g.ages.min <= age && g.ages.max >= age);
  return (
    <section className="wl-block">
      <div className="wl-wrap">
        <div className="wl-section-head">
          <h2>
            {t.more.title} {gameCount(locale, rest.length)}
          </h2>
          <p>{t.more.text}</p>
        </div>
        <div className="wl-ages" role="group" aria-label={t.more.text}>
          <button type="button" className={age === null ? 'is-on' : ''} aria-pressed={age === null} onClick={() => setAge(null)}>
            {t.more.all}
          </button>
          {fresh.length > 0 && (
            <button type="button" className={age === 'new' ? 'is-on' : ''} aria-pressed={age === 'new'} onClick={() => setAge('new')}>
              {t.menu.filter.new}
            </button>
          )}
          {AGES.map((a) => (
            <button key={a} type="button" className={age === a ? 'is-on' : ''} aria-pressed={age === a} onClick={() => setAge(a)}>
              {t.more.ageFrom(a)}
            </button>
          ))}
        </div>
        <ul className="wl-minis">
          {shown.map((g, i) => (
            <li key={g.id} className="wl-mini" style={{ '--c': g.color ?? '#ffd25a', '--i': i } as CSSProperties}>
              <GameLink gameId={g.id} className="wl-mini-link">
                <span className="wl-mini-cover">
                  {covers[g.id] ? <img src={covers[g.id]} alt="" loading="lazy" decoding="async" /> : <span aria-hidden="true">{g.emoji}</span>}
                </span>
                <b>{gameTitle(g, locale)}</b>
                {isNewGame(g) && <i className="wl-mini-new">✨ {t.menu.isNew}</i>}
                <span>{ageRange(locale, g.ages.min, g.ages.max)}</span>
              </GameLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
