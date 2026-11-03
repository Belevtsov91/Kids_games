import { useState, type FormEvent } from 'react';
import { errorCode, papi, type Account } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

/** PIN кабинета: задать, сменить или выключить. Любое изменение подтверждается паролем. */
export function PinPage() {
  const p = useParentText();
  const n = p.pin;
  const { toast } = useParent();
  const { data, reload } = useLoad(() => papi.get<Account>('/account'), []);
  const [f, setF] = useState({ pin: '', again: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (pin: string | undefined) => {
    setBusy(true);
    setError(null);
    try {
      await papi.put('/pin', pin ? { pin, password: f.password } : { password: f.password });
      setF({ pin: '', again: '', password: '' });
      toast(pin ? n.savedOn : n.savedOff);
      await reload();
    } catch (err) {
      const code = errorCode(err);
      setError(code === 'weak' ? n.weak : code === 'password' ? n.wrong : p.failed);
    }
    setBusy(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(f.pin)) return setError(n.format);
    if (f.pin !== f.again) return setError(n.mismatch);
    void send(f.pin);
  };

  const digits = (key: 'pin' | 'again', label: string) => (
    <label className="pa-field">
      <span>{label}</span>
      <input
        id={`pin-${key}`}
        className="pa-pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={f[key]}
        onChange={(e) => setF({ ...f, [key]: e.target.value.replace(/\D/g, '') })}
      />
    </label>
  );

  return (
    <>
      <PageHead back={{ to: '/parent/account', label: p.account.title }} title={n.title} lead={n.lead} />
      <Panel>
        <p className={`pa-state ${data?.hasPin ? 'pa-state-play' : 'pa-state-idle'}`}>{data?.hasPin ? p.account.pinOn : p.account.pinOff}</p>
        <form className="pa-form pa-narrow" onSubmit={submit}>
          <div className="pa-two">
            {digits('pin', n.newPin)}
            {digits('again', n.again)}
          </div>
          <label className="pa-field">
            <span>{n.password}</span>
            <input id="pin-password" type="password" autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="pa-inline">
            <button className="pa-btn pa-btn-gold" disabled={busy}>{n.set}</button>
            {data?.hasPin && (
              <button type="button" className="pa-btn pa-btn-quiet" disabled={busy || !f.password} onClick={() => void send(undefined)}>
                {n.off}
              </button>
            )}
          </div>
        </form>
      </Panel>
    </>
  );
}
