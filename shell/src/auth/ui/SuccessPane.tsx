import { useEffect, useRef } from 'react';
import { useAuthText } from '../text';

/** Экран после входа или регистрации: значок, приветствие и кнопка, если не хочется ждать конца анимации. */
export function SuccessPane({ icon, title, lead, onNext }: { icon: string; title: string; lead: string; onNext(): void }) {
  const text = useAuthText();
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <section className="au-pane au-success" aria-live="polite">
      <div className="au-badge" aria-hidden="true">{icon}</div>
      <h2 ref={ref} tabIndex={-1}>{title}</h2>
      <p className="au-lead-text">{lead}</p>
      <button type="button" className="au-submit" onClick={onNext}>
        {text.next}
      </button>
    </section>
  );
}
