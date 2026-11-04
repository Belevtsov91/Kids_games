import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { findGame } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { DayBars } from '@/parent/ui/DayBars';
import { kidApi, tz, type KidStats } from '../KidStatus';
import { useKidText } from '../text';
import { KidFrame } from './KidFrame';

/** «Мои успехи» (/me/progress): неделя по дням и любимые игры. */
export function KidProgressPage() {
  const k = useKidText();
  const { locale } = useI18n();
  const [stats, setStats] = useState<KidStats | null>(null);

  useEffect(() => {
    kidApi.get<KidStats>(`/stats?tz=${encodeURIComponent(tz())}`).then(setStats, () => setStats({ days: [], games: [] }));
  }, []);

  const total = stats?.days.reduce((s, d) => s + d.minutes, 0) ?? 0;
  const games = (stats?.games ?? []).flatMap((g) => {
    const game = findGame(g.gameId);
    return game ? [{ ...g, game }] : [];
  });
  const best = Math.max(1, ...games.map((g) => g.minutes));

  return (
    <KidFrame back={{ to: '/me', label: k.me.toMe }}>
      <h1 className="kid-title">{k.me.tiles.progress.title}</h1>
      <div className="kid-cols">
        <section className="kid-card">
          <h2>{k.me.week}</h2>
          {stats && stats.days.length > 0 && <DayBars days={stats.days} dayNames={k.days} />}
          <p className="kid-total">{k.me.total(k.hm(total))}</p>
        </section>
        <section className="kid-card">
          <h2>{k.me.games}</h2>
          {stats && games.length === 0 && <p>{k.me.none}</p>}
          <ul className="kid-games">
            {games.map(({ game, minutes }) => (
              <li key={game.id}>
                <Link to={`/play/${game.id}`} className="kid-game">
                  <img src={covers[game.id]} alt="" width="64" height="64" />
                  <span className="kid-game-text">
                    <strong>{gameTitle(game, locale)}</strong>
                    <span className="kid-game-bar">
                      <i style={{ width: `${(minutes / best) * 100}%` }} />
                    </span>
                  </span>
                  <span className="kid-game-min">{k.hm(minutes)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </KidFrame>
  );
}
