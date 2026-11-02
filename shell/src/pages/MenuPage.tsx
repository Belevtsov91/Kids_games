import { Link } from 'react-router';
import { games } from '@/catalog/catalog';
import { useAuth } from '@/auth/AuthContext';

/** Дашборд: игры, подходящие по возрасту выбранному ребёнку. */
export function MenuPage() {
  const { activeChild, logout } = useAuth();
  const age = activeChild?.age;
  const available = age === undefined ? games : games.filter((g) => g.ages.min <= age && age <= g.ages.max);

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
      <div className="menu-grid">
        {available.map((game) => (
          <Link key={game.id} to={`/play/${game.id}`} className="menu-card" aria-label={game.title}>
            <span className="menu-card-emoji">{game.emoji}</span>
            <span>{game.title}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
