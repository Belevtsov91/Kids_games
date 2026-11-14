/** Живой интерфейс: карточки наклоняются за курсором и ловят блик, за курсором идёт мягкое свечение.
 *  Только там, где есть мышь и не просили «меньше движения»: на телефонах и планшетах ничего не запускается. */
const TILT = '.child-card, .kid-tile';
const MAX_DEG = 7;

export function startMotion(): () => void {
  if (typeof matchMedia !== 'function') return () => {};
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const glow = document.createElement('div');
  glow.className = 'fx-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.append(glow);
  document.documentElement.classList.add('fx-on');

  let card: HTMLElement | null = null;
  let raf = 0;
  let x = 0, y = 0;

  const release = () => {
    if (!card) return;
    card.classList.remove('fx-tilt');
    for (const v of ['--rx', '--ry', '--mx', '--my']) card.style.removeProperty(v);
    card = null;
  };

  const apply = () => {
    raf = 0;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>(TILT) ?? null;
    if (hit !== card) {
      release();
      card = hit;
      card?.classList.add('fx-tilt');
    }
    if (!card) return;
    const box = card.getBoundingClientRect();
    const u = (x - box.left) / box.width, v = (y - box.top) / box.height;
    card.style.setProperty('--ry', `${((u - 0.5) * 2 * MAX_DEG).toFixed(2)}deg`);
    card.style.setProperty('--rx', `${((0.5 - v) * 2 * MAX_DEG).toFixed(2)}deg`);
    card.style.setProperty('--mx', `${(u * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(v * 100).toFixed(1)}%`);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    glow.classList.add('is-on');
    raf ||= requestAnimationFrame(apply);
  };
  const onLeave = () => {
    glow.classList.remove('is-on');
    release();
  };

  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
    release();
    glow.remove();
    document.documentElement.classList.remove('fx-on');
  };
}
