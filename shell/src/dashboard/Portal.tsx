import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import type { GameManifest } from '@ig/sdk';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { ageRange } from '@/i18n/plural';
import { tilt } from './tilt';
import { worldColor, worldText } from './worlds';

const portalStyle = (game: GameManifest, delay = 0) => ({ '--c': worldColor(game), '--d': `${delay}s` }) as CSSProperties;

/** Окно в мир: обложка игры без изменений, наклон за курсором, блик, свечение цвета игры и тень на облаках. */
function PortalArt({ game, eager, children }: { game: GameManifest; eager?: boolean; children?: ReactNode }) {
  const { locale } = useI18n();
  const cover = covers[game.id];
  return (
    <span className="portal-float">
      <span className="portal-glow" />
      <span className="portal-body">
        <span className="portal-window">
          {cover ? <img src={cover} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width="960" height="640" /> : <span className="portal-emoji">{game.emoji}</span>}
          <span className="portal-sheen" />
        </span>
        <span className="portal-rim" />
        <span className="portal-badges">
          <span className="portal-badge is-kind">{game.kind.toUpperCase()}</span>
          <span className="portal-badge">{ageRange(locale, game.ages.min, game.ages.max)}</span>
        </span>
        {children}
      </span>
      <span className="portal-shadow" />
    </span>
  );
}

/** Карточка игры на полке: ссылка на /play/<id>, один тап — и игра запускается. */
export function GamePortal({ game, delay }: { game: GameManifest; delay?: number }) {
  const { locale, t } = useI18n();
  const title = gameTitle(game, locale);
  return (
    <Link to={`/play/${game.id}`} className="portal" aria-label={title} style={portalStyle(game, delay)} {...tilt(10)}>
      <PortalArt game={game} />
      <span className="portal-caption">
        <span className="portal-icon" aria-hidden="true">{game.emoji}</span>
        <span className="portal-text">
          <strong>{title}</strong>
          <small>{t.menu.kind[game.kind]} · {worldText(game, locale)}</small>
        </span>
        <span className="portal-go" aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

/** Большой портал на первом экране: последняя игра ребёнка (или первая подходящая) с кнопкой «Играть». */
export function FeaturedPortal({ game, label, onPlay }: { game: GameManifest; label: string; onPlay: () => void }) {
  const { locale } = useI18n();
  const title = gameTitle(game, locale);
  return (
    <button type="button" className="portal is-featured" aria-label={`${label}: ${title}`} style={portalStyle(game)} onClick={onPlay} {...tilt(7)}>
      <PortalArt game={game} eager>
        <span className="portal-continue">
          <span className="portal-continue-text">
            <small>{label}</small>
            <strong>{title}</strong>
          </span>
          <span className="portal-play" aria-hidden="true">▶</span>
        </span>
      </PortalArt>
    </button>
  );
}
