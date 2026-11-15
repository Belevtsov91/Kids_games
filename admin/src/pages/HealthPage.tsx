import { get, post } from '../api/client';
import type { Health } from '../api/types';
import { useLoad } from '../app/useLoad';
import { useI18n, type Key } from '../i18n';
import { useFeedback } from '../ui/feedback';
import { bytes, Card, HBars, LoadState, Pill } from '../ui/parts';

// Здоровье: проверки, фоновые задачи с ручным запуском, место в базе и лимиты.

const CHECK_KEYS: Record<string, Key> = {
  db: 'health.db', migration: 'health.migration', mail: 'health.mail', games: 'health.games', env: 'health.env',
  'job:weekly-report': 'job.weekly', 'job:cleanup': 'job.cleanup', 'job:digest': 'job.digest',
};

export function HealthPage() {
  const { t, when } = useI18n();
  const { run } = useFeedback();
  const state = useLoad(() => get<Health>('/health'), []);
  const h = state.data;
  const runJob = async (job: string) => {
    await run(() => post(`/jobs/${job}/run`), 'health.jobDone');
    await state.reload();
  };

  return (
    <>
      <LoadState state={state} />
      {h && (
        <>
          <Card title={t('health.checks', { at: when(h.at) })}>
            <div className="tw">
              <table>
                <tbody>
                  {h.checks.map((c) => (
                    <tr key={c.id}>
                      <td>{CHECK_KEYS[c.id] ? t(CHECK_KEYS[c.id]) : c.id}</td>
                      <td><Pill tone={c.ok ? 'ok' : c.id === 'env' || c.id === 'migration' ? 'warn' : 'bad'}>{c.ok ? t('ok') : t('attention')}</Pill></td>
                      <td className="note wrap">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="g2">
            <Card title={t('health.jobs')}>
              <div className="row">
                <button className="btn" onClick={() => void runJob('weekly-report')}>{t('health.runWeekly')}</button>
                <button className="btn" onClick={() => void runJob('cleanup')}>{t('health.runCleanup')}</button>
              </div>
              <p className="note" style={{ marginTop: 8 }}>{t('health.jobsNote')}</p>
            </Card>
            <Card title={t('health.limits')}>
              <HBars rows={[
                { label: t('health.dbSize'), value: h.limits.dbBytes ?? 0, text: bytes(h.limits.dbBytes) },
                { label: t('health.dbLimit'), value: h.limits.dbLimit, text: bytes(h.limits.dbLimit) },
              ]} />
              <HBars rows={[
                { label: t('health.mailsToday'), value: h.limits.mailsToday, text: String(h.limits.mailsToday) },
                { label: t('health.mailsLimit'), value: h.limits.mailsLimit, text: String(h.limits.mailsLimit) },
              ]} />
              <p className="note">{t('health.limitsNote')}</p>
            </Card>
            <Card title={t('health.tables')}>
              <HBars rows={h.tables.map((x) => ({ label: x.name.replace(/^ig_/, ''), value: x.bytes, text: bytes(x.bytes) }))} empty={t('health.tablesEmpty')} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
