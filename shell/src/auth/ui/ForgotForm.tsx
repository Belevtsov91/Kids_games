import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { api } from '@/api/client';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthText } from '../text';
import { checkEmail, LIMITS } from '../validation';
import { serverMessage } from './errors';
import { Field } from './fields';
import { useAuthFx } from './fxContext';
import { MailIcon } from './icons';
import { EmailHint, useFocusFx } from './shared';

// «Забыли пароль?»: почта → письмо со ссылкой. Сервер отвечает одинаково, есть такая почта или нет,
// поэтому и мы всегда показываем «Письмо улетело», не подтверждая, что аккаунт существует.

export function ForgotForm() {
  const { t, locale } = useI18n();
  const a = t.auth;
  const text = useAuthText();
  const f = text.forgot;
  const fx = useAuthFx();
  const focus = useFocusFx();
  const initial = (useLocation().state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  const em = checkEmail(email);
  const emailMsg = touched && em.error ? text.email[em.error] : null;

  useEffect(() => fx.set({ lit: [!em.error, !!sent, false, false], gems: 0 }), [em.error, sent, fx]);
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    if (em.error) {
      fx.wrong();
      fx.say(text.say.fix);
      emailRef.current?.focus();
      return;
    }
    const address = email.trim();
    setBusy(true);
    setError(null);
    fx.set({ thinking: true });
    try {
      await api.post('/auth/forgot', { email: address, locale });
      fx.set({ thinking: false, focus: null });
      // письмо «улетает» в почтовый ящик на острове
      for (const [i, ch] of [...'✉✉✉'].entries()) setTimeout(() => fx.letter(ch), i * 220);
      fx.say(f.say.sent, 3200);
      setSent(address);
    } catch (err) {
      fx.set({ thinking: false });
      fx.wrong();
      setError(serverMessage(err, a));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <section className="au-pane au-success" aria-live="polite">
        <div className="au-badge" aria-hidden="true">💌</div>
        <h2 ref={sentRef} tabIndex={-1}>{f.sentTitle}</h2>
        <p className="au-lead-text">{f.sentText(sent)}</p>
        <Link to="/login" replace className="au-submit au-submit-link">{f.back}</Link>
        <button type="button" className="au-link au-again" onClick={() => setSent(null)}>{f.again}</button>
      </section>
    );

  return (
    <section className="au-pane">
      <h1>
        {f.title[0]}
        <span className="au-hl">{f.title[1]}</span>
      </h1>
      <p className="au-lead-text">{f.lead}</p>
      <form className="au-form" onSubmit={onSubmit} noValidate>
        <Field
          id="forgot-email"
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
            setTouched((s) => email.length > 0 || s);
            focus.blur();
          }}
          onFocus={() => focus.on('email', email.length)}
        />
        {error && <p className="form-error au-alert" role="alert">{error}</p>}
        <button className={`au-submit${busy ? ' is-busy' : ''}`} disabled={busy}>
          <span className="au-spinner" aria-hidden="true" />
          {busy ? f.sending : f.send}
        </button>
      </form>
    </section>
  );
}
