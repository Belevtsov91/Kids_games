import { useEffect, useRef, useState } from 'react';
import type { Look, LookPrefs } from './look';
import { useDashText } from './text';

interface Props extends LookPrefs {
  update(patch: Partial<LookPrefs>): void;
}

/** Кнопка «Вид» в верхней панели: яркий или спокойный дашборд и показывать ли мишку Тёпу. */
export function LookSwitch({ look, mascot, update }: Props) {
  const d = useDashText();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('pointerdown', onDown);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onDown);
      removeEventListener('keydown', onKey);
    };
  }, [open]);

  const option = (value: Look, title: string, hint: string) => (
    <button type="button" role="menuitemradio" aria-checked={look === value} aria-current={look === value} onClick={() => update({ look: value })}>
      {title} <small>{hint}</small>
    </button>
  );

  return (
    <div className="dash-profile dash-look" ref={box}>
      <button type="button" className="dash-chip" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-testid="look-switch">
        <span aria-hidden="true">{look === 'calm' ? '🌙' : '🌅'}</span>
        <span className="dash-look-label">{d.button}</span>
      </button>
      {open && (
        <div className="dash-menu" role="menu" aria-label={d.title}>
          <div className="dash-menu-title">{d.title}</div>
          {option('bright', d.bright, d.brightHint)}
          {option('calm', d.calm, d.calmHint)}
          <button type="button" role="menuitemcheckbox" aria-checked={mascot} className="dash-look-mascot" onClick={() => update({ mascot: !mascot })}>
            🐻 {d.mascot} <small>{mascot ? d.mascotOn : d.mascotOff}</small>
          </button>
        </div>
      )}
    </div>
  );
}
