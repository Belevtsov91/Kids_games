import { useState } from 'react';
import { post } from '../api/client';
import { useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Pill } from '../ui/parts';
import { Journal } from './Journal';

// Ошибки игр из браузера и сбои сервера, сгруппированные по тексту.

export function ErrorsPage() {
  const { t, when } = useI18n();
  const { run } = useFeedback();
  const [tick, setTick] = useState(0);
  const resolve = async (fp: unknown) => {
    if (await run(() => post(`/errors/${fp}/resolve`))) setTick((n) => n + 1);
  };
  return (
    <Journal
      title={t('errors.title')}
      path="/errors"
      file="errors"
      tick={tick}
      columns={[
        { head: t('errors.message'), cell: (r) => <span className="mono">{String(r.message)}</span>, wrap: true },
        { head: t('errors.where'), cell: (r) => `${r.source === 'client' ? t('errors.client') : t('errors.server')}${r.path ? ` · ${r.path}` : ''}`, wrap: true },
        { head: t('errors.count'), cell: (r) => String(r.count), num: true },
        { head: t('errors.last'), cell: (r) => when(r.last_at as string) },
        { head: t('state'), cell: (r) => (r.resolved_at ? <Pill tone="n">{t('errors.resolved')}</Pill> : <Pill tone="bad">{t('errors.open')}</Pill>) },
        { head: '', cell: (r) => (r.resolved_at ? null : <button className="btn sm" onClick={() => void resolve(r.fingerprint)}>{t('errors.resolve')}</button>) },
      ]}
    />
  );
}
