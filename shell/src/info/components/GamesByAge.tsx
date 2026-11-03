import type { CSSProperties } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { ALL_IDS, showcaseGame } from '@/welcome/showcase';
import { GameLink } from './GameLink';

/** Список игр для страницы «Родителям»: возраст, 2D/3D и чему учит, на языке сайта. */
export function GamesByAge() {
  const { locale } = useI18n();
  return (
    <div className="info-games">
      {ALL_IDS.map((id) => {
        const g = showcaseGame(id, locale);
        return (
          <GameLink key={id} gameId={id} className="info-game">
            <span className="info-game-icon" style={{ '--c': g.color } as CSSProperties} aria-hidden="true">{g.icon}</span>
            <span className="info-game-text">
              <b>{g.title}</b>
              <span>{g.ages} · {g.kind}</span>
              <span>{g.benefit}</span>
            </span>
          </GameLink>
        );
      })}
    </div>
  );
}
