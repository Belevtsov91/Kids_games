import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { age as ageText } from '@/i18n/plural';
import { adultReason, AdultOverlay, type AdultReason } from '@/account/AdultOverlay';
import { DashSky } from '@/dashboard/DashSky';
import { LanguageSwitch } from '@/i18n/LanguageSwitch';

const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐸', '🦁', '🐯', '🐨', '🐵', '🦄', '🐙', '🐳'];
const AGES = Array.from({ length: 13 }, (_, i) => i + 3);
const THIS_YEAR = new Date().getFullYear();

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
  // Месяц рождения «YYYY-MM» вместо возраста (по желанию) и правила времени по возрасту (по умолчанию включены).
  const [birth, setBirth] = useState('');
  const [rules, setRules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Сервер ответил 423: правила времени, замок профиля или новый профиль — нужен взрослый.
  const [locked, setLocked] = useState<{ reason: AdultReason; retry: () => void } | null>(null);
  const lockedBy = (err: unknown, retry: () => void) => {
    const reason = adultReason(err);
    if (reason) setLocked({ reason, retry });
    return Boolean(reason);
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
      await addChild({ name, avatar, rules, ...(birth ? { birthMonth: birth } : { age }) });
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
    <div className="dash kid-pick">
      <DashSky />
      <header className="dash-top dash-wrap">
        <Link to="/" className="dash-logo vt-logo" aria-label={t.common.home}>
          <span className="dash-logo-mark" aria-hidden="true">🐻</span>
          <span className="dash-logo-name">Interact Games</span>
        </Link>
        <LanguageSwitch className="dash-lang" />
        <button type="button" className="dash-chip" onClick={() => void logout()}>
          {t.common.logout}
        </button>
      </header>
    <main className="children dash-wrap">
      <span className="dash-eyebrow">{c.hello(me?.parent.name ?? '')}</span>
      <h1>{c.title}</h1>

      {children.length > 0 && (
        <div className="child-grid">
          {children.map((child, i) => (
            <button key={child.id} className="child-card" style={{ '--i': i } as CSSProperties} onClick={() => void pick(child.id)}>
              <span className="child-avatar">{child.avatar}</span>
              <span>{child.name}</span>
              <span className="child-age">{ageText(locale, child.age)}</span>
              {child.locked && child.id !== me?.activeChildId && <span className="child-lock" title={c.lockedBadge} aria-label={c.lockedBadge}>🔒</span>}
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
                <button type="button" key={a} aria-pressed={!birth && a === age} disabled={Boolean(birth)} onClick={() => setAge(a)}>
                  {a}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="child-birth">
            {c.birth}
            <input type="month" min={`${THIS_YEAR - 16}-01`} max={`${THIS_YEAR - 2}-12`} value={birth} onChange={(e) => setBirth(e.target.value)} />
            <small>{c.birthHint}</small>
          </label>

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

          <label className="child-rules">
            <input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} /> <span>{c.rulesOn}</span>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="child-form-actions">
            {children.length > 0 && (
              <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setAdding(false)}>
                {t.common.cancel}
              </button>
            )}
            <button className="dash-btn dash-btn-primary" disabled={busy}>
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
    </div>
  );
}
