import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthText } from '../text';

interface Props {
  icon: string;
  title: string;
  lead: string;
  /** Спросить сервер, кто вошёл: true — ответ есть, страница сама уйдёт дальше. */
  onNext(): Promise<boolean>;
  /** Через сколько мс перейти дальше самим, когда доиграет анимация. */
  autoMs?: number;
}

/** Экран после входа или регистрации: значок, приветствие и кнопка, если не хочется ждать конца анимации. */
export function SuccessPane({ icon, title, lead, onNext, autoMs }: Props) {
  const text = useAuthText();
  const ref = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => ref.current?.focus(), []);

  const next = useCallback(async () => {
    setBusy(true);
    const ok = await onNext();
    setBusy(false);
    setFailed(!ok);
  }, [onNext]);

  useEffect(() => {
    if (!autoMs) return;
    const id = setTimeout(() => void next(), autoMs);
    return () => clearTimeout(id);
  }, [autoMs, next]);

  return (
    <section className="au-pane au-success" aria-live="polite">
      <div className="au-badge" aria-hidden="true">{icon}</div>
      <h2 ref={ref} tabIndex={-1}>{title}</h2>
      <p className="au-lead-text">{lead}</p>
      {failed && <p className="form-error au-alert" role="alert">{text.nextFailed}</p>}
      <button type="button" className={`au-submit${busy ? ' is-busy' : ''}`} onClick={() => void next()} disabled={busy}>
        <span className="au-spinner" aria-hidden="true" />
        {text.next}
      </button>
    </section>
  );
}
