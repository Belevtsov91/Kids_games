import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';

const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐸', '🦁', '🐯', '🐨', '🐵', '🦄', '🐙', '🐳'];
const AGES = Array.from({ length: 13 }, (_, i) => i + 3);
const yearsWord = (n: number) => (n % 10 >= 2 && n % 10 <= 4 && (n < 12 || n > 14) ? 'года' : 'лет');

/** Кто играет: выбор профиля ребёнка и добавление нового. */
export function ChildrenPage() {
  const { me, addChild, selectChild, logout } = useAuth();
  const navigate = useNavigate();
  const children = me?.children ?? [];
  const [adding, setAdding] = useState(children.length === 0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [age, setAge] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (childId: string) => {
    await selectChild(childId);
    navigate('/dashboard');
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addChild({ name: String(new FormData(e.currentTarget).get('name')), age, avatar });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError && err.status !== 400 ? err.message : 'Проверьте имя.');
      setBusy(false);
    }
  };

  return (
    <main className="children">
      <header className="topbar">
        <span className="topbar-greeting">
          <Link to="/" className="topbar-back" aria-label="На главную" title="На главную">
            ←
          </Link>
          Здравствуйте, {me?.parent.name}!
        </span>
        <button className="btn btn-small" onClick={() => void logout()}>
          Выйти
        </button>
      </header>

      <h1>Кто будет играть?</h1>

      {children.length > 0 && (
        <div className="child-grid">
          {children.map((child) => (
            <button key={child.id} className="child-card" onClick={() => void pick(child.id)}>
              <span className="child-avatar">{child.avatar}</span>
              <span>{child.name}</span>
              <span className="child-age">{child.age} {yearsWord(child.age)}</span>
            </button>
          ))}
          {!adding && (
            <button className="child-card child-card-add" onClick={() => setAdding(true)}>
              <span className="child-avatar">➕</span>
              <span>Добавить</span>
            </button>
          )}
        </div>
      )}

      {adding && (
        <form className="child-form" onSubmit={onSubmit}>
          <h2>Новый профиль</h2>
          <label>
            Имя ребёнка
            <input name="name" required maxLength={40} autoComplete="off" />
          </label>

          <fieldset>
            <legend>Возраст</legend>
            <div className="age-picker">
              {AGES.map((a) => (
                <button type="button" key={a} aria-pressed={a === age} onClick={() => setAge(a)}>
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Аватарка</legend>
            <div className="avatar-picker">
              {AVATARS.map((a) => (
                <button type="button" key={a} aria-pressed={a === avatar} aria-label={a} onClick={() => setAvatar(a)}>
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="child-form-actions">
            {children.length > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>
                Отмена
              </button>
            )}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Сохраняем…' : 'Готово'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
