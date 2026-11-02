import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { findGame } from '@/games/registry';

export function GamePage() {
  const { gameId } = useParams();
  const game = findGame(gameId);

  if (!game) {
    return (
      <main className="menu">
        <h1>Игра не найдена</h1>
        <Link to="/">В меню</Link>
      </main>
    );
  }

  const Game = game.component;
  return (
    <div className="game-screen">
      <Link to="/" className="back-button" aria-label="В меню">
        ⬅
      </Link>
      <Suspense fallback={<div className="loading">Загрузка…</div>}>
        <Game />
      </Suspense>
    </div>
  );
}
