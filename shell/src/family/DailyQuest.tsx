import { useEffect, useState } from 'react';
import type { GameManifest } from '@ig/sdk';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { GIFT_ICONS, giftIndex, loadQuest, minutesLeft, type Quest } from './quest';
import { useFamilyText } from './text';

/** Задание дня: одна игра, полоска прогресса, серия дней и вещи Тёпы за каждые 7 выполненных дней. */
export function DailyQuest({ games, onPlay }: { games: GameManifest[]; onPlay: (g: GameManifest) => void }) {
  const f = useFamilyText().quest;
  const { locale } = useI18n();
  const [quest, setQuest] = useState<Quest | null>(null);
  const ids = games.map((g) => g.id).join(',');

  useEffect(() => {
    let live = true;
    if (!ids) return;
    loadQuest(ids.split(',')).then((q) => live && setQuest(q), () => undefined);
    return () => {
      live = false;
    };
  }, [ids]);

  const game = quest?.gameId ? games.find((g) => g.id === quest.gameId) : undefined;
  if (!quest || !game) return null;
  const pct = Math.round((quest.seconds / quest.need) * 100);
  const owned = Array.from({ length: Math.min(quest.gifts, GIFT_ICONS.length) }, (_, i) => i);

  return (
    <section className={`family-card daily-quest${quest.done ? ' is-done' : ''}`} aria-label={f.title} data-testid="daily-quest">
      <h2>⭐ {f.title}</h2>
      <button type="button" className="quest-game" onClick={() => onPlay(game)}>
        <img src={covers[game.id]} alt="" width="56" height="56" />
        <span>
          <b>{quest.done ? f.done : f.task(gameTitle(game, locale), Math.round(quest.need / 60))}</b>
          {!quest.done && <small>{f.left(minutesLeft(quest))}</small>}
        </span>
        <i aria-hidden="true">{quest.done ? '✓' : '▶'}</i>
      </button>
      <div className="quest-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="quest-meta">
        {quest.streak > 0 && <span>🔥 {f.streak(quest.streak)}</span>}
        <span>🎁 {f.toGift(quest.toNext)}</span>
      </p>
      {quest.streak === 0 && quest.total > 0 && <p className="family-muted">{f.calm}</p>}
      {owned.length > 0 && (
        <p className="quest-gifts" aria-label={f.gifts}>
          {owned.map((i) => (
            <span key={i} title={f.items[giftIndex(i)]}>{GIFT_ICONS[giftIndex(i)]}</span>
          ))}
        </p>
      )}
    </section>
  );
}
