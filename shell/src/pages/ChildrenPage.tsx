import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { AdultOverlay } from '@/account/AdultOverlay';

const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐸', '🦁', '🐯', '🐨', '🐵', '🦄', '🐙', '🐳'];
const AGES = Array.from({ length: 13 }, (_, i) => i + 3);

/** Кто играет: выбор профиля ребёнка и добавление нового. */
export function ChildrenPage() {
  const { me, addChild, selectChild, logout } = useAuth();
  const { t, locale } = useI18n();
  const c = t.children;
  const navigate = useNavigate();
  const children = me?.children ?? [];
  const [adding, setAdding] = useState(children.length === 0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [age, setAge] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Сервер ответил 423: у текущего ребёнка кончилось время, сменить профиль может только взрослый.
  const [locked, setLocked] = useState<{ reason: 'limit' | 'quiet' | 'rules'; retry: () => void } | null>(null);
  const lockedBy = (err: unknown, retry: () => void) => {
    if (!(err instanceof ApiError) || err.status !== 423) return false;
    setLocked({ reason: err.data?.reason === 'quiet' || err.data?.reason === 'rules' ? err.data.reason : 'limit', retry });
    return true;
  };

  const pick = async (childId: string) => {
    try {
      await selectChild(childId);
      navigate('/dashboard');
    } catch (err) {
      if (!lockedBy(err, () => void pick(childId))) throw err;
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get('name'));
    await create(name);
  };

  const create = async (name: string) => {
    setBusy(true);
    setError(null);
    try {
      await addChild({ name, age, avatar });
      navigate('/dashboard');
    } catch (err) {
      setBusy(false);
      if (lockedBy(err, () => void create(name))) return;
      const status = err instanceof ApiError ? err.status : -1;
      setError(status === 409 ? c.tooMany : status === -1 ? t.auth.offline : c.checkName);
    }
  };

  // Новый аккаунт без детей — сразу в настройку за минуту: ребёнок, время, PIN.
  if (me && children.length === 0 && !locked) return <Navigate to="/setup" replace />;

  return (
    <main className="children">
      <header className="topbar">
        <span className="topbar-greeting">
          <Link to="/" className="topbar-back" aria-label={t.common.home} title={t.common.home}>
            ←
          </Link>
          {c.hello(me?.parent.name ?? '')}
        </span>
        <button className="btn btn-small" onClick={() => void logout()}>
          {t.common.logout}
        </button>
      </header>

      <h1>{c.title}</h1>

      {children.length > 0 && (
        <div className="child-grid">
          {children.map((child) => (
            <button key={child.id} className="child-card" onClick={() => void pick(child.id)}>
              <span className="child-avatar">{child.avatar}</span>
              <span>{child.name}</span>
              <span className="child-age">{ageText(locale, child.age)}</span>
            </button>
          ))}
          {!adding && (
            <button className="child-card child-card-add" onClick={() => setAdding(true)}>
              <span className="child-avatar">➕</span>
              <span>{c.add}</span>
            </button>
          )}
        </div>
      )}

      {adding && (
        <form className="child-form" onSubmit={onSubmit}>
          <h2>{c.newProfile}</h2>
          <label>
            {c.name}
            <input name="name" required maxLength={40} autoComplete="off" />
          </label>

          <fieldset>
            <legend>{c.age}</legend>
            <div className="age-picker">
              {AGES.map((a) => (
                <button type="button" key={a} aria-pressed={a === age} onClick={() => setAge(a)}>
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>{c.avatar}</legend>
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
                {t.common.cancel}
              </button>
            )}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? c.saving : c.done}
            </button>
          </div>
        </form>
      )}

      {locked && (
        <AdultOverlay
          reason={locked.reason}
          onClose={() => setLocked(null)}
          onUnlocked={() => {
            const { retry } = locked;
            setLocked(null);
            retry();
          }}
        />
      )}
    </main>
  );
}
