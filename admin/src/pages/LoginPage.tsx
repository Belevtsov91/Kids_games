import { useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import { ApiError, post } from '../api/client';
import { useI18n } from '../i18n';

// Вход: почта, пароль и код из приложения. На странице нет названия проекта.
// Первая настройка (или сброс при потере телефона) — по разовому секрету ADMIN_SETUP_TOKEN с сервера.

type Mode = 'login' | 'setup' | 'confirm';

export function LoginPage({ onDone }: { onDone: () => Promise<void> }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('login');
  const [fail, setFail] = useState('');
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{ email: string; token: string; secret: string; qr: string } | null>(null);

  const guard = async (work: () => Promise<void>) => {
    setBusy(true);
    setFail('');
    try {
      await work();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setFail(code === 'locked' ? t('err.locked') : code === 'weakPassword' ? t('login.weak') : code === 'code' ? t('err.code') : t('err.wrong'));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (mode === 'login') {
      void guard(async () => {
        await post('/auth/login', { email: f.email, password: f.password, code: f.code.replace(/\s/g, '') });
        await onDone();
      });
    } else if (mode === 'setup') {
      void guard(async () => {
        const res = await post<{ secret: string; uri: string }>('/auth/setup', { email: f.email, token: f.token, password: f.password });
        setSetup({ email: f.email, token: f.token, secret: res.secret, qr: await QRCode.toDataURL(res.uri, { margin: 1, width: 200 }) });
        setMode('confirm');
      });
    } else if (setup) {
      void guard(async () => {
        await post('/auth/setup/confirm', { email: setup.email, token: setup.token, code: f.code.replace(/\s/g, '') });
        setSetup(null);
        setMode('login');
      });
    }
  };

  return (
    <div className="login">
      <form className="box" onSubmit={submit} key={mode}>
        <b>{mode === 'login' ? t('login.title') : t('login.setupTitle')}</b>
        {mode !== 'confirm' && <input className="inp" id="login-email" name="email" type="email" placeholder={t('login.email')} autoComplete="username" required />}
        {mode === 'setup' && <input className="inp" id="login-token" name="token" type="password" placeholder={t('login.token')} autoComplete="off" required />}
        {mode !== 'confirm' && (
          <input className="inp" id="login-password" name="password" type="password" placeholder={mode === 'setup' ? t('login.newPassword') : t('login.password')}
            autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} minLength={mode === 'setup' ? 12 : 1} required />
        )}
        {mode === 'confirm' && setup && (
          <>
            <span className="note">{t('login.scan')}</span>
            <img src={setup.qr} width={200} height={200} alt="QR" />
            <span className="note">{t('login.orSecret')}</span>
            <span className="mono" style={{ overflowWrap: 'anywhere' }}>{setup.secret}</span>
          </>
        )}
        {mode !== 'setup' && <input className="inp mono" id="login-code" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder={t('login.code')} required />}
        {fail && <span className="fail">{fail}</span>}
        <button className="btn pri" disabled={busy}>{mode === 'login' ? t('login.enter') : mode === 'setup' ? t('next') : t('confirm')}</button>
        {mode === 'login' && <button className="btn sm" type="button" onClick={() => setMode('setup')}>{t('login.first')}</button>}
        {mode !== 'login' && <button className="btn sm" type="button" onClick={() => setMode('login')}>{t('login.back')}</button>}
      </form>
    </div>
  );
}
