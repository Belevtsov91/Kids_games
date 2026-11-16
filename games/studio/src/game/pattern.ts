// Ритм: 16 пэдов × 16 шагов. Дорожка пэда — 16-битная маска: бит N включён — пэд звучит на шаге N.
// Без DOM и Web Audio: этот файл импортирует и сервер игры (проверка сохранений).

export const STEPS = 16;
export const PADS = 16;
export const MAX_MASK = 0xffff;

export const BPM_MIN = 60;
export const BPM_MAX = 180;
export const BPM_DEFAULT = 100;
export const BPM_STEP = 5;
/** Свинг: насколько (доля шага) сдвигаются нечётные шаги. */
export const SWING_ON = 0.33;
export const SWING_MAX = 0.5;
export const TITLE_MAX = 40;

export type Pattern = number[];

/** Ритм целиком: то, что сохраняется на сервере. */
export interface Groove {
  bpm: number;
  swing: number;
  pattern: Pattern;
}

export const emptyPattern = (): Pattern => Array.from({ length: PADS }, () => 0);

export const hasStep = (pattern: Pattern, pad: number, step: number) => (((pattern[pad] ?? 0) >> step) & 1) === 1;

export function setStep(pattern: Pattern, pad: number, step: number, on: boolean): Pattern {
  return pattern.map((mask, i) => (i !== pad ? mask : on ? mask | (1 << step) : mask & ~(1 << step) & MAX_MASK));
}

export const toggleStep = (pattern: Pattern, pad: number, step: number) => setStep(pattern, pad, step, !hasStep(pattern, pad, step));

export const clearPad = (pattern: Pattern, pad: number): Pattern => pattern.map((mask, i) => (i === pad ? 0 : mask));

/** Какие пэды звучат на шаге. */
export function padsAt(pattern: Pattern, step: number): number[] {
  const pads: number[] = [];
  for (let pad = 0; pad < PADS; pad++) if (hasStep(pattern, pad, step)) pads.push(pad);
  return pads;
}

const bits = (mask: number) => {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
};

/** Сколько всего нот в ритме. */
export const noteCount = (pattern: Pattern) => pattern.reduce((sum, mask) => sum + bits(mask), 0);

/** Ряд пэда: 0 барабаны, 1 бас, 2 аккорды, 3 эффекты. */
export const rowOf = (pad: number) => Math.floor(pad / 4);

/** Сколько рядов (групп инструментов) задействовано. */
export const rowsUsed = (pattern: Pattern) => new Set(pattern.flatMap((mask, pad) => (mask ? [rowOf(pad)] : []))).size;

/** «x...x...» → маска. Удобно для заготовок и тестов. */
export function fromSteps(steps: string): number {
  let mask = 0;
  for (let i = 0; i < Math.min(steps.length, STEPS); i++) if (steps[i] === 'x') mask |= 1 << i;
  return mask;
}

export const toSteps = (mask: number) => Array.from({ length: STEPS }, (_, i) => ((mask >> i) & 1 ? 'x' : '.')).join('');

export function isPattern(value: unknown): value is Pattern {
  return (
    Array.isArray(value) &&
    value.length === PADS &&
    value.every((mask) => Number.isInteger(mask) && mask >= 0 && mask <= MAX_MASK)
  );
}

export const clampBpm = (bpm: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
export const clampSwing = (swing: number) => Math.min(SWING_MAX, Math.max(0, Number.isFinite(swing) ? swing : 0));

/** Чистит то, что пришло из хранилища: битое — заменяем пустым ритмом. */
export function sanitizeGroove(value: unknown): Groove {
  const v = (value ?? {}) as Partial<Groove>;
  return {
    bpm: typeof v.bpm === 'number' ? clampBpm(v.bpm) : BPM_DEFAULT,
    swing: typeof v.swing === 'number' ? clampSwing(v.swing) : 0,
    pattern: isPattern(v.pattern) ? [...v.pattern] : emptyPattern(),
  };
}
