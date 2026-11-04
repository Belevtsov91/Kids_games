import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { browserZone, errorCode, papi } from '../api';
import { useParentText } from '../text';
import { ChallengeView, type Challenge } from './ChallengeView';
import { PinStep } from './PinStep';

const COOLDOWN_S = 30;

/**
 * Вход в кабинет: задача для взрослых, потом PIN (если включён). Ответ проверяет только сервер.
 * purpose 'switch' — взрослый разрешает одну смену профиля, кабинет при этом не открывается.
 */
export function ParentGate({ hasPin, purpose, onUnlocked }: { hasPin: boolean; purpose?: 'switch'; onUnlocked: () => void }) {
  const p = useParentText();
  const [task, setTask] = useState<{ challenge: Challenge; token: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState<'puzzle' | 'pin'>('puzzle');
  const [error, setError] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(0);

  const next = useCallback(async () => {
    setAnswer('');
    try {
      setTask(await papi.raw.post('/challenge', {}));
    } catch {
      setError(p.offline);
    }
  }, [p.offline]);

  useEffect(() => void next(), [next]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const fail = (message: string) => {
    setError(message);
    setShake((n) => n + 1);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!task || !answer.trim() || cooldown) return;
    const body = { token: task.token, answer: Number(answer), tz: browserZone(), ...(purpose ? { purpose } : {}) };
    try {
      if (hasPin) {
        await papi.raw.post('/check', body);
        setError(null);
        setStep('pin');
      } else {
        await papi.raw.post('/unlock', body);
        onUnlocked();
      }
    } catch (err) {
      const code = errorCode(err);
      if (code === 'offline') return setError(p.offline);
      const failsNow = fails + 1;
      setFails(failsNow % 3);
      if (failsNow >= 3) setCooldown(COOLDOWN_S);
      fail(failsNow >= 3 ? p.gate.cooldown(COOLDOWN_S) : code === 'expired' ? p.gate.expired : p.gate.wrong);
      void next();
    }
  };

  return (
    <section className="gate">
      <aside className="gate-note">
        <b>{p.gate.how}</b>
        <ul>
          {p.gate.howList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>
      <div className={`gate-card${error ? ' is-error' : ''}`} key={shake} data-shake={shake > 0}>
        <span className="pa-eyebrow">{p.gate.eyebrow}</span>
        <h1>
          {p.gate.title[0]}
          <span className="dash-hl">{p.gate.title[1]}</span>
        </h1>
        <div className="gate-steps" aria-hidden="true">
          <i className="on" />
          {hasPin && <i className={step === 'pin' ? 'on' : ''} />}
        </div>
        {step === 'puzzle' ? (
          <>
            <p className="gate-lead">{p.gate.lead}</p>
            {task && <ChallengeView challenge={task.challenge} />}
            <form className="gate-answer" onSubmit={submit} autoComplete="off">
              <input
                id="gate-answer"
                inputMode="numeric"
                aria-label={p.gate.answer}
                placeholder={p.gate.answer}
                value={answer}
                disabled={cooldown > 0}
                onChange={(e) => setAnswer(e.target.value.replace(/[^\d-]/g, ''))}
                autoFocus
              />
              <button className="dash-btn dash-btn-primary" disabled={cooldown > 0 || !answer}>
                {p.gate.check}
              </button>
            </form>
            <p className="gate-msg" role="alert">{cooldown ? p.gate.cooldown(cooldown) : error}</p>
            <div className="gate-meta">
              <button type="button" className="pa-link" onClick={() => void next()}>{p.gate.other}</button>
              <Link to="/dashboard" className="pa-link">{p.gate.toGames}</Link>
            </div>
          </>
        ) : (
          task && <PinStep token={task.token} answer={Number(answer)} purpose={purpose} onUnlocked={onUnlocked} onFail={() => setShake((n) => n + 1)} />
        )}
      </div>
    </section>
  );
}
