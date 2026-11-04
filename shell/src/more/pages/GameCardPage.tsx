import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { findGame, games } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { useAuth } from '@/auth/AuthContext';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { SiteFooter } from '@/info/components/SiteFooter';
import { SiteTopbar } from '@/info/components/SiteTopbar';
import { useParentText } from '@/parent/text';
import { useMoreText } from '../text';

/** Открытая карточка игры (/games/:id) для родителей: возраст, что развивает, наклейки, как играть вместе. */
export function GameCardPage() {
  const { gameId } = useParams();
  const g = useMoreText().game;
  const skillNames = useParentText().skills.names;
  const { locale } = useI18n();
  const { me } = useAuth();
  const game = findGame(gameId);

  useEffect(() => {
    if (!game) return;
    const prev = document.title;
    document.title = `${gameTitle(game, locale)} · Interact Games`;
    return () => void (document.title = prev);
  }, [game, locale]);
  if (!game) return <Navigate to="/games" replace />;

  const about = game.abouts?.[locale] ?? game.about;
  // Совет «как играть вместе» из манифеста игры; если игра его не дала — общий.
  const together = game.togethers?.[locale] ?? game.together ?? g.togetherText;
  return (
    <main className="wl info more-page">
      <SiteTopbar />
      <section className="wl-wrap game-card">
        <img src={covers[game.id]} alt="" className="game-card-cover" width="220" height="220" />
        <div>
          <span className="info-eyebrow">{g.eyebrow} · {g.kind[game.kind]} · {g.ages(game.ages.min, game.ages.max)}</span>
          <h1>{game.emoji} {gameTitle(game, locale)}</h1>
          {about && <p className="game-card-about">{about}</p>}
          {game.skills?.length ? (
            <>
              <h2>{g.skills}</h2>
              <ul className="game-card-skills">{game.skills.map((s) => <li key={s}>{skillNames[s] ?? s}</li>)}</ul>
            </>
          ) : null}
          {game.stickers?.length ? <p>{g.stickers(game.stickers.length)} {game.stickers.map((s) => s.emoji).join(' ')}</p> : null}
          <h2>{g.together}</h2>
          <p>{together}</p>
          <div className="more-actions">
            <Link to={me ? `/play/${game.id}` : '/register'} className="wl-btn wl-btn-primary">▶ {g.play}</Link>
            <Link to="/games" className="wl-btn wl-btn-ghost">{g.all}</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

/** Все игры списком (/games): для родителей и поисковиков. */
export function GamesPage() {
  const g = useMoreText().game;
  const { locale } = useI18n();
  const sorted = [...games].sort((a, b) => a.ages.min - b.ages.min);
  return (
    <main className="wl info more-page">
      <SiteTopbar />
      <section className="wl-wrap">
        <h1>{g.all}</h1>
        <ul className="games-list">
          {sorted.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${game.id}`}>
                <img src={covers[game.id]} alt="" width="96" height="96" loading="lazy" />
                <b>{gameTitle(game, locale)}</b>
                <small>{g.ages(game.ages.min, game.ages.max)} · {g.kind[game.kind]}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <SiteFooter />
    </main>
  );
}
