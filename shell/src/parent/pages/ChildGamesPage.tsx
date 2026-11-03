import { useEffect, useState } from 'react';
import { games } from '@/catalog/catalog';
import { covers } from '@/catalog/covers';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { ageRange } from '@/i18n/plural';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { fitsAge } from './access';
import { useChild } from './useChild';

type Mode = false | null | true;
const MODES: Mode[] = [false, null, true];

/** Какие игры видит ребёнок: закрыть, оставить по возрасту или поднять в «Твои миры». */
export function ChildGamesPage() {
  const p = useParentText();
  const g = p.games;
  const { locale } = useI18n();
  const { toast } = useParent();
  const { id, child } = useChild();
  const [access, setAccess] = useState<Record<string, boolean>>({});
  useEffect(() => setAccess(child?.access ?? {}), [child]);
  if (!child) return null;

  const setMode = async (gameId: string, title: string, mode: Mode) => {
    const before = access;
    const next = { ...access };
    if (mode === null) delete next[gameId];
    else next[gameId] = mode;
    setAccess(next);
    try {
      await papi.put(`/children/${id}/games/${gameId}`, { allowed: mode });
      toast(g.saved(title));
    } catch {
      setAccess(before);
      toast(p.failed);
    }
  };

  const label = (m: Mode) => (m === false ? g.modes.closed : m === null ? g.modes.auto : g.modes.mine);

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={p.child.tiles.games[0]} lead={g.lead} />
      <Panel>
        <ul className="pa-games">
          {games.map((game) => {
            const title = gameTitle(game, locale);
            const mode: Mode = game.id in access ? access[game.id] : null;
            const fits = fitsAge(game, child.age);
            return (
              <li key={game.id} className={`pa-game${mode === false ? ' is-off' : ''}`} data-testid="parent-game">
                <img src={covers[game.id]} alt="" width="56" height="56" />
                <div className="pa-game-text">
                  <b>{title}</b>
                  <span className="pa-tags">
                    <i className={`pa-tag pa-tag-${game.kind}`}>{game.kind.toUpperCase()}</i>
                    <i className="pa-tag">{ageRange(locale, game.ages.min, game.ages.max)}</i>
                    <i className={`pa-tag ${fits ? 'pa-tag-ok' : 'pa-tag-warn'}`}>{fits ? g.fits : g.clouds}</i>
                  </span>
                </div>
                <div className="pa-seg pa-seg-sm" role="group" aria-label={title}>
                  {MODES.map((m) => (
                    <button key={String(m)} type="button" aria-pressed={mode === m} onClick={() => void setMode(game.id, title, m)}>
                      {label(m)}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="pa-note">{g.note}</p>
      </Panel>
    </>
  );
}
