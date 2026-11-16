// Часовая башня с настоящим циферблатом. Стрелки двигаются пальцем и «защёлкиваются» на делениях.
import { angleOf, handAngles, hourFromAngle, minuteFromAngle, norm, type ClockTime } from '../game/clock';
import { el } from './dom';

const CX = 150;
const CY = 190;
const R = 96;
type Hand = 'hour' | 'minute';

const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

function faceSvg(minuteLabels: boolean) {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = polar(i * 6, R - 4), b = polar(i * 6, i % 5 ? R - 10 : R - 16);
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke-width="${i % 5 ? 2 : 4}"/>`;
  }).join('');
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const p = polar((i + 1) * 30, R - 32);
    return `<text x="${p.x}" y="${p.y}">${i + 1}</text>`;
  }).join('');
  const minutes = minuteLabels
    ? Array.from({ length: 12 }, (_, i) => {
        const p = polar(i * 30, R + 17);
        return `<text x="${p.x}" y="${p.y}">${String(i * 5).padStart(2, '0')}</text>`;
      }).join('')
    : '';
  return `<svg viewBox="0 0 300 440" class="wc-tower-svg" aria-hidden="true">
  <path d="M150 6L262 92H38z" fill="#7d8ff0"/><path d="M150 6L262 92H150z" fill="#6c7ee0"/>
  <rect x="44" y="88" width="212" height="22" rx="10" fill="#e8946a"/>
  <rect x="56" y="108" width="188" height="320" rx="18" fill="#fbe8cc"/>
  <rect x="200" y="108" width="44" height="320" rx="12" fill="#f3d9b6"/>
  <rect x="124" y="340" width="52" height="88" rx="10" fill="#b27d5e"/>
  <circle cx="${CX}" cy="${CY}" r="${R + 12}" fill="#e8946a"/>
  <circle class="wc-face" cx="${CX}" cy="${CY}" r="${R}" fill="#fffdf8"/>
  <g class="wc-ticks" stroke="#9b90b8" stroke-linecap="round">${ticks}</g>
  <g class="wc-nums">${numbers}</g>
  <g class="wc-mins">${minutes}</g>
  <g class="wc-hand wc-hand-hour"><rect x="${CX - 7}" y="${CY - 54}" width="14" height="62" rx="7"/><rect class="wc-hit" x="${CX - 26}" y="${CY - 66}" width="52" height="66"/></g>
  <g class="wc-hand wc-hand-minute"><rect x="${CX - 4}" y="${CY - 84}" width="8" height="92" rx="4"/><rect class="wc-hit" x="${CX - 22}" y="${CY - 96}" width="44" height="76"/></g>
  <circle cx="${CX}" cy="${CY}" r="9" fill="#e8b84a"/>
</svg>`;
}

export interface Tower {
  node: HTMLElement;
  get(): ClockTime;
  set(t: ClockTime): void;
  /** Включить стрелки под палец; step — шаг минутной стрелки. Возвращает отключение. */
  enableDrag(step: number, onMove: (t: ClockTime, hand: Hand) => void): () => void;
  /** Подсветить стрелку, которую надо подвинуть. */
  flash(hand: Hand | null): void;
}

export function createTower(minuteLabels: boolean): Tower {
  const node = el('div', 'wc-tower', faceSvg(minuteLabels));
  const svg = node.querySelector('svg')!;
  const hands = { hour: svg.querySelector<SVGGElement>('.wc-hand-hour')!, minute: svg.querySelector<SVGGElement>('.wc-hand-minute')! };
  let time: ClockTime = { h: 12, m: 0 };

  const render = () => {
    const a = handAngles(time);
    hands.hour.style.transform = `rotate(${a.hour}deg)`;
    hands.minute.style.transform = `rotate(${a.minute}deg)`;
  };

  /** Центр циферблата и радиус в пикселях экрана: от них считаем угол пальца. */
  const geometry = () => {
    const r = svg.querySelector('.wc-face')!.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: r.width / 2 };
  };

  const enableDrag = (step: number, onMove: (t: ClockTime, hand: Hand) => void) => {
    let active: Hand | null = null;
    node.classList.add('is-live');
    const choose = (e: PointerEvent): Hand | null => {
      const g = geometry();
      const dist = Math.hypot(e.clientX - g.cx, e.clientY - g.cy) / g.radius;
      if (dist > 1.25) return null;
      const a = angleOf(e.clientX, e.clientY, g.cx, g.cy);
      const angles = handAngles(time);
      const diff = (b: number) => Math.min(norm(a - b), norm(b - a));
      const dh = diff(angles.hour), dm = diff(angles.minute);
      // Обе стрелки рядом — решает расстояние: ближе к центру берём короткую.
      if (dh < 30 && dm < 30) return dist < 0.62 ? 'hour' : 'minute';
      return dh < dm ? 'hour' : 'minute';
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const g = geometry();
      const a = angleOf(e.clientX, e.clientY, g.cx, g.cy);
      const next = active === 'minute' ? { h: time.h, m: minuteFromAngle(a, step) } : { h: hourFromAngle(a, time.m), m: time.m };
      if (next.h === time.h && next.m === time.m) return;
      time = next;
      render();
      onMove(time, active);
    };
    const down = (e: PointerEvent) => {
      active = choose(e);
      if (!active) return;
      node.setPointerCapture(e.pointerId);
      hands[active].classList.add('is-grabbed');
      move(e);
    };
    const up = () => {
      if (active) hands[active].classList.remove('is-grabbed');
      active = null;
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    return () => {
      node.classList.remove('is-live');
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
    };
  };

  render();
  return {
    node,
    get: () => ({ ...time }),
    set(t) {
      time = { ...t };
      render();
    },
    enableDrag,
    flash(hand) {
      hands.hour.classList.toggle('is-flash', hand === 'hour');
      hands.minute.classList.toggle('is-flash', hand === 'minute');
    },
  };
}
