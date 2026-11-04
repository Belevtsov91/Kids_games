import { useState, type FormEvent } from 'react';
import { errorCode, papi } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';

/** Смена пароля: текущий, новый дважды, по желанию — выйти на остальных устройствах. */
export function PasswordPage() {
  const p = useParentText();
  const w = p.password;
  const { toast } = useParent();
  const [f, setF] = useState({ current: '', next: '', again: '', others: true });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.next.length < 8) return setError(w.short);
    if (f.next !== f.again) return setError(w.mismatch);
    if (f.next === f.current) return setError(w.same);
    setBusy(true);
    setError(null);
    try {
      await papi.put('/password', { current: f.current, next: f.next, logoutOthers: f.others });
      setF({ current: '', next: '', again: '', others: true });
      toast(w.done);
    } catch (err) {
      setError(errorCode(err) === 'password' ? w.wrong : p.failed);
    }
    setBusy(false);
  };

  const field = (key: 'current' | 'next' | 'again', label: string, auto: string) => (
    <label className="pa-field">
      <span>{label}</span>
      <input id={`pw-${key}`} type="password" autoComplete={auto} value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} required />
    </label>
  );

  return (
    <>
      <PageHead back={{ to: '/parent/account', label: p.account.title }} title={w.title} />
      <Panel>
        <form className="pa-form pa-narrow" onSubmit={submit}>
          {field('current', w.current, 'current-password')}
          {field('next', w.next, 'new-password')}
          {field('again', w.again, 'new-password')}
          <label className="pa-check">
            <input type="checkbox" checked={f.others} onChange={(e) => setF({ ...f, others: e.target.checked })} />
            {w.others}
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div>
            <button className="pa-btn pa-btn-gold" disabled={busy}>{w.go}</button>
          </div>
        </form>
      </Panel>
    </>
  );
}
