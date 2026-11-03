import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { findGame } from '@/catalog/catalog';
import { GameHost } from '@/host/GameHost';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { rememberGame } from '@/dashboard/lastPlayed';

export function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { activeChild } = useAuth();
  const { t } = useI18n();
  const game = findGame(gameId);

  // для портала «Продолжить» на дашборде
  useEffect(() => {
    if (game && activeChild) rememberGame(activeChild.id, game.id);
  }, [game, activeChild]);

  if (!game) {
    return (
      <main className="menu">
        <h1>{t.game.notFound}</h1>
        <Link to="/dashboard">{t.game.toMenu}</Link>
      </main>
    );
  }

  return (
    <div className="game-screen">
      <Link to="/dashboard" className="back-button" aria-label={t.game.toMenu}>
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
