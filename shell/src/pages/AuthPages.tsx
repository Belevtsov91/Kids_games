import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import type { Dict } from '@/i18n/dict';

// Формы входа и регистрации для взрослого. Пароль живёт только в состоянии формы до отправки
// на сервер; autocomplete подсказывает менеджеру паролей, но сами мы его нигде не сохраняем.

/** Ошибку сервера показываем на языке сайта по коду ответа: текст сервера всегда русский. */
const messageOf = (err: unknown, a: Dict['auth']) => {
  if (!(err instanceof ApiError)) return a.offline;
  switch (err.status) {
    case 0: return err.message;
    case 400: return a.checkFields;
    case 401: return a.wrongLogin;
    case 409: return a.emailTaken;
    case 429: return a.tooMany;
    case 503: return a.unavailable;
    default: return a.offline;
  }
};

function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="auth">
      <Link to="/" className="auth-back" aria-label={t.common.home}>
        ⬅
      </Link>
      <div className="auth-card">
        <div className="auth-mascot" aria-hidden="true">
          🐻
        </div>
        <h1>{title}</h1>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  );
}

function useSubmit(action: (form: FormData) => Promise<void>) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await action(form);
    } catch (err) {
      setError(messageOf(err, t.auth));
      setBusy(false);
    }
  };
  return { error, busy, onSubmit };
}

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const a = t.auth;
  const navigate = useNavigate();
  const { error, busy, onSubmit } = useSubmit(async (form) => {
    await login({ email: String(form.get('email')), password: String(form.get('password')) });
    navigate('/dashboard', { replace: true });
  });

  return (
    <AuthCard title={a.loginTitle} footer={<>{a.noAccount} <Link to="/register">{t.common.register}</Link></>}>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          {a.email}
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          {a.password}
          <input name="password" type="password" autoComplete="current-password" required maxLength={72} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? a.loggingIn : t.common.login}
        </button>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const a = t.auth;
  const navigate = useNavigate();
  const { error, busy, onSubmit } = useSubmit(async (form) => {
    const password = String(form.get('password'));
    if (password !== form.get('password2')) throw new ApiError(0, a.mismatch);
    await register({ name: String(form.get('name')), email: String(form.get('email')), password });
    navigate('/children', { replace: true });
  });

  return (
    <AuthCard title={a.registerTitle} footer={<>{a.haveAccount} <Link to="/login">{t.common.login}</Link></>}>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          {a.name}
          <input name="name" autoComplete="name" required maxLength={40} />
        </label>
        <label>
          {a.email}
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          {a.passwordHint}
          <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </label>
        <label>
          {a.passwordAgain}
          <input name="password2" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? a.creating : a.create}
        </button>
      </form>
    </AuthCard>
  );
}
