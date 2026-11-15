import { createContext, useCallback, useContext, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { useI18n, type Key } from '../i18n';

// Всплывающее сообщение, подтверждение опасного действия (слово + код из приложения) и простой ввод значения.

export interface DangerAnswer { confirm: string; code: string }
interface DangerAsk { title: string; text: string; word: string }
interface PromptAsk { title: string; label: string; value?: string; type?: 'text' | 'number' | 'email'; options?: { value: string; label: string }[] }

interface Feedback {
  toast: (text: string, bad?: boolean) => void;
  /** Спросить слово и код. null — отменили. */
  danger: (ask: DangerAsk) => Promise<DangerAnswer | null>;
  /** Спросить одно значение. null — отменили. */
  prompt: (ask: PromptAsk) => Promise<string | null>;
  /** Выполнить действие и показать итог; сообщение сервера переводим по коду ошибки, если он известен. */
  run: (work: () => Promise<unknown>, doneKey?: Key) => Promise<boolean>;
}

const Ctx = createContext<Feedback | null>(null);

const ERROR_KEYS: Record<string, Key> = {
  readonly: 'err.readonly', confirm: 'err.confirm', code: 'err.code', mail: 'err.mail', emailTaken: 'err.emailTaken',
  timezone: 'err.timezone', deleting: 'err.deleting', full: 'err.full', notResendable: 'err.notResendable', locked: 'err.locked', wrong: 'err.wrong',
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toast, setToast] = useState<{ text: string; bad: boolean } | null>(null);
  const [dangerAsk, setDangerAsk] = useState<DangerAsk | null>(null);
  const [promptAsk, setPromptAsk] = useState<PromptAsk | null>(null);
  const [fail, setFail] = useState('');
  const resolver = useRef<(value: never) => void>(() => undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string, bad = false) => {
    clearTimeout(timer.current);
    setToast({ text, bad });
    timer.current = setTimeout(() => setToast(null), bad ? 6000 : 3000);
  }, []);

  const errorText = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.code && ERROR_KEYS[err.code]) return t(ERROR_KEYS[err.code]);
      return err instanceof Error ? err.message : String(err);
    },
    [t],
  );

  const value: Feedback = {
    toast: showToast,
    danger: (ask) => new Promise((resolve) => { setFail(''); setDangerAsk(ask); resolver.current = resolve as (v: never) => void; }),
    prompt: (ask) => new Promise((resolve) => { setPromptAsk(ask); resolver.current = resolve as (v: never) => void; }),
    run: async (work, doneKey = 'done') => {
      try {
        await work();
        showToast(t(doneKey));
        return true;
      } catch (err) {
        if (!(err instanceof ApiError && err.code === 'auth')) showToast(errorText(err), true);
        return false;
      }
    },
  };

  const close = (answer: unknown) => {
    setDangerAsk(null);
    setPromptAsk(null);
    (resolver.current as (v: unknown) => void)(answer);
  };

  const submitDanger = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const confirm = String(form.get('word') ?? '').trim().toUpperCase();
    const code = String(form.get('code') ?? '').replace(/\s/g, '');
    if (confirm !== dangerAsk!.word) return setFail(t('err.confirm'));
    if (!/^\d{6}$/.test(code)) return setFail(t('danger.codeHint'));
    close({ confirm, code });
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {dangerAsk && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="box" onSubmit={submitDanger}>
            <h2>{dangerAsk.title}</h2>
            <p>{dangerAsk.text}</p>
            <label className="note" htmlFor="danger-word">{t('danger.word', { word: dangerAsk.word })}</label>
            <input className="inp" id="danger-word" name="word" autoComplete="off" autoFocus />
            <label className="note" htmlFor="danger-code">{t('danger.code')}</label>
            <input className="inp mono" id="danger-code" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" />
            {fail && <span className="fail">{fail}</span>}
            <div className="row">
              <button className="btn dng">{t('confirm')}</button>
              <button className="btn" type="button" onClick={() => close(null)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}
      {promptAsk && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="box" onSubmit={(e) => { e.preventDefault(); close(String(new FormData(e.currentTarget).get('value') ?? '').trim()); }}>
            <h2>{promptAsk.title}</h2>
            <label className="note" htmlFor="prompt-value">{promptAsk.label}</label>
            {promptAsk.options ? (
              <select className="inp" id="prompt-value" name="value" defaultValue={promptAsk.value} autoFocus>
                {promptAsk.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input className="inp" id="prompt-value" name="value" type={promptAsk.type ?? 'text'} defaultValue={promptAsk.value} required autoFocus />
            )}
            <div className="row">
              <button className="btn pri">{t('save')}</button>
              <button className="btn" type="button" onClick={() => close(null)}>{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}
      {toast && <div className={`toast${toast.bad ? ' bad' : ''}`} role="status">{toast.text}</div>}
    </Ctx.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('FeedbackProvider is missing');
  return ctx;
}
