import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { papi } from '@/parent/api';
import { DashSky } from '@/dashboard/DashSky';
import { useI18n } from '@/i18n/I18nProvider';
import { AVATARS } from '@/parent/ui/fields';
import { useMoreText } from '../text';

const LIMITS = [null, 30, 45, 60, 90] as const;
const AGES = Array.from({ length: 13 }, (_, i) => i + 3);

/**
 * Первая настройка (/setup) сразу после регистрации: ребёнок → время в день → PIN.
 * Без неё лимиты и PIN прячутся в кабинете, и большинство родителей их не находит.
 */
export function SetupPage() {
  const s = useMoreText().setup;
  const { t } = useI18n();
  const { me, addChild, selectChild } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [childId, setChildId] = useState<string | null>(null);
  const [age, setAge] = useState(4);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [limit, setLimit] = useState<number | null>(45);
  const [quiet, setQuiet] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (me && me.children.length > 0 && step === 0 && !busy && !childId) return <Navigate to="/children" replace />;

  const createChild = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const name = String(new FormData(e.currentTarget).get('name'));
      const child = await addChild({ name, age, avatar });
      setChildId(child?.id ?? null);
      setStep(1);
    } catch {
      setError(t.children.checkName);
    }
    setBusy(false);
  };

  const finish = async (withPin: boolean) => {
    if (!childId) return navigate('/children');
    setBusy(true);
    setError(null);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await papi.raw.post('/setup', { childId, limit, quiet, tz, ...(withPin && pin ? { pin } : {}) });
    } catch (err) {
      if (err instanceof ApiError && err.data?.code === 'weak') {
        setBusy(false);
        return setError(s.weak);
      }
      // 409 — настройка уже пройдена: просто идём играть.
    }
    await selectChild(childId).catch(() => undefined);
    navigate('/dashboard');
  };

  return (
    <div className="dash setup">
      <DashSky />
      <main className="dash-wrap setup-main">
        <span className="dash-eyebrow">{s.eyebrow}</span>
        <ol className="setup-steps">
          {s.steps.map((name, i) => (
            <li key={name} className={i === step ? 'is-now' : i < step ? 'is-done' : ''}>{name}</li>
          ))}
        </ol>

        {step === 0 && (
          <form className="setup-card" onSubmit={(e) => void createChild(e)}>
            <h1>{s.childTitle}</h1>
            <label className="setup-field">{t.children.name}<input name="name" required maxLength={40} autoComplete="off" /></label>
            <div className="setup-chips" role="group" aria-label={t.children.age}>
              {AGES.map((a) => <button key={a} type="button" aria-pressed={a === age} onClick={() => setAge(a)}>{a}</button>)}
            </div>
            <div className="setup-chips setup-avatars" role="group" aria-label={t.children.avatar}>
              {AVATARS.map((a) => <button key={a} type="button" aria-pressed={a === avatar} onClick={() => setAvatar(a)}>{a}</button>)}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="dash-btn dash-btn-primary" disabled={busy}>{s.next} →</button>
          </form>
        )}

        {step === 1 && (
          <div className="setup-card">
            <h1>{s.timeTitle}</h1>
            <p>{s.timeLead}</p>
            <div className="setup-chips" role="radiogroup">
              {LIMITS.map((l) => (
                <button key={String(l)} type="button" role="radio" aria-checked={l === limit} onClick={() => setLimit(l)}>{l === null ? s.noLimit : s.minutes(l)}</button>
              ))}
            </div>
            <label className="setup-check"><input type="checkbox" checked={quiet} onChange={(e) => setQuiet(e.target.checked)} /> {s.quiet}</label>
            <button type="button" className="dash-btn dash-btn-primary" onClick={() => setStep(2)}>{s.next} →</button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-card">
            <h1>{s.pinTitle}</h1>
            <p>{s.pinLead}</p>
            <input className="setup-pin" inputMode="numeric" maxLength={4} value={pin} aria-label={s.pinTitle} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="setup-actions">
              <button type="button" className="dash-btn" disabled={busy} onClick={() => void finish(false)}>{s.pinSkip}</button>
              <button type="button" className="dash-btn dash-btn-primary" disabled={busy || pin.length !== 4} onClick={() => void finish(true)}>{s.done}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
