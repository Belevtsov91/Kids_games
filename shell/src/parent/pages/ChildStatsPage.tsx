import { useState } from 'react';
import { findGame } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { papi, type ChildStats } from '../api';
import { useParentText } from '../text';
import { DayBars } from '../ui/DayBars';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';
import { useChild } from './useChild';

const PERIODS = [7, 14, 30] as const;

/** Аналитика ребёнка: итоги за период, минуты по дням и по играм. */
export function ChildStatsPage() {
  const p = useParentText();
  const s = p.stats;
  const { locale } = useI18n();
  const { id, child } = useChild();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(14);
  const { data } = useLoad(() => papi.get<ChildStats>(`/children/${id}/stats?days=${days}`), [id, days]);
  if (!child) return null;

  const total = data?.days.reduce((sum, d) => sum + d.minutes, 0) ?? 0;
  const limitOf = (day: string) => {
    const wd = new Date(`${day}T12:00:00Z`).getUTCDay();
    return wd === 0 || wd === 6 ? child.rules.limitWeekend : child.rules.limitWeekday;
  };
  const over = data?.days.filter((d) => {
    const limit = limitOf(d.day);
    return limit !== null && d.minutes > limit;
  }).length ?? 0;
  const best = Math.max(1, ...(data?.games.map((g) => g.minutes) ?? []));
  const fmtDay = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.child.tiles.stats[0]} lead={p.child.tiles.stats[1]}>
        <div className="pa-seg" role="group" aria-label={s.period}>
          {PERIODS.map((n) => (
            <button key={n} type="button" aria-pressed={n === days} onClick={() => setDays(n)}>
              {s.days(n)}
            </button>
          ))}
        </div>
      </PageHead>

      <div className="pa-sums">
        <div><span>{s.total}</span><b>{p.hm(total)}</b></div>
        <div><span>{s.perDay}</span><b>{p.hm(Math.round(total / days))}</b></div>
        <div><span>{s.over}</span><b>{over}</b></div>
      </div>

      <Panel title={s.byDay}>{data && <DayBars days={data.days} dayNames={p.days} limit={child.rules.limitWeekday} />}</Panel>

      <Panel title={s.byGame}>
        {data && data.games.length === 0 && <p className="pa-note">{s.none}</p>}
        <ul className="pa-games">
          {data?.games.map((g) => {
            const game = findGame(g.gameId);
            if (!game) return null;
            return (
              <li key={g.gameId} className="pa-game">
                <img src={covers[game.id]} alt="" width="56" height="56" />
                <div className="pa-game-text">
                  <b>{gameTitle(game, locale)}</b>
                  <span className="pa-meter"><i style={{ width: `${(g.minutes / best) * 100}%` }} /></span>
                  <small>{s.last}: {fmtDay(g.lastDay)}</small>
                </div>
                <b className="pa-game-min">{p.hm(g.minutes)}</b>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
