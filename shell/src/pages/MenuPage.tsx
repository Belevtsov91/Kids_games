import { Link } from 'react-router';
import type { GameManifest } from '@ig/sdk';
import { games } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { useAuth } from '@/auth/AuthContext';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { ageRange } from '@/i18n/plural';

function GameCard({ game }: { game: GameManifest }) {
  const { locale } = useI18n();
  const title = gameTitle(game, locale);
  return (
    <Link to={`/play/${game.id}`} className="menu-card" aria-label={title}>
      {covers[game.id] ? <img className="menu-card-art" src={covers[game.id]} alt="" loading="lazy" decoding="async" width="960" height="640" /> : <span className="menu-card-emoji">{game.emoji}</span>}
      <span className="menu-card-caption"><strong>{title}</strong><small>{ageRange(locale, game.ages.min, game.ages.max)} <span aria-hidden="true">↗</span></small></span>
    </Link>
  );
}

/**
 * Дашборд: сверху игры, подходящие по возрасту выбранному ребёнку, ниже — все остальные.
 * Прятать игры совсем нельзя: в каталоге 10 игр, а ребёнку 13–15 лет по возрасту подходят только 4.
 */
export function MenuPage() {
  const { activeChild, logout } = useAuth();
  const { t } = useI18n();
  const age = activeChild?.age;
  const fits = (g: GameManifest) => age === undefined || (g.ages.min <= age && age <= g.ages.max);
  const available = games.filter(fits);
  const others = games.filter((g) => !fits(g));

  return (
    <main className="menu">
      <header className="topbar">
        <Link to="/children" className="topbar-child" aria-label={t.menu.changeProfile}>
          <span className="topbar-avatar">{activeChild?.avatar}</span>
          {activeChild?.name}
        </Link>
        <button className="btn btn-small" onClick={() => void logout()}>
          {t.common.logout}
        </button>
      </header>
      <h1>{t.menu.title}</h1>
      {available.length === 0 && <p>{t.menu.empty}</p>}
      <div className="menu-grid" data-testid="menu-fits">
        {available.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {others.length > 0 && (
        <section className="menu-others" aria-label={t.menu.others}>
          <h2>{t.menu.others}</h2>
          <div className="menu-grid" data-testid="menu-others">
            {others.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
