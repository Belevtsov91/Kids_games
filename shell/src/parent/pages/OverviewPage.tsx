import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { papi, type Account, type Overview } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { DayBars } from '../ui/DayBars';
import { Face } from '../ui/Face';
import { KidCard } from '../ui/KidCard';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

const MAX_CHILDREN = 10;

/** Обзор семьи: просьбы о времени, карточки детей, неделя, совет про PIN. */
export function OverviewPage() {
  const p = useParentText();
  const o = p.overview;
  const { me } = useAuth();
  const { toast } = useParent();
  const { data, reload } = useLoad(() => Promise.all([papi.get<Overview>('/overview'), papi.get<Account>('/account')]), []);
  const overview = data?.[0];
  const account = data?.[1];
  const kids = overview?.children ?? [];

  const answer = async (id: string, approve: boolean) => {
    const request = overview?.requests.find((r) => r.id === id);
    const kid = kids.find((k) => k.id === request?.child_id);
    try {
      await papi.post(`/requests/${id}`, { approve });
      if (kid && request) toast(approve ? o.approved(kid.name, request.minutes) : o.denied(kid.name));
    } catch {
      toast(p.failed);
    }
    await reload();
  };

  const family = kids[0]?.week.map((d, i) => ({ day: d.day, minutes: kids.reduce((s, k) => s + (k.week[i]?.minutes ?? 0), 0) })) ?? [];
  const showPinTip = account && !account.hasPin && kids.some((k) => k.age >= 8);

  return (
    <>
      <PageHead eyebrow={o.eyebrow} title={o.hello(me?.parent.name ?? '')} lead={o.lead} />

      {overview?.requests.map((r) => {
        const kid = kids.find((k) => k.id === r.child_id);
        if (!kid) return null;
        return (
          <div className="pa-request" key={r.id} data-testid="time-request">
            <Face photo={kid.photo} avatar={kid.avatar} size={48} />
            <div>
              <b>{o.asks(kid.name, r.minutes)}</b>
              <span>{o.askWhen}</span>
            </div>
            <div className="pa-request-actions">
              <button type="button" className="pa-btn pa-btn-mint" onClick={() => void answer(r.id, true)}>{o.allow(r.minutes)}</button>
              <button type="button" className="pa-btn pa-btn-quiet" onClick={() => void answer(r.id, false)}>{o.deny}</button>
            </div>
          </div>
        );
      })}

      {overview && kids.length === 0 && <p className="pa-empty">{o.empty}</p>}
      <div className="pa-kids">
        {kids.map((k) => (
          <KidCard key={k.id} child={k} />
        ))}
        {overview && kids.length < MAX_CHILDREN && (
          <Link to="/parent/kids/new" className="pa-kid pa-kid-add">
            <span className="pa-plus" aria-hidden="true">+</span>
            {o.add}
          </Link>
        )}
      </div>

      {showPinTip && (
        <div className="pa-tip">
          <span aria-hidden="true">💡</span>
          <p>{o.pinTip}</p>
          <Link to="/parent/account/pin" className="pa-btn">{o.pinTipGo}</Link>
        </div>
      )}

      {family.length > 0 && (
        <Panel title={o.week} lead={o.weekLead}>
          <DayBars days={family} dayNames={p.days} />
        </Panel>
      )}
    </>
  );
}
