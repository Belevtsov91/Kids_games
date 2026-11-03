import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthText } from '../text';
import { checkEmail, LIMITS } from '../validation';
import { serverMessage, statusOf } from './errors';
import { Field, PasswordField } from './fields';
import { useAuthFx } from './fxContext';
import { LockIcon, MailIcon } from './icons';
import { SuccessPane } from './SuccessPane';
import { EmailHint, useFocusFx } from './shared';

const MAX_TRIES = 3;
const FREEZE_S = 15;

export function LoginForm() {
  const { login, refresh } = useAuth();
  const { t } = useI18n();
  const a = t.auth;
  const text = useAuthText();
  const fx = useAuthFx();
  const focus = useFocusFx();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [touched, setTouched] = useState({ email: false, pass: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [frozen, setFrozen] = useState(0);
  const [done, setDone] = useState(false);
  const passRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const em = checkEmail(email);
  const passErr = !pass ? text.passEmpty : pass.length < LIMITS.passMin ? text.passShort : null;
  const emailMsg = touched.email && em.error ? text.email[em.error] : null;
  const passMsg = touched.pass ? passErr : null;

  useEffect(() => fx.set({ lit: [!em.error, pass.length > 0, false, false], gems: pass.length }), [em.error, pass, fx]);

  // обратный отсчёт заморозки после слишком многих попыток
  useEffect(() => {
    if (frozen <= 0) return;
    const id = setTimeout(() => {
      if (frozen === 1) {
        fx.set({ frozen: false });
        setTries(MAX_TRIES);
        setError(null);
        fx.say(text.say.thawed);
      }
      setFrozen(frozen - 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [frozen, fx, text]);

  const freeze = () => {
    setFrozen(FREEZE_S);
    fx.set({ frozen: true });
    fx.say(text.say.frozen, 3000);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || frozen > 0) return;
    setTouched({ email: true, pass: true });
    if (em.error || passErr) {
      fx.wrong();
      fx.say(text.say.fix);
      (em.error ? emailRef : passRef).current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    fx.set({ thinking: true });
    fx.say(text.say.thinking, 1500);
    try {
      await login({ email: email.trim(), password: pass }, { silent: true });
      fx.set({ thinking: false, focus: null });
      fx.win();
      fx.say(text.say.winLogin, 3500);
      setDone(true);
      setTimeout(() => void refresh(), 2600);
    } catch (err) {
      fx.set({ thinking: false, gems: 0 });
      setBusy(false);
      fx.wrong();
      const status = statusOf(err);
      setError(serverMessage(err, a));
      if (status === 429) return freeze();
      if (status !== 401) return;
      const left = tries - 1;
      setTries(left);
      setPass('');
      setTouched((s) => ({ ...s, pass: false }));
      passRef.current?.focus();
      if (left <= 0) return freeze();
      fx.say(left === 1 ? text.say.lastTry : text.say.wrong);
    }
  };

  if (done) return <SuccessPane icon="🗝️" title={text.loginWin} lead={text.loginWinText} onNext={() => void refresh()} />;

  return (
    <section className="au-pane">
      <h1>
        {text.loginTitle[0]}
        <span className="au-hl">{text.loginTitle[1]}</span>
      </h1>
      <p className="au-lead-text">{text.loginLead}</p>
      <form className="au-form" onSubmit={onSubmit} noValidate>
        <Field
          id="login-email"
          ref={emailRef}
          label={a.email}
          icon={<MailIcon />}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          placeholder={text.emailPh}
          value={email}
          state={emailMsg ? 'error' : email && !em.error ? 'valid' : 'idle'}
          message={emailMsg ?? (em.hint && <EmailHint hint={em.hint} onPick={setEmail} />)}
          onChange={(e) => {
            const v = e.target.value;
            if (v.length > email.length) fx.letter(v.slice(-1));
            setEmail(v);
            fx.set({ typeLen: v.length });
          }}
          onBlur={() => {
            setTouched((s) => ({ ...s, email: email.length > 0 || s.email }));
            focus.blur();
          }}
          onFocus={() => focus.on('email', email.length)}
        />
        <PasswordField
          id="login-pass"
          ref={passRef}
          label={a.password}
          icon={<LockIcon />}
          name="password"
          autoComplete="current-password"
          maxLength={LIMITS.passMax}
          placeholder={text.passPh}
          value={pass}
          state={passMsg ? 'error' : 'idle'}
          message={passMsg}
          onChange={(e) => setPass(e.target.value)}
          onFocus={() => focus.on('pass', 0)}
          onBlur={focus.blur}
          onPeek={focus.peek}
        />
        {tries < MAX_TRIES && (
          <div className="au-tries" aria-live="polite">
            {Array.from({ length: MAX_TRIES }, (_, i) => (
              <i key={i} className={i < tries ? '' : 'is-off'} />
            ))}
            <span>{frozen > 0 ? text.frozen(frozen) : text.triesLeft(tries)}</span>
          </div>
        )}
        {error && <p className="form-error au-alert" role="alert">{error}</p>}
        <button className={`au-submit${busy ? ' is-busy' : ''}${frozen > 0 ? ' is-frozen' : ''}`} disabled={busy}>
          <span className="au-spinner" aria-hidden="true" />
          {frozen > 0 ? text.wait(frozen) : busy ? a.loggingIn : t.common.login}
        </button>
      </form>
    </section>
  );
}
