import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { browserZone, errorCode, papi } from '../api';
import { useParentText } from '../text';
import { PinPad } from '../ui/PinPad';

/** Шаг 2: PIN. «Забыли PIN?» и блокировка после 5 ошибок — вход паролем аккаунта. */
export function PinStep({ token, answer, onUnlocked, onFail }: { token: string; answer: number; onUnlocked: () => void; onFail: () => void }) {
  const p = useParentText();
  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const unlock = async (extra: { pin?: string; password?: string }) => {
    setBusy(true);
    try {
      await papi.raw.post('/unlock', { token, answer, tz: browserZone(), ...extra });
      onUnlocked();
    } catch (err) {
      const code = errorCode(err);
      const left = err instanceof ApiError ? Number(err.data?.left) : NaN;
      if (code === 'pinLocked') {
        setMode('password');
        setError(p.gate.pinLocked);
      } else if (code === 'pin') setError(p.gate.pinWrong(left));
      else if (code === 'password') setError(p.gate.passwordWrong);
      else setError(code === 'offline' ? p.offline : p.gate.expired);
      onFail();
      setBusy(false);
    }
  };

  if (mode === 'password') {
    const submit = (e: FormEvent) => {
      e.preventDefault();
      if (password) void unlock({ password });
    };
    return (
      <form className="pa-form" onSubmit={submit}>
        <p className="gate-lead">{error ?? p.gate.pinLead}</p>
        <label className="pa-field">
          <span>{p.gate.password}</span>
          <input id="gate-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        <button className="dash-btn dash-btn-primary" disabled={busy || !password}>{p.gate.enter}</button>
      </form>
    );
  }

  return (
    <>
      <h2 className="gate-pin-title">{p.gate.pinTitle}</h2>
      <p className="gate-lead">{p.gate.pinLead}</p>
      <PinPad disabled={busy} eraseLabel={p.gate.erase} onComplete={(pin) => void unlock({ pin })} />
      <p className="gate-msg" role="alert">{error}</p>
      <div className="gate-meta">
        <button type="button" className="pa-link" onClick={() => setMode('password')}>{p.gate.forgot}</button>
      </div>
    </>
  );
}
