/** Общее для 3D-сцены входа: что сцена знает о форме, плавное сближение и «выпрыгивание» деталей при загрузке. */
import type * as THREE from 'three';

export type AuthMode = 'login' | 'register';
export type FocusKind = 'email' | 'name' | 'pass' | null;

/** То, что форма сообщает сцене. Сцена только смотрит на это и анимирует. */
export interface FxState {
  mode: AuthMode;
  focus: FocusKind;
  /** Пароль показан глазиком — мишка подглядывает. */
  peek: boolean;
  /** Длина текста в поле почты или имени: мишка следит глазами. */
  typeLen: number;
  thinking: boolean;
  /** Слишком много попыток: дверь во льду. */
  frozen: boolean;
  /** Надёжность пароля при регистрации, 0–4. */
  strength: number;
  /** Огоньки прогресса: вход — [почта, пароль]; регистрация — [имя, почта, пароль, согласие]. */
  lit: boolean[];
  /** Кристаллы вокруг замка: по одному на символ пароля. */
  gems: number;
}

export const initialFx = (mode: AuthMode): FxState => ({
  mode,
  focus: null,
  peek: false,
  typeLen: 0,
  thinking: false,
  frozen: false,
  strength: 0,
  lit: [false, false, false, false],
  gems: 0,
});

/** Контекст кадра: время, шаг и моменты ошибки и успеха. */
export interface Frame {
  t: number;
  dt: number;
  fx: FxState;
  /** Секунды с последней ошибки и с успеха (большое число — не было). */
  sinceErr: number;
  sinceWin: number;
  win: boolean;
  reduce: boolean;
  pointerX: number;
}

/** Плавное сближение, не зависящее от частоты кадров. */
export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

const easeBack = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1);
  const c = 1.9;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

/** Детали, которые при загрузке по очереди «выпрыгивают» из острова. */
export class PopIn {
  private items: { o: THREE.Object3D; s: number; delay: number }[] = [];

  add<T extends THREE.Object3D>(o: T, delay: number): T {
    this.items.push({ o, s: o.scale.x, delay });
    o.scale.setScalar(0.0001);
    return o;
  }

  update(t: number, reduce: boolean) {
    if (t > 4 && !reduce) return;
    for (const it of this.items) it.o.scale.setScalar(Math.max(0.0001, (reduce ? 1 : easeBack((t - it.delay) / 0.55)) * it.s));
  }
}

/** Падение с отскоком: высота над землёй в момент t после начала. */
export function bounceDrop(t: number): number {
  if (t < 0) return 5;
  if (t > 1.1) return 0;
  let x = t / 1.1;
  const n = 7.5625, d = 2.75;
  let b: number;
  if (x < 1 / d) b = n * x * x;
  else if (x < 2 / d) b = n * (x -= 1.5 / d) * x + 0.75;
  else if (x < 2.5 / d) b = n * (x -= 2.25 / d) * x + 0.9375;
  else b = n * (x -= 2.625 / d) * x + 0.984375;
  return (1 - b) * 5;
}
