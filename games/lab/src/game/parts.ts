// Детали машины. Каждая стоит в одной клетке доски; нажатие на поставленную деталь
// переключает её вариант (наклон горки, сторону маятника, направление шестерёнки).

export type PartKind = 'ramp' | 'spring' | 'lever' | 'pendulum' | 'gear' | 'block';

export interface PartInfo {
  kind: PartKind;
  emoji: string;
  /** Сколько вариантов перебирает нажатие. */
  variants: number;
  color: string;
}

export const PARTS: PartInfo[] = [
  { kind: 'ramp', emoji: '📐', variants: 4, color: '#f2b766' },
  { kind: 'spring', emoji: '🌀', variants: 3, color: '#ff8fa3' },
  { kind: 'lever', emoji: '⚖️', variants: 2, color: '#e8a25c' },
  { kind: 'pendulum', emoji: '🔔', variants: 2, color: '#f5c542' },
  { kind: 'gear', emoji: '⚙️', variants: 2, color: '#5cc8a8' },
  { kind: 'block', emoji: '🧱', variants: 1, color: '#9b8cff' },
];

export const partInfo = (kind: PartKind): PartInfo => PARTS.find((p) => p.kind === kind) ?? PARTS[0];

const DEG = Math.PI / 180;

/** Наклон горки: плюс — поднимается вправо, шарик катится влево. */
export const RAMP_ANGLES = [-30 * DEG, -15 * DEG, 15 * DEG, 30 * DEG];
export const SPRING_ANGLES = [0, 25 * DEG, -25 * DEG];
/** С какой стороны поднят рычаг перед пуском. */
export const LEVER_ANGLES = [-18 * DEG, 18 * DEG];
/** Откуда стартует маятник: слева (качнётся вправо) или справа. */
export const PENDULUM_ANGLES = [-75 * DEG, 75 * DEG];
/** Скорость шестерёнки, рад/с: минус — по часовой стрелке. */
export const GEAR_SPEEDS = [-3, 3];

export const SIZE = {
  ball: 0.28,
  rampHalf: 0.95,
  springHalf: 0.45,
  leverHalf: 1.2,
  plank: 0.07,
  rope: 1.3,
  bob: 0.3,
  gear: 0.55,
  tooth: 0.2,
  block: 0.45,
  bulb: 0.42,
  star: 0.45,
} as const;

/** Поставленная деталь. */
export interface Placed {
  id: number;
  kind: PartKind;
  col: number;
  row: number;
  variant: number;
}

export const nextVariant = (part: Placed): Placed => ({ ...part, variant: (part.variant + 1) % partInfo(part.kind).variants });
