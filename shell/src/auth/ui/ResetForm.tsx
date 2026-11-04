import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthText } from '../text';
import { checkNewPassword, LIMITS, passScore } from '../validation';
import { serverMessage, statusOf } from './errors';
import { Field, PasswordField } from './fields';
import { useAuthFx } from './fxContext';
import { LockCheckIcon, LockIcon } from './icons';
import { PasswordMeter } from './PasswordMeter';
import { useFocusFx } from './shared';
import { SuccessPane } from './SuccessPane';

// Страница из письма: /reset#<токен>. Токен после # не уходит ни на сервер со страницей, ни в Referer.
// Сначала спрашиваем сервер, жива ли ссылка; потом новый пароль. После сохранения сразу входим.

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
type Phase = 'checking' | 'form' | 'gone' | 'done';

export function ResetForm() {
  const { refresh } = useAuth();
  const { t } = useI18n();
  const a = t.auth;
  const text = useAuthText();
  const f = text.forgot;
  const fx = useAuthFx();
  const focus = useFocusFx();
  const navigate = useNavigate();
  const [token] = useState(() => window.location.hash.slice(1));
  const [phase, setPhase] = useState<Phase>(TOKEN_RE.test(token) ? 'checking' : 'gone');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const pass2Ref = useRef<HTMLInputElement>(null);

  // токен больше не нужен в адресной строке: убираем, чтобы он не попал в историю и скриншоты
  useEffect(() => {
    if (window.location.hash) void navigate('/reset', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (phase !== 'checking') return;
    api
      .post('/auth/reset/check', { token })
      .then(() => setPhase('form'))
      .catch((err) => (statusOf(err) === 410 || statusOf(err) === 400 ? setPhase('gone') : (setError(serverMessage(err, a)), setPhase('form'))));
  }, [phase, token, a]);

  useEffect(() => {
    if (phase !== 'gone') return;
    fx.wrong();
    // после приветствия мишки, иначе оно перекроет эту реплику
    const id = setTimeout(() => fx.say(f.say.gone, 3200), 2300);
    return () => clearTimeout(id);
  }, [phase, fx, f]);

  const passErr = checkNewPassword(pass, '');
  const errors = { pass: passErr && text.newPass[passErr], pass2: !pass2 ? text.pass2Empty : pass2 !== pass ? a.mismatch : null };
  const score = passScore(pass);
  useEffect(() => fx.set({ lit: [!errors.pass, !errors.pass2, false, false], strength: score, gems: pass.length }), [errors.pass, errors.pass2, score, pass, fx]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    if (errors.pass || errors.pass2) {
      fx.wrong();
      fx.say(text.say.fix);
      (errors.pass ? passRef : pass2Ref).current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    fx.set({ thinking: true });
    fx.say(text.say.thinking, 1500);
    try {
      await api.post('/auth/reset', { token, password: pass });
      fx.set({ thinking: false, focus: null });
      fx.win();
      fx.say(text.say.winLogin, 3500);
      setPhase('done');
      setTimeout(() => void refresh(), 2800);
    } catch (err) {
      fx.set({ thinking: false });
      setBusy(false);
      if (statusOf(err) === 410) return setPhase('gone');
      fx.wrong();
      setError(serverMessage(err, a));
    }
  };

  if (phase === 'done') return <SuccessPane icon="🗝️" title={f.doneTitle} lead={f.doneText} onNext={() => void refresh()} />;
  if (phase === 'gone')
    return (
      <section className="au-pane au-success" aria-live="polite">
        <div className="au-badge" aria-hidden="true">🧊</div>
        <h2>{f.goneTitle}</h2>
        <p className="au-lead-text">{f.goneText}</p>
        <Link to="/forgot" replace className="au-submit au-submit-link">{f.newLink}</Link>
      </section>
    );

  return (
    <section className="au-pane">
      <h1>
        {f.resetTitle[0]}
        <span className="au-hl">{f.resetTitle[1]}</span>
      </h1>
      <p className="au-lead-text">{phase === 'checking' ? f.checking : f.resetLead}</p>
      <form className="au-form" onSubmit={onSubmit} noValidate aria-busy={phase === 'checking'}>
        <PasswordField
          id="reset-pass" ref={passRef} label={a.passwordHint} icon={<LockIcon />} name="password" autoComplete="new-password"
          maxLength={LIMITS.passMax} placeholder={text.newPassPh} value={pass} state={touched && errors.pass ? 'error' : 'idle'}
          message={touched ? errors.pass : null} below={<PasswordMeter value={pass} />}
          onChange={(e) => setPass(e.target.value)} onFocus={() => focus.on('pass', 0)} onBlur={focus.blur} onPeek={focus.peek}
        />
        <Field
          id="reset-pass2" ref={pass2Ref} label={a.passwordAgain} icon={<LockCheckIcon />} name="password2" type="password"
          autoComplete="new-password" maxLength={LIMITS.passMax} placeholder={text.pass2Ph} value={pass2}
          state={(touched || pass2.length >= pass.length) && pass2 ? (errors.pass2 ? 'error' : 'valid') : touched && errors.pass2 ? 'error' : 'idle'}
          message={touched || (pass2 && pass2.length >= pass.length) ? errors.pass2 : null}
          onChange={(e) => setPass2(e.target.value)} onFocus={() => focus.on('pass', 0)} onBlur={focus.blur}
        />
        {error && <p className="form-error au-alert" role="alert">{error}</p>}
        <button className={`au-submit${busy ? ' is-busy' : ''}`} disabled={busy || phase === 'checking'}>
          <span className="au-spinner" aria-hidden="true" />
          {busy ? f.saving : f.save}
        </button>
      </form>
    </section>
  );
}
