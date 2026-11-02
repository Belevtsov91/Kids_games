import { Link, useNavigate, useParams } from 'react-router';
import { findGame } from '@/catalog/catalog';
import { GameHost } from '@/host/GameHost';
import { useAuth } from '@/auth/AuthContext';

export function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { activeChild } = useAuth();
  const game = findGame(gameId);

  if (!game) {
    return (
      <main className="menu">
        <h1>Игра не найдена</h1>
        <Link to="/dashboard">В меню</Link>
      </main>
    );
  }

  return (
    <div className="game-screen">
      <Link to="/dashboard" className="back-button" aria-label="В меню">
        ⬅
      </Link>
      <GameHost
        key={game.id}
        manifest={game}
        profile={activeChild && { id: activeChild.id, name: activeChild.name, avatar: activeChild.avatar }}
        onExit={() => navigate('/dashboard')}
      />
    </div>
  );
}
