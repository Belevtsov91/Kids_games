import { useRef, useState } from 'react';
import { SITE, isPlaceholder } from '../site';

/** Адрес поддержки с кнопкой «Скопировать». Если буфер обмена недоступен, выделяет адрес. */
export function CopyEmail() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle');

  const selectText = () => {
    const sel = getSelection();
    if (!ref.current || !sel) return;
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    sel.removeAllRanges();
    sel.addRange(range);
    setState('selected');
  };

  const copy = () => {
    if (!navigator.clipboard) return selectText();
    navigator.clipboard.writeText(SITE.email).then(() => setState('copied'), selectText);
  };

  return (
    <div className="ft-mail">
      <code ref={ref} className={isPlaceholder(SITE.email) ? 'is-placeholder' : undefined}>
        {SITE.email}
      </code>
      <button type="button" className="wl-btn wl-btn-ghost wl-btn-sm" onClick={copy}>
        {state === 'copied' ? 'Скопировано' : state === 'selected' ? 'Выделено' : 'Скопировать'}
      </button>
    </div>
  );
}
