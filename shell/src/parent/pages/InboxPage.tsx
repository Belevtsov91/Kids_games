import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel, ToggleRow } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

interface Inbox {
  requests: { id: string; child_id: string; minutes: number; status: 'pending' | 'approved' | 'denied'; created_at: string }[];
  mail: { notifyRequests: boolean; weeklyReport: boolean; enabled: boolean };
}

/** Просьбы детей за 14 дней (с ответом на ждущие) и какие письма присылать. */
export function InboxPage() {
  const p = useParentText();
  const b = p.inbox;
  const { locale } = useI18n();
  const { me } = useAuth();
  const { toast } = useParent();
  const { data, reload, setData } = useLoad(() => papi.get<Inbox>('/inbox'), []);
  const nameOf = (id: string) => me?.children.find((c) => c.id === id)?.name ?? '';
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const answer = async (id: string, approve: boolean) => {
    try {
      await papi.post(`/requests/${id}`, { approve });
      toast(p.saved);
      await reload();
    } catch {
      toast(p.failed);
    }
  };
  const setMail = async (patch: Partial<Inbox['mail']>) => {
    if (!data) return;
    setData({ ...data, mail: { ...data.mail, ...patch } });
    try {
      await papi.put('/mail', { ...patch, locale });
      toast(p.saved);
    } catch {
      toast(p.failed);
      await reload();
    }
  };

  return (
    <>
      <PageHead eyebrow={p.overview.eyebrow} title={b.title} lead={b.lead} />
      <div className="pa-cols">
        <Panel>
          {data && data.requests.length === 0 && <p className="pa-empty">{b.empty}</p>}
          <ul className="pa-inbox">
            {data?.requests.map((r) => (
              <li key={r.id} className={`is-${r.status}`}>
                <b>{b.asked(nameOf(r.child_id), r.minutes)}</b>
                <small>{when(r.created_at)}</small>
                {r.status === 'pending' ? (
                  <>
                    <button type="button" className="dash-btn dash-btn-primary" onClick={() => void answer(r.id, true)}>{p.overview.allow(r.minutes)}</button>
                    <button type="button" className="dash-btn" onClick={() => void answer(r.id, false)}>{p.overview.deny}</button>
                  </>
                ) : (
                  <span>{b.status[r.status]}</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        {data && (
          <Panel title={b.mail}>
            <ToggleRow id="notify-requests" label={b.notify} hint={b.notifyLead} checked={data.mail.notifyRequests} onChange={(v) => void setMail({ notifyRequests: v })} />
            <ToggleRow id="weekly-report" label={b.weekly} hint={b.weeklyLead} checked={data.mail.weeklyReport} onChange={(v) => void setMail({ weeklyReport: v })} />
          </Panel>
        )}
      </div>
    </>
  );
}
