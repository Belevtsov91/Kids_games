// Пульт штурмана: курс и мощность ползунками, «Старт», «Тормоз» в полёте, «Ещё раз».
import type { Body, Vec } from '../game/physics';
import { tr } from '../i18n';
import { button, el } from './dom';

export interface Aim {
  angle: number;
  power: number;
}

export interface ControlsHandlers {
  onAim(aim: Aim): void;
  onLaunch(): void;
  onBrake(): void;
  onRetry(): void;
}

export const ANGLE_RANGE = { min: -60, max: 150 };

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Прицел по точке сцены: курс — направление от планеты, мощность — расстояние (как длина стрелки). */
export const aimToward = (home: Body, p: Vec): Aim => {
  const angle = Math.round((Math.atan2(home.y - p.y, p.x - home.x) * 180) / Math.PI);
  const power = Math.round(clamp((Math.hypot(p.x - home.x, p.y - home.y) - home.r - 20) / 1.1, 10, 100));
  return { angle: clamp(angle, ANGLE_RANGE.min, ANGLE_RANGE.max), power };
};

const slider = (label: string, min: number, max: number, value: number, fmt: (n: number) => string, onInput: (n: number) => void) => {
  const wrap = el('label', 'sn-slider');
  const caption = el('span', 'sn-slider-label', label);
  const out = el('output', 'sn-slider-value', fmt(value));
  const input = el('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = String(value);
  input.addEventListener('input', () => {
    out.textContent = fmt(Number(input.value));
    onInput(Number(input.value));
  });
  wrap.append(caption, input, out);
  return {
    wrap,
    set(n: number) {
      input.value = String(n);
      out.textContent = fmt(n);
    },
    disable(off: boolean) {
      input.disabled = off;
    },
  };
};

export const createControls = (aim: Aim, h: ControlsHandlers) => {
  const t = tr();
  const root = el('div', 'sn-controls');
  const current = { ...aim };
  const angle = slider(t.angle, ANGLE_RANGE.min, ANGLE_RANGE.max, aim.angle, t.degrees, (n) => {
    current.angle = n;
    h.onAim({ ...current });
  });
  const power = slider(t.power, 10, 100, aim.power, t.percent, (n) => {
    current.power = n;
    h.onAim({ ...current });
  });
  const launch = button('sn-btn sn-btn-main', t.launch, h.onLaunch);
  const brake = button('sn-btn sn-btn-brake', t.brake(1), h.onBrake);
  const retry = button('sn-btn', t.retry, h.onRetry);
  root.append(angle.wrap, power.wrap, launch, brake, retry);

  return {
    root,
    /** Прицел сменился жестом на холсте — двигаем ползунки. */
    setAim(a: Aim) {
      current.angle = a.angle;
      current.power = a.power;
      angle.set(a.angle);
      power.set(a.power);
    },
    /** Режим: прицеливание или полёт; burns — сколько тормозов осталось (0 — кнопку прячем). */
    setFlying(flying: boolean, burns: number) {
      angle.disable(flying);
      power.disable(flying);
      launch.hidden = flying;
      brake.hidden = !flying || burns <= 0;
      brake.textContent = t.brake(burns);
      retry.hidden = !flying;
    },
    focusLaunch: () => launch.focus(),
  };
};
