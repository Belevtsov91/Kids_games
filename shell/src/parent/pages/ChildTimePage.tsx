import { useEffect, useState } from 'react';
import { papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel, ToggleRow } from '../ui/bits';
import { QuietDay } from '../ui/QuietDay';
import { useChild } from './useChild';

const BREAKS = [0, 15, 20, 30, 45, 60];
const BONUS = [15, 30, 60];

/** Время ребёнка: лимиты будни/выходные, тихие часы, перерывы, просьбы и разовая прибавка. */
export function ChildTimePage() {
  const p = useParentText();
  const tt = p.time;
  const { toast } = useParent();
  const { id, child, save, reload } = useChild();
  const [r, setR] = useState(child?.rules);
  useEffect(() => setR(child?.rules), [child]);
  if (!child || !r) return null;

  const patch = (next: Partial<typeof r>, saveNow = true) => {
    const merged = { ...r, ...next };
    setR(merged);
    if (saveNow) void save(next);
  };
  const quietOn = Boolean(r.quietFrom && r.quietTo);

  const limitRow = (key: 'limitWeekday' | 'limitWeekend', label: string) => {
    const value = r[key];
    return (
      <div className="pa-limit">
        <ToggleRow id={`${key}-on`} label={label} hint={value === null ? tt.noLimit : p.hm(value)} checked={value !== null} onChange={(on) => patch({ [key]: on ? 60 : null })} />
        {value !== null && (
          <div className="pa-range">
            <input
              id={key}
              type="range"
              min={15}
              max={240}
              step={15}
              value={value}
              aria-label={label}
              onChange={(e) => patch({ [key]: Number(e.target.value) }, false)}
              onPointerUp={(e) => void save({ [key]: Number((e.target as HTMLInputElement).value) })}
              onKeyUp={(e) => void save({ [key]: Number((e.target as HTMLInputElement).value) })}
            />
            <output>{p.hm(value)}</output>
          </div>
        )}
      </div>
    );
  };

  const bonus = async (minutes: number) => {
    try {
      await papi.post(`/children/${id}/bonus`, { minutes });
      toast(tt.bonusDone(minutes));
      await reload();
    } catch {
      toast(p.failed);
    }
  };

  const t = child.time;
  return (
    <>
      <PageHead
        back={{ to: `/parent/kids/${id}`, label: child.name }}
        eyebrow={p.child.eyebrow}
        title={p.child.tiles.time[0]}
        lead={t.limit === null ? tt.todayFree(p.hm(t.usedMinutes)) : tt.today(p.hm(t.usedMinutes), p.hm(t.limit))}
      />
      <div className="pa-cols">
        <Panel title={tt.limits} lead={tt.limitsLead}>
          {limitRow('limitWeekday', tt.weekday)}
          {limitRow('limitWeekend', tt.weekend)}
          <label className="pa-field">
            <span>{tt.breaks}</span>
            <select id="break-every" value={r.breakEvery} onChange={(e) => patch({ breakEvery: Number(e.target.value) })}>
              {BREAKS.map((m) => (
                <option key={m} value={m}>{m ? tt.breakEvery(m) : tt.breakNever}</option>
              ))}
            </select>
          </label>
        </Panel>
        <Panel title={tt.quiet} lead={tt.quietLead}>
          <ToggleRow id="quiet-on" label={tt.quietOn} checked={quietOn} onChange={(on) => patch(on ? { quietFrom: '21:00', quietTo: '07:00' } : { quietFrom: null, quietTo: null })} />
          {quietOn && (
            <>
              <QuietDay from={r.quietFrom!} to={r.quietTo!} />
              <div className="pa-two">
                <label className="pa-field">
                  <span>{tt.from}</span>
                  <input id="quiet-from" type="time" value={r.quietFrom!} onChange={(e) => e.target.value && patch({ quietFrom: e.target.value })} />
                </label>
                <label className="pa-field">
                  <span>{tt.to}</span>
                  <input id="quiet-to" type="time" value={r.quietTo!} onChange={(e) => e.target.value && patch({ quietTo: e.target.value })} />
                </label>
              </div>
            </>
          )}
        </Panel>
      </div>
      <Panel>
        <ToggleRow id="can-ask" label={tt.ask} hint={tt.askLead} checked={r.canAsk} onChange={(canAsk) => patch({ canAsk })} />
        <div className="pa-row">
          <div className="pa-row-label">
            <b>{tt.bonus}</b>
            <span>{tt.bonusLead}</span>
          </div>
          <div className="pa-inline">
            {BONUS.map((m) => (
              <button key={m} type="button" className="pa-btn" onClick={() => void bonus(m)}>+{m}</button>
            ))}
          </div>
        </div>
      </Panel>
    </>
  );
}
