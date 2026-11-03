import type { CSSProperties } from 'react';
import { GameLink } from '@/info/components/GameLink';
import type { ShowcaseGame } from '../showcase';

interface Props {
  game: ShowcaseGame | null;
  onClose: () => void;
}

/** Карточка выбранной игры: справа от острова на компьютере, шторкой снизу на телефоне. */
export function GamePanel({ game, onClose }: Props) {
  return (
    <aside
      className="wl-panel"
      aria-live="polite"
      aria-hidden={!game}
      style={{ '--c': game?.color ?? '#ffd25a' } as CSSProperties}
    >
      {game && (
        <>
          <button type="button" className="wl-panel-close" onClick={onClose} aria-label="Назад ко всем мирам">
            ✕
          </button>
          <div className="wl-panel-top">
            <div className="wl-panel-icon" aria-hidden="true">{game.icon}</div>
            <div>
              <h3>{game.title}</h3>
              <div className="wl-chips">
                <span className="wl-chip is-kind">{game.kind}</span>
                <span className="wl-chip">{game.ages}</span>
                {game.tags.map((t) => (
                  <span key={t} className="wl-chip">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <p>{game.text}</p>
          {game.shots && (
            <figure className="wl-shots">
              {game.shots.map((s) => (
                <img key={s.src} src={s.src} alt={s.alt} loading="lazy" />
              ))}
              <figcaption>Настоящие кадры из игры</figcaption>
            </figure>
          )}
          <div className="wl-panel-actions">
            <GameLink gameId={game.id} className="wl-btn wl-btn-primary wl-btn-sm">Играть</GameLink>
            <button type="button" className="wl-btn wl-btn-ghost wl-btn-sm" onClick={onClose}>
              Все миры
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
