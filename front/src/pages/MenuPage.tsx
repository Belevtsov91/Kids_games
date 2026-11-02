import { Link } from 'react-router';
import { games } from '@/games/registry';

export function MenuPage() {
  return (
    <main className="menu">
      <h1>Во что поиграем?</h1>
      <div className="menu-grid">
        {games.map((game) => (
          <Link key={game.id} to={`/play/${game.id}`} className="menu-card">
            <span className="menu-card-emoji">{game.emoji}</span>
            <span>{game.title}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
