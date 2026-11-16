// Шифровальное колесо: внешнее кольцо — буквы шифровки, внутреннее — настоящие буквы.
// Внутреннее кольцо поворачивается на shift шагов: напротив буквы шифровки C оказывается decode(C, shift).
import { lettersOf } from '../game/caesar';
import { svg } from './dom';

const SIZE = 320;
const C = SIZE / 2;

export interface Wheel {
  el: SVGSVGElement;
  /** Поворот внутреннего кольца на shift шагов (может быть любым целым — колесо крутится без скачков). */
  turn(shift: number): void;
  /** Подсветить буквы шифровки на внешнем кольце. */
  mark(letters: string): void;
}

export function createWheel(alphabet: string, title: string): Wheel {
  const letters = lettersOf(alphabet);
  const step = 360 / letters.length;
  const big = letters.length > 30;

  const ring = (radius: number, cls: string, fontSize: number) =>
    letters.map((letter, i) => {
      const angle = ((i * step - 90) * Math.PI) / 180;
      return svg('text', {
        x: (C + radius * Math.cos(angle)).toFixed(1),
        y: (C + radius * Math.sin(angle)).toFixed(1),
        class: cls,
        'font-size': fontSize,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        transform: `rotate(${i * step} ${(C + radius * Math.cos(angle)).toFixed(1)} ${(C + radius * Math.sin(angle)).toFixed(1)})`,
        'data-letter': letter,
      }, [letter]);
    });

  const outer = svg('g', { class: 'cp-wheel-outer' }, [
    svg('circle', { cx: C, cy: C, r: C - 4, class: 'cp-wheel-rim' }),
    ...letters.map((_, i) => svg('circle', { cx: C, cy: C, r: C - 4, class: 'cp-wheel-tick', 'stroke-dasharray': `1 ${((2 * Math.PI * (C - 4)) / letters.length - 1).toFixed(2)}`, transform: `rotate(${i * step - 90 + step / 2} ${C} ${C})` })),
    ...ring(C - 26, 'cp-wheel-out', big ? 16 : 18),
  ]);
  const inner = svg('g', { class: 'cp-wheel-inner' }, [
    svg('circle', { cx: C, cy: C, r: C - 46, class: 'cp-wheel-disc' }),
    ...ring(C - 64, 'cp-wheel-in', big ? 13 : 15),
    svg('circle', { cx: C, cy: C, r: 18, class: 'cp-wheel-pin' }),
  ]);
  const pointer = svg('path', { d: `M ${C - 9} 6 L ${C + 9} 6 L ${C} 26 Z`, class: 'cp-wheel-pointer' });

  const el = svg('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'cp-wheel', role: 'img', 'aria-label': title }, [outer, inner, pointer]);
  const outLetters = Array.from(outer.querySelectorAll<SVGTextElement>('.cp-wheel-out'));

  return {
    el,
    turn(shift) {
      inner.style.transform = `rotate(${shift * step}deg)`;
    },
    mark(word) {
      const wanted = new Set(Array.from(word));
      for (const t of outLetters) t.classList.toggle('is-marked', wanted.has(t.dataset.letter ?? ''));
    },
  };
}
