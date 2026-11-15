import { useState } from 'react';
import { get, patch, post } from '../api/client';
import type { Child } from '../api/types';
import { useI18n, type Key } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Bars, bytes, Pill, shortDay } from '../ui/parts';
import { MediaButton } from './MediaButton';

// Ребёнок в карточке семьи: время по дням, настройки от родителя (только просмотр), навыки, сохранения, фото и рисунки.

const DAYS: Key[] = ['day.0', 'day.1', 'day.2', 'day.3', 'day.4', 'day.5', 'day.6'];
const hm = (v: unknown) => (typeof v === 'string' ? v.slice(0, 5) : '');

function limits(s: Record<string, unknown>, t: (k: Key, v?: Record<string, string | number>) => string) {
  const days = s.limit_days as number[] | null | undefined;
  if (days?.length === 7) return days.map((m, i) => `${t(DAYS[i])} ${m || '∞'}`).join(', ');
  if (s.limit_weekday == null && s.limit_weekend == null) return t('child.noLimit');
  return t('child.limitValue', { weekday: String(s.limit_weekday ?? '∞'), weekend: String(s.limit_weekend ?? '∞') });
}

export function ChildCard({ child: c, titleOf, reload }: { child: Child; titleOf: (id: string) => string; reload: () => Promise<void> }) {
  const { t, when } = useI18n();
  const { run, prompt, danger } = useFeedback();
  const [drawings, setDrawings] = useState<{ id: string; title: string; created_at: string }[] | null>(null);
  const s = c.settings;
  const base = `/children/${c.id}`;
  const act = async (work: () => Promise<unknown>) => {
    if (await run(work)) await reload();
  };
  const editName = async () => {
    const name = await prompt({ title: t('child.editName'), label: t('name'), value: c.name });
    if (name && name !== c.name) await act(() => patch(base, { name }));
  };
  const editAge = async () => {
    const age = await prompt({ title: t('child.editAge'), label: t('child.age'), value: String(c.age), type: 'number' });
    if (age && Number(age) !== c.age) await act(() => patch(base, { age: Number(age) }));
  };
  const resetSave = async (gameId: string) => {
    const answer = await danger({ title: t('child.resetSave'), text: t('child.resetText', { game: titleOf(gameId), name: c.name }), word: t('word.reset') });
    if (answer) await act(() => post(`${base}/saves/reset`, { gameId, ...answer }));
  };
  const total = (day: Child['week'][number]) => day.games.reduce((a, g) => a + g.minutes, 0);
  const byGame = new Map<string, number>();
  for (const day of c.week) for (const g of day.games) byGame.set(g.gameId, (byGame.get(g.gameId) ?? 0) + g.minutes);

  return (
    <section className="card">
      <div className="row child-head">
        <b>{c.avatar} {c.name}, {c.age}</b>
        {Boolean(s.toddler) && <Pill tone="n">{t('child.toddler')}</Pill>}
        {c.deletedAt && <Pill tone="bad">{t('child.inTrash', { date: when(c.purgeAt, false) })}</Pill>}
        <span className="sp" />
        {c.deletedAt && <button className="btn sm" onClick={() => void act(() => post(`${base}/restore`))}>{t('child.restore')}</button>}
        <button className="btn sm" onClick={() => void editName()}>{t('child.editName')}</button>
        <button className="btn sm" onClick={() => void editAge()}>{t('child.editAge')}</button>
      </div>
      <div className="g2" style={{ marginTop: 10 }}>
        <div>
          <h3>{t('child.week')}</h3>
          <Bars values={c.week.map(total)} labels={c.week.map((d) => shortDay(d.day))} />
          <p className="note">{[...byGame].sort((a, b) => b[1] - a[1]).map(([id, m]) => `${titleOf(id)} ${m}`).join(' · ') || t('child.noPlay')}</p>
        </div>
        <div>
          <h3>{t('child.rules')}</h3>
          <dl className="kv">
            <dt>{t('child.limit')}</dt><dd>{limits(s, t)}</dd>
            <dt>{t('child.quiet')}</dt><dd>{s.quiet_from && s.quiet_to ? `${hm(s.quiet_from)}–${hm(s.quiet_to)}` : t('no')}</dd>
            <dt>{t('child.break')}</dt><dd>{s.break_every ? t('child.breakValue', { n: Number(s.break_every) }) : t('no')}</dd>
            <dt>{t('child.locks')}</dt><dd>{[s.locked && t('child.lockIn'), s.exit_lock && t('child.lockOut')].filter(Boolean).join(', ') || t('no')}</dd>
            <dt>{t('child.canAsk')}</dt><dd>{s.can_ask === false ? t('no') : t('yes')}</dd>
            <dt>{t('child.plan')}</dt><dd>{(s.day_plan as string[] | undefined)?.map(titleOf).join(', ') || t('no')}</dd>
            <dt>{t('child.access')}</dt><dd>{c.access.filter((a) => !a.allowed).map((a) => titleOf(a.gameId)).join(', ') || t('child.accessAll')}</dd>
            <dt>{t('child.comfort')}</dt>
            <dd>{t('child.comfortValue', { music: Number(s.music_volume ?? 80), effects: Number(s.effects_volume ?? 100) })}{s.reduce_motion ? `, ${t('child.reduceMotion')}` : ''}{s.big_buttons ? `, ${t('child.bigButtons')}` : ''}</dd>
            <dt>{t('child.stickers')}</dt><dd>{c.stickers}</dd>
            <dt>{t('child.skills')}</dt><dd>{c.skills.map((k) => `${k.skill} ${Math.round(k.recent * 100)}%`).join(', ') || t('empty')}</dd>
          </dl>
          <p className="note">{t('child.rulesNote')}</p>
        </div>
        <div>
          <h3>{t('child.saves')}</h3>
          <div className="tw">
            <table>
              <tbody>
                {c.saves.map((v) => (
                  <tr key={`${v.gameId}${v.table ?? ''}`}>
                    <td>{titleOf(v.gameId)}</td>
                    <td className="note">{t('child.saveItems', { n: v.items })}{v.bytes !== undefined ? `, ${bytes(v.bytes)}` : ''}{v.updatedAt ? `, ${when(v.updatedAt, false)}` : ''}</td>
                    <td><button className="btn sm dng" onClick={() => void resetSave(v.gameId)}>{t('child.reset')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!c.saves.length && <p className="note">{t('child.noSaves')}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            {c.hasPhoto && <MediaButton label={t('family.photoShow')} load={() => get<{ photo: string }>(`${base}/photo`).then((r) => r.photo)} />}
            {!drawings && <button className="btn sm" onClick={() => void get<typeof drawings>(`${base}/drawings`).then(setDrawings)}>{t('child.drawings')}</button>}
          </div>
          {drawings && (
            <div className="row" style={{ marginTop: 8 }}>
              {drawings.map((d) => <MediaButton key={d.id} label={`${d.title || t('child.drawing')} · ${when(d.created_at, false)}`} load={() => get<{ image: string }>(`${base}/drawings/${d.id}`).then((r) => r.image)} />)}
              {!drawings.length && <span className="note">{t('child.noDrawings')}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
