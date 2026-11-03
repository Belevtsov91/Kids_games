import { useState } from 'react';
import { findGame } from '@/catalog/catalog';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { stickerTitle } from '@/kid/stickers';
import { papi, type SkillsReport } from '../api';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';
import { useChild } from './useChild';

const PERIODS = [7, 30, 90] as const;

/** «Чему научился»: навыки по ответам в играх, уровни по играм и наклейки. */
export function ChildSkillsPage() {
  const p = useParentText();
  const s = p.skills;
  const { locale } = useI18n();
  const { id, child } = useChild();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const { data } = useLoad(() => papi.get<SkillsReport>(`/children/${id}/skills?days=${days}`), [id, days]);
  if (!child) return null;

  const levels = Object.entries(data?.levels ?? {}).flatMap(([gameId, n]) => {
    const game = findGame(gameId);
    return game ? [{ game, n }] : [];
  });

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.tiles3.skills[0]} lead={s.lead}>
        <div className="pa-seg" role="group">
          {PERIODS.map((d) => (
            <button key={d} type="button" aria-pressed={d === days} onClick={() => setDays(d)}>{s.period(d)}</button>
          ))}
        </div>
      </PageHead>

      <Panel>
        {data && data.skills.length === 0 && <p className="pa-empty">{s.empty}</p>}
        <ul className="pa-skills">
          {data?.skills.map((k) => (
            <li key={k.skill} className={`pa-skill is-${k.level}`}>
              <div className="pa-skill-top">
                <b>{s.names[k.skill] ?? k.skill}</b>
                <span className="pa-skill-badge">{s.level[k.level]}</span>
              </div>
              <div className="pa-skill-bar" aria-hidden="true"><i style={{ width: `${Math.round(k.recent * 100)}%` }} /></div>
              <small>
                {s.answers(k.right, k.total)} · {k.games.map((g) => { const game = findGame(g); return game ? gameTitle(game, locale) : g; }).join(', ')}
              </small>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="pa-cols">
        <Panel title={s.levels}>
          <ul className="pa-list">
            {levels.map(({ game, n }) => (
              <li key={game.id}><span>{game.emoji} {gameTitle(game, locale)}</span><b>{n}</b></li>
            ))}
          </ul>
        </Panel>
        <Panel title={s.stickers}>
          {data && data.stickers.length === 0 && <p className="pa-empty">{s.noStickers}</p>}
          <div className="pa-sticker-row">
            {data?.stickers.map((st) => {
              const def = findGame(st.gameId)?.stickers?.find((d) => d.id === st.sticker);
              return def ? <span key={`${st.gameId}/${st.sticker}`} className="pa-sticker" title={stickerTitle(def, locale)}>{def.emoji}</span> : null;
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}
