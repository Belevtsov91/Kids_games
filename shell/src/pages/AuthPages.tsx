import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';

// Формы входа и регистрации для взрослого. Пароль живёт только в состоянии формы до отправки
// на сервер; autocomplete подсказывает менеджеру паролей, но сами мы его нигде не сохраняем.

const messageOf = (err: unknown) =>
  err instanceof ApiError
    ? err.status === 429
      ? 'Слишком много попыток. Подождите немного.'
      : err.status === 400
        ? 'Проверьте поля формы.'
        : err.message
    : 'Нет связи с сервером.';

function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="auth">
      <Link to="/" className="auth-back" aria-label="На главную">
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
      setError(messageOf(err));
      setBusy(false);
    }
  };
  return { error, busy, onSubmit };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { error, busy, onSubmit } = useSubmit(async (form) => {
    await login({ email: String(form.get('email')), password: String(form.get('password')) });
    navigate('/dashboard', { replace: true });
  });

  return (
    <AuthCard title="Вход для взрослых" footer={<>Нет аккаунта? <Link to="/register">Регистрация</Link></>}>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Почта
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          Пароль
          <input name="password" type="password" autoComplete="current-password" required maxLength={72} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { error, busy, onSubmit } = useSubmit(async (form) => {
    const password = String(form.get('password'));
    if (password !== form.get('password2')) throw new ApiError(0, 'Пароли не совпадают.');
    await register({ name: String(form.get('name')), email: String(form.get('email')), password });
    navigate('/children', { replace: true });
  });

  return (
    <AuthCard title="Регистрация" footer={<>Уже есть аккаунт? <Link to="/login">Войти</Link></>}>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Ваше имя
          <input name="name" autoComplete="name" required maxLength={40} />
        </label>
        <label>
          Почта
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          Пароль (от 8 символов)
          <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </label>
        <label>
          Пароль ещё раз
          <input name="password2" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Создаём…' : 'Создать аккаунт'}
        </button>
      </form>
    </AuthCard>
  );
}
