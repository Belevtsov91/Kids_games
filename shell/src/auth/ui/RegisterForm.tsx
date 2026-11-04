import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthText } from '../text';
import { checkEmail, checkName, checkNewPassword, LIMITS, passScore } from '../validation';
import { serverMessage, statusOf } from './errors';
import { Field, PasswordField, type FieldState } from './fields';
import { useAuthFx } from './fxContext';
import { LockCheckIcon, LockIcon, MailIcon, UserIcon } from './icons';
import { PasswordMeter } from './PasswordMeter';
import { EmailHint, useFocusFx } from './shared';
import { SuccessPane } from './SuccessPane';

type Key = 'name' | 'email' | 'pass' | 'pass2' | 'agree';
const stateOf = (touched: boolean, error: string | null, filled: boolean): FieldState => (touched && error ? 'error' : filled && !error ? 'valid' : 'idle');

export function RegisterForm() {
  const { register, refresh } = useAuth();
  const { t } = useI18n();
  const a = t.auth;
  const text = useAuthText();
  const fx = useAuthFx();
  const focus = useFocusFx();
  const [v, setV] = useState({ name: '', email: '', pass: '', pass2: '', agree: false });
  const [touched, setTouched] = useState<Record<Key, boolean>>({ name: false, email: false, pass: false, pass2: false, agree: false });
  const [taken, setTaken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), pass: useRef<HTMLInputElement>(null), pass2: useRef<HTMLInputElement>(null), agree: useRef<HTMLInputElement>(null) };
  const best = useRef(0);

  const em = checkEmail(v.email);
  const nameErr = checkName(v.name);
  const passErr = checkNewPassword(v.pass, v.email);
  const errors: Record<Key, string | null> = {
    name: nameErr && text.name[nameErr],
    email: em.error ? text.email[em.error] : taken && taken === v.email.trim().toLowerCase() ? a.emailTaken : null,
    pass: passErr && text.newPass[passErr],
    pass2: !v.pass2 ? text.pass2Empty : v.pass2 !== v.pass ? a.mismatch : null,
    agree: v.agree ? null : text.agreeNeeded,
  };
  const show = (k: Key) => (touched[k] ? errors[k] : null);
  const score = passScore(v.pass);

  useEffect(() => {
    fx.set({ lit: [!errors.name, !errors.email, !errors.pass && !errors.pass2, v.agree], strength: score });
  }, [errors.name, errors.email, errors.pass, errors.pass2, v.agree, score, fx]);

  useEffect(() => {
    if (score > best.current && score >= 3) fx.say(score === 4 ? text.say.strong : text.say.good, 1600);
    best.current = Math.max(best.current, score);
  }, [score, fx, text]);

  const change = (k: Key, value: string | boolean) => setV((s) => ({ ...s, [k]: value }));
  const blur = (k: Key, filled: boolean) => {
    if (filled) setTouched((s) => ({ ...s, [k]: true }));
    focus.blur();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setTouched({ name: true, email: true, pass: true, pass2: true, agree: true });
    const first = (Object.keys(errors) as Key[]).find((k) => errors[k]);
    if (first) {
      fx.wrong();
      fx.say(text.say.fix);
      refs[first].current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    fx.set({ thinking: true });
    fx.say(text.say.building, 1600);
    try {
      await register({ name: v.name.trim(), email: v.email.trim(), password: v.pass }, { silent: true });
      fx.set({ thinking: false, focus: null });
      fx.win();
      fx.say(text.say.winRegister, 3500);
      setDone(true);
      setTimeout(() => void refresh(), 3000);
    } catch (err) {
      fx.set({ thinking: false });
      setBusy(false);
      fx.wrong();
      if (statusOf(err) === 409) {
        setTaken(v.email.trim().toLowerCase());
        refs.email.current?.focus();
      } else setError(serverMessage(err, a));
    }
  };

  if (done) return <SuccessPane icon="🏝️" title={text.registerWin(v.name.trim())} lead={text.registerWinText} onNext={() => void refresh()} />;

  return (
    <section className="au-pane">
      <h1>
        {text.registerTitle[0]}
        <span className="au-hl">{text.registerTitle[1]}</span>
      </h1>
      <p className="au-lead-text">{text.registerLead}</p>
      <form className="au-form" onSubmit={onSubmit} noValidate>
        <Field
          id="reg-name" ref={refs.name} label={a.name} icon={<UserIcon />} name="name" autoComplete="name" maxLength={LIMITS.name}
          placeholder={text.namePh} value={v.name} state={stateOf(touched.name, errors.name, !!v.name)} message={show('name')}
          onChange={(e) => {
            change('name', e.target.value);
            fx.setName(e.target.value.trim() || text.namePh);
            fx.set({ typeLen: e.target.value.length });
          }}
          onFocus={() => focus.on('name', v.name.length)}
          onBlur={() => blur('name', !!v.name)}
        />
        <Field
          id="reg-email" ref={refs.email} label={a.email} icon={<MailIcon />} name="email" type="email" inputMode="email" autoComplete="email"
          maxLength={LIMITS.email} placeholder={text.emailPh} value={v.email} state={stateOf(touched.email, errors.email, !!v.email)}
          message={show('email') ?? (em.hint && <EmailHint hint={em.hint} onPick={(h) => change('email', h)} />)}
          onChange={(e) => {
            if (e.target.value.length > v.email.length) fx.letter(e.target.value.slice(-1));
            change('email', e.target.value);
            fx.set({ typeLen: e.target.value.length });
          }}
          onFocus={() => focus.on('email', v.email.length)}
          onBlur={() => blur('email', !!v.email)}
        />
        <PasswordField
          id="reg-pass" ref={refs.pass} label={a.passwordHint} icon={<LockIcon />} name="password" autoComplete="new-password" maxLength={LIMITS.passMax}
          placeholder={text.newPassPh} value={v.pass} state={touched.pass && errors.pass ? 'error' : 'idle'} message={show('pass')}
          below={<PasswordMeter value={v.pass} />}
          onChange={(e) => change('pass', e.target.value)} onFocus={() => focus.on('pass', 0)} onBlur={() => blur('pass', !!v.pass)} onPeek={focus.peek}
        />
        <Field
          id="reg-pass2" ref={refs.pass2} label={a.passwordAgain} icon={<LockCheckIcon />} name="password2" type="password" autoComplete="new-password"
          maxLength={LIMITS.passMax} placeholder={text.pass2Ph} value={v.pass2}
          state={stateOf(touched.pass2 || v.pass2.length >= v.pass.length, errors.pass2, !!v.pass2)}
          message={touched.pass2 || (v.pass2 && v.pass2.length >= v.pass.length) ? errors.pass2 : null}
          onChange={(e) => change('pass2', e.target.value)} onFocus={() => focus.on('pass', 0)} onBlur={() => blur('pass2', !!v.pass2)}
        />
        <div className={`au-field au-agree is-${show('agree') ? 'error' : 'idle'}`}>
          <label className="au-check">
            <input
              ref={refs.agree} type="checkbox" checked={v.agree} aria-describedby="reg-agree-msg"
              onChange={(e) => {
                change('agree', e.target.checked);
                if (e.target.checked) fx.say(text.say.thanks, 1500);
              }}
            />
            <span>
              {text.agree[0]}<Link to="/terms" target="_blank">{text.agree[1]}</Link>{text.agree[2]}<Link to="/privacy" target="_blank">{text.agree[3]}</Link>
            </span>
          </label>
          <p id="reg-agree-msg" className={`au-msg${show('agree') ? ' is-error' : ''}`} aria-live="polite">{show('agree')}</p>
        </div>
        {error && <p className="form-error au-alert" role="alert">{error}</p>}
        <button className={`au-submit${busy ? ' is-busy' : ''}`} disabled={busy}>
          <span className="au-spinner" aria-hidden="true" />
          {busy ? a.creating : a.create}
        </button>
      </form>
    </section>
  );
}
