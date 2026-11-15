import { get, qs, TZ } from '../api/client';
import type { Dropoff, DropoffWorst, Game } from '../api/types';
import { useLoad } from '../app/useLoad';
import { useI18n } from '../i18n';
import { Card, LoadState } from '../ui/parts';

// Где дети бросают игру: воронка по уровням. Полоска — сколько прошли уровень,
// число справа — сколько бросили сразу после него. Худшее место подсвечено мёдом.

/** Должно совпадать с QUIT_AFTER_DAYS на сервере (modules/admin/dropoff.ts). */
const QUIT_AFTER_DAYS = 3;

/** «до 1-го уровня» или «после „5“» — для таблицы игр и подписи под воронкой. */
export function useQuitPlace() {
  const { t } = useI18n();
  return (w: DropoffWorst) => (w.level ? t('games.afterLevel', { level: w.level }) : t('games.beforeFirst'));
}

export function DropoffCard({ game, days, onClose }: { game: Game; days: number; onClose: () => void }) {
  const { t, num } = useI18n();
  const place = useQuitPlace();
  const state = useLoad(() => get<Dropoff>(`/games/${game.id}/dropoff${qs({ days, tz: TZ })}`), [game.id, days]);
  const d = state.data;
  const quit = d ? d.players - d.active : 0;
  const max = d ? Math.max(d.players, 1) : 1;
  const worst = d?.worst;
  const hot = (level: string) => (worst && worst.level === level ? ' hot' : '');

  return (
    <Card title={t('drop.title', { game: `${game.emoji} ${game.title}` })} aside={<button className="btn sm" onClick={onClose}>{t('close')}</button>}>
      <LoadState state={state} />
      {d && (
        <div className="col">
          <div className="row drop-sum">
            <span>{t('drop.players')}: <b>{num(d.players)}</b></span>
            <span>{t('drop.active')}: <b>{num(d.active)}</b></span>
            <span>{t('drop.quit')}: <b>{num(quit)}</b></span>
          </div>
          {worst && <p className="drop-worst">{t('drop.worst', { where: place(worst), pct: worst.share })}</p>}
          <div className="drop-head"><span>{t('drop.level')}</span><span>{t('drop.reached')}</span><span className="num">{t('drop.quitAfter')}</span></div>
          <div className={`drop-row${hot('')}`}>
            <span>{t('drop.beforeFirst')}</span>
            <span className="t"><i style={{ width: `${(d.players / max) * 100}%` }} /></span>
            <span className="num">{num(d.quitBeforeFirst)}</span>
          </div>
          {d.levels.map((l) => (
            <div className={`drop-row${hot(l.name)}`} key={l.name}>
              <span className="mono">{l.name}</span>
              <span className="t" title={`${l.reached} / ${d.players}`}><i style={{ width: `${(l.reached / max) * 100}%` }} /></span>
              <span className="num">{num(l.quit)}</span>
            </div>
          ))}
          {!d.levels.length && <p className="note">{t('drop.noLevels')}</p>}
          <p className="note">{t('drop.note', { days: QUIT_AFTER_DAYS })}</p>
        </div>
      )}
    </Card>
  );
}
