import type { Me } from '../api/types';
import { useI18n } from '../i18n';
import { Card } from '../ui/parts';
import { Journal } from './Journal';

// Безопасность: неудачные входы родителей, моя сессия, журнал моих действий.

const short = (v: unknown) => {
  if (v === null || v === undefined) return '';
  const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
};

export function SecurityPage({ me }: { me: Me }) {
  const { t, when } = useI18n();
  return (
    <>
      <Card title={t('security.session')}>
        <dl className="kv">
          <dt>{t('email')}</dt><dd className="mono">{me.email}</dd>
          <dt>{t('security.until')}</dt><dd>{when(me.expiresAt)}</dd>
        </dl>
      </Card>
      <Journal
        title={t('security.failures')}
        path="/login-failures"
        file="login-failures"
        columns={[
          { head: t('when'), cell: (r) => when(r.created_at as string) },
          { head: t('email'), cell: (r) => <span className="mono">{String(r.email)}</span> },
          { head: t('security.known'), cell: (r) => (r.known ? t('yes') : t('security.unknown')) },
          { head: 'IP', cell: (r) => <span className="mono">{String(r.ip ?? '')}</span> },
        ]}
      />
      <Journal
        title={t('security.audit')}
        path="/audit"
        file="audit"
        columns={[
          { head: t('when'), cell: (r) => when(r.created_at as string) },
          { head: t('security.action'), cell: (r) => <span className="mono">{String(r.action)}</span> },
          { head: t('security.target'), cell: (r) => <span className="mono">{[r.target_type, r.target_id].filter(Boolean).join(' ')}</span>, wrap: true },
          { head: t('security.change'), cell: (r) => <span className="note">{[short(r.before), short(r.after)].filter(Boolean).join(' → ')}</span>, wrap: true },
        ]}
      />
      <Journal
        title={t('security.jobs')}
        path="/job-runs"
        file="job-runs"
        columns={[
          { head: t('when'), cell: (r) => when(r.started_at as string) },
          { head: t('security.job'), cell: (r) => String(r.job) },
          { head: t('state'), cell: (r) => (r.ok ? t('ok') : t('attention')) },
          { head: t('security.note'), cell: (r) => `${r.manual ? `${t('security.manual')} ` : ''}${r.note ?? ''}`, wrap: true },
        ]}
      />
    </>
  );
}
