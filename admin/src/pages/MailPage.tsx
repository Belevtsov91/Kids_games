import { useState } from 'react';
import { get, post, qs } from '../api/client';
import type { Lang } from '../api/types';
import { LANGS, useI18n, type Key } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { Card, Pill } from '../ui/parts';
import { Journal } from './Journal';

// Письма: предпросмотр шаблонов на 4 языках, тестовое письмо себе и журнал писем с повторной отправкой.

const TEMPLATES: { id: string; key: Key }[] = [
  { id: 'password-reset', key: 'mail.t.reset' },
  { id: 'time-request', key: 'mail.t.request' },
  { id: 'weekly-report', key: 'mail.t.weekly' },
  { id: 'helper-invite', key: 'mail.t.helper' },
  { id: 'inactive-warning', key: 'mail.t.inactive' },
];

export function MailPage() {
  const { t, when } = useI18n();
  const { run } = useFeedback();
  const [template, setTemplate] = useState('password-reset');
  const [locale, setLocale] = useState<Lang>('ru');
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [tick, setTick] = useState(0);

  const show = () => void get<{ subject: string; html: string }>(`/mail/preview${qs({ template, locale })}`).then(setPreview);
  const resend = async (id: unknown) => {
    if (await run(() => post(`/mail/${id}/resend`), 'mail.resent')) setTick((n) => n + 1);
  };

  return (
    <>
      <Card title={t('mail.templates')}>
        <div className="row">
          <select className="inp" id="mail-template" value={template} onChange={(e) => setTemplate(e.target.value)}>
            {TEMPLATES.map((x) => <option key={x.id} value={x.id}>{t(x.key)}</option>)}
          </select>
          <select className="inp" id="mail-locale" value={locale} onChange={(e) => setLocale(e.target.value as Lang)}>
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="btn" onClick={show}>{t('mail.preview')}</button>
          <button className="btn" onClick={() => void run(() => post('/mail/test', { template, locale }), 'mail.testSent')}>{t('mail.test')}</button>
        </div>
        {preview && (
          <div className="col" style={{ marginTop: 10 }}>
            <b>{preview.subject}</b>
            <iframe className="mail" title="preview" sandbox="" srcDoc={preview.html} />
          </div>
        )}
      </Card>
      <Journal
        title={t('mail.log')}
        path="/mail"
        file="mail"
        tick={tick}
        columns={[
          { head: t('when'), cell: (r) => when(r.created_at as string) },
          { head: t('mail.to'), cell: (r) => <span className="mono">{String(r.to_email)}</span> },
          { head: t('mail.letter'), cell: (r) => String(r.tag), wrap: true },
          { head: t('mail.result'), cell: (r) => (r.ok ? <Pill tone="ok">{t('mail.sent')}</Pill> : <Pill tone="bad">{t('mail.failed')}</Pill>) },
          { head: '', cell: (r) => (r.tag === 'password-reset' ? <button className="btn sm" onClick={() => void resend(r.id)}>{t('mail.resend')}</button> : null) },
        ]}
      />
    </>
  );
}
