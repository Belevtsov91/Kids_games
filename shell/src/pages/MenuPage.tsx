import { Link } from 'react-router';
import type { GameManifest } from '@ig/sdk';
import { games } from '@/catalog/catalog';
import { useAuth } from '@/auth/AuthContext';

function GameCard({ game }: { game: GameManifest }) {
  return (
    <Link to={`/play/${game.id}`} className="menu-card" aria-label={game.title}>
      <span className="menu-card-emoji">{game.emoji}</span>
      <span>{game.title}</span>
    </Link>
  );
}

/**
 * Дашборд: сверху игры, подходящие по возрасту выбранному ребёнку, ниже — все остальные.
 * Прятать игры совсем нельзя: в каталоге 10 игр, а ребёнку 13–15 лет по возрасту подходят только 4.
 */
export function MenuPage() {
  const { activeChild, logout } = useAuth();
  const age = activeChild?.age;
  const fits = (g: GameManifest) => age === undefined || (g.ages.min <= age && age <= g.ages.max);
  const available = games.filter(fits);
  const others = games.filter((g) => !fits(g));

  return (
    <main className="menu">
      <header className="topbar">
        <Link to="/children" className="topbar-child" aria-label="Сменить профиль">
          <span className="topbar-avatar">{activeChild?.avatar}</span>
          {activeChild?.name}
        </Link>
        <button className="btn btn-small" onClick={() => void logout()}>
          Выйти
        </button>
      </header>
      <h1>Во что поиграем?</h1>
      {available.length === 0 && <p>Для этого возраста игр пока нет, скоро появятся!</p>}
      <div className="menu-grid" data-testid="menu-fits">
        {available.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {others.length > 0 && (
        <section className="menu-others" aria-label="Другие игры">
          <h2>Другие игры</h2>
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
