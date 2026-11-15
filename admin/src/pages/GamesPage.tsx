import { useState } from 'react';
import { get, post, qs, TZ } from '../api/client';
import type { Game } from '../api/types';
import { useLoad } from '../app/useLoad';
import { useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card, LoadState, Pill } from '../ui/parts';
import { DropoffCard, useQuitPlace } from './DropoffCard';

// Игры: статистика за период, где дети бросают игру (нажать на строку) и выключатель «отключить для всех».

export function GamesPage() {
  const { t } = useI18n();
  const { run, danger } = useFeedback();
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState<string | null>(null);
  const place = useQuitPlace();
  const state = useLoad(() => get<Game[]>(`/games${qs({ days, tz: TZ })}`), [days]);

  const toggle = async (g: Game) => {
    if (g.disabled) {
      if (await run(() => post(`/games/${g.id}/enable`))) await state.reload();
      return;
    }
    const answer = await danger({ title: t('games.disable'), text: t('games.disableText', { game: g.title }), word: t('word.disable') });
    if (answer && (await run(() => post(`/games/${g.id}/disable`, answer)))) await state.reload();
  };

  const selected = state.data?.find((g) => g.id === open);

  return (
    <>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {[1, 7, 30, 365].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{t(`period.${d}` as 'period.7')}</button>)}
      </div>
      <LoadState state={state} />
      {state.data && (
        <Card>
          <div className="tw">
            <table>
              <thead>
                <tr><th>{t('games.game')}</th><th>{t('games.ages')}</th><th className="num">{t('games.minutes')}</th><th className="num">{t('games.players')}</th><th className="num">{t('games.levels')}</th><th className="num">{t('games.right')}</th><th>{t('games.quit')}</th><th>{t('state')}</th><th /></tr>
              </thead>
              <tbody>
                {state.data.map((g) => (
                  <tr key={g.id} className={`click${open === g.id ? ' on' : ''}`} onClick={() => setOpen(open === g.id ? null : g.id)}>
                    <td>{g.emoji} {g.title}<div className="note mono">{g.id}{g.hasServer ? ` · ${t('games.server')}` : ''}</div></td>
                    <td>{g.ages.min}–{g.ages.max}</td>
                    <td className="num">{g.minutes}</td>
                    <td className="num">{g.players}</td>
                    <td className="num">{g.levels}</td>
                    <td className="num">{g.rightShare === null ? '—' : `${g.rightShare}%`}</td>
                    <td>{g.quit ? <>{place(g.quit)}<div className="note">{g.quit.share}%</div></> : '—'}</td>
                    <td>
                      {g.disabled ? <Pill tone="bad">{t('games.off')}</Pill> : !g.serverOk ? <Pill tone="warn">{t('games.serverFailed')}</Pill> : <Pill tone="ok">{t('games.on')}</Pill>}
                    </td>
                    <td><button className={`btn sm${g.disabled ? '' : ' dng'}`} onClick={(e) => { e.stopPropagation(); void toggle(g); }}>{g.disabled ? t('games.enable') : t('games.disable')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note" style={{ marginTop: 8 }}>{t('games.dropoffHint')} {t('games.note')}</p>
        </Card>
      )}
      {selected && <DropoffCard game={selected} days={days} onClose={() => setOpen(null)} />}
    </>
  );
}
