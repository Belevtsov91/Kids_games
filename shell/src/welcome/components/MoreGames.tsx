import type { CSSProperties } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { SMALL_IDS, showcaseGame } from '../showcase';

/** Остальные игры плитками: на главной они летают маленькими игрушками вокруг островов. */
export function MoreGames() {
  const { t, locale } = useI18n();
  return (
    <section className="wl-block">
      <div className="wl-wrap">
        <div className="wl-section-head">
          <h2>{t.more.title}</h2>
          <p>{t.more.text}</p>
        </div>
        <div className="wl-minis">
          {SMALL_IDS.map((id) => {
            const g = showcaseGame(id, locale);
            return (
              <div key={id} className="wl-mini" style={{ '--c': g.color } as CSSProperties}>
                <div className="wl-mini-icon" aria-hidden="true">{g.icon}</div>
                <b>{g.title}</b>
                <span>{g.ages}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
