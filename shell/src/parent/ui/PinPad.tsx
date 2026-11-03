import { useEffect, useState } from 'react';

/** Четыре точки и цифровая клавиатура. Поддерживает и клавиатуру компьютера. */
export function PinPad({ onComplete, disabled, eraseLabel }: { onComplete: (pin: string) => void; disabled?: boolean; eraseLabel: string }) {
  const [pin, setPin] = useState('');

  const press = (key: string) => {
    if (disabled) return;
    if (key === 'del') return setPin((v) => v.slice(0, -1));
    setPin((v) => {
      const next = (v + key).slice(0, 4);
      if (next.length === 4) {
        setTimeout(() => {
          onComplete(next);
          setPin('');
        }, 120);
      }
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  return (
    <div className="pin-pad">
      <div className="pin-dots" aria-label={`${pin.length}/4`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < pin.length ? 'f' : ''} />
        ))}
      </div>
      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button key={n} type="button" onClick={() => press(n)} disabled={disabled}>
            {n}
          </button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')} disabled={disabled}>0</button>
        <button type="button" className="pin-del" onClick={() => press('del')} aria-label={eraseLabel} disabled={disabled}>
          ⌫
        </button>
      </div>
    </div>
  );
}
