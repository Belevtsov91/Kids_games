import { useState } from 'react';
import { download, get, patch, post } from '../api/client';
import type { Family } from '../api/types';
import { useGameTitles } from '../api/gameTitles';
import { navigate } from '../app/router';
import { useLoad } from '../app/useLoad';
import { LANGS, useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card, LoadState, Pill } from '../ui/parts';
import { ChildCard } from './ChildCard';
import { MediaButton } from './MediaButton';

// Карточка семьи: взрослый, обычные действия, опасные действия и дети.

export function FamilyPage({ id }: { id: string }) {
  const { t, when } = useI18n();
  const { run, prompt, danger } = useFeedback();
  const state = useLoad(() => get<Family>(`/families/${id}`), [id], false);
  const [email, setEmail] = useState<string | null>(null);
  const titleOf = useGameTitles();
  const f = state.data;
  const base = `/families/${id}`;

  const act = async (work: () => Promise<unknown>) => {
    if (await run(work)) await state.reload();
  };
  const edit = async (field: 'name' | 'email' | 'timezone' | 'mailLocale', title: string, value: string, options?: { value: string; label: string }[]) => {
    const next = await prompt({ title, label: title, value, type: field === 'email' ? 'email' : 'text', options });
    if (next === null || next === value) return;
    if (field === 'email') setEmail(null);
    await act(() => patch(base, { [field]: next }));
  };
  const withCode = async (title: string, text: string, word: string, path: string) => {
    const answer = await danger({ title, text, word });
    if (answer) await act(() => post(path, answer));
  };

  return (
    <>
      <div className="row">
        <button className="btn" onClick={() => navigate('/families')}>← {t('family.back')}</button>
        <span className="sp" />
        {f?.parent.deleteAfter && <Pill tone="bad">{t('family.deletingOn', { date: when(f.parent.deleteAfter, false) })}</Pill>}
        {f?.parent.frozenAt && !f.parent.deleteAfter && <Pill tone="n">{t('families.frozen')}</Pill>}
      </div>
      <LoadState state={state} />
      {f && (
        <>
          <div className="g2">
            <Card title={t('family.adult')}>
              <dl className="kv">
                <dt>{t('name')}</dt>
                <dd>{f.parent.name} <button className="btn sm" onClick={() => void edit('name', t('name'), f.parent.name)}>{t('edit')}</button></dd>
                <dt>{t('email')}</dt>
                <dd>
                  <span className="mono">{email ?? f.parent.email}</span>
                  {!email && <button className="btn sm" onClick={() => void get<{ email: string }>(`${base}/email`).then((r) => setEmail(r.email))}>{t('show')}</button>}
                  <button className="btn sm" onClick={() => void get<{ email: string }>(`${base}/email`).then((r) => edit('email', t('email'), r.email))}>{t('edit')}</button>
                </dd>
                <dt>ID</dt><dd className="mono">{f.parent.id}</dd>
                <dt>{t('families.created')}</dt><dd>{when(f.parent.createdAt)}</dd>
                <dt>{t('families.seen')}</dt><dd>{when(f.parent.lastSeenAt)}</dd>
                <dt>{t('family.consent')}</dt>
                <dd>{f.parent.consentAt ? t('family.consentYes', { date: when(f.parent.consentAt, false), version: f.parent.policyVersion ?? '—' }) : t('family.consentOld')}</dd>
                <dt>{t('family.timezone')}</dt>
                <dd>{f.settings.timezone ?? '—'} <button className="btn sm" onClick={() => void edit('timezone', t('family.timezone'), f.settings.timezone ?? 'Europe/Kyiv')}>{t('edit')}</button></dd>
                <dt>{t('family.mailLang')}</dt>
                <dd>{f.settings.mailLocale ?? '—'} <button className="btn sm" onClick={() => void edit('mailLocale', t('family.mailLang'), f.settings.mailLocale ?? 'ru', LANGS.map((l) => ({ value: l.id, label: l.label })))}>{t('edit')}</button></dd>
                <dt>{t('family.letters')}</dt>
                <dd>{[f.settings.weeklyReport && t('family.weekly'), f.settings.notifyRequests && t('family.notify')].filter(Boolean).join(', ') || t('no')}</dd>
                <dt>PIN</dt>
                <dd>{f.settings.pinLockedUntil ? t('family.pinLocked', { date: when(f.settings.pinLockedUntil) }) : f.settings.hasPin ? t('family.pinSet') : t('family.pinNone')}</dd>
                <dt>{t('family.sessions')}</dt><dd>{f.sessions}</dd>
                <dt>{t('family.helpers')}</dt>
                <dd>{f.helpers.length ? f.helpers.map((h) => `${h.name}${h.email ? ` (${h.email})` : ''}`).join('; ') : t('no')}</dd>
                <dt>{t('family.photo')}</dt>
                <dd>{f.settings.hasPhoto ? <MediaButton label={t('family.photoShow')} load={() => get<{ photo: string }>(`${base}/photo`).then((r) => r.photo)} /> : t('no')}</dd>
              </dl>
            </Card>
            <Card title={t('family.actions')}>
              <div className="row">
                <button className="btn" onClick={() => void act(() => post(`${base}/reset-link`))}>{t('family.resetLink')}</button>
                <button className="btn" disabled={!f.settings.hasPin} onClick={() => void act(() => post(`${base}/pin/reset`))}>{t('family.pinReset')}</button>
                <button className="btn" disabled={!f.settings.pinLockedUntil} onClick={() => void act(() => post(`${base}/pin/unlock`))}>{t('family.pinUnlock')}</button>
                <button className="btn" onClick={() => void act(() => post(`${base}/sessions/revoke`))}>{t('family.logoutAll')}</button>
                <button className="btn" onClick={() => void run(() => download(`${base}/export`, `family-${id.slice(0, 8)}.json`), 'family.exported')}>{t('family.export')}</button>
                {f.parent.inactiveWarnedAt && <button className="btn" onClick={() => void act(() => post(`${base}/retention/postpone`))}>{t('retention.postpone')}</button>}
              </div>
              <h3 style={{ margin: '14px 0 8px' }}>{t('family.danger')}</h3>
              <div className="row">
                {f.parent.deleteAfter ? (
                  <button className="btn" onClick={() => void act(() => post(`${base}/delete/cancel`))}>{t('family.deleteCancel')}</button>
                ) : (
                  <>
                    {f.parent.frozenAt
                      ? <button className="btn" onClick={() => void act(() => post(`${base}/unfreeze`))}>{t('family.unfreeze')}</button>
                      : <button className="btn dng" onClick={() => void withCode(t('family.freeze'), t('family.freezeText'), t('word.freeze'), `${base}/freeze`)}>{t('family.freeze')}</button>}
                    <button className="btn dng" onClick={() => void withCode(t('family.delete'), t('family.deleteText'), t('word.delete'), `${base}/delete`)}>{t('family.delete')}</button>
                  </>
                )}
              </div>
              <p className="note" style={{ marginTop: 8 }}>{t('family.dangerNote')}</p>
            </Card>
          </div>
          {f.children.map((c) => <ChildCard key={c.id} child={c} titleOf={titleOf} reload={state.reload} />)}
          {!f.children.length && <p className="note">{t('family.noKids')}</p>}
        </>
      )}
    </>
  );
}
