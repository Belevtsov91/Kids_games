import { h } from './dom';

const COLORS = ['#ff5d8f', '#ffb84d', '#ffe14d', '#5ce08a', '#4dc3ff', '#a98bff'];

/** Сыплет `count` конфетти поверх `root`; слой убирается сам. */
export function confetti(root: HTMLElement, count: number) {
  const layer = h('div', { class: 'le-confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < count; i++) {
    layer.append(
      h('i', {
        '--x': `${Math.random() * 100}%`,
        '--c': COLORS[i % COLORS.length],
        '--d': `${(Math.random() * 0.4).toFixed(2)}s`,
        '--r': `${Math.round(Math.random() * 720 - 360)}deg`,
        '--t': `${(1.2 + Math.random() * 0.9).toFixed(2)}s`,
      }),
    );
  }
  root.append(layer);
  window.setTimeout(() => layer.remove(), 2600);
}
