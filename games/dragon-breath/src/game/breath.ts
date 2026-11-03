// Дыхание как конечный автомат: вдох (пока держат кнопку или по кругу), выдох, пауза. Без DOM — покрыто тестами.

export type Phase = 'ready' | 'inhale' | 'exhale' | 'rest' | 'done';
export type Mode = 'hold' | 'follow';

export interface Pace {
  inhaleMs: number;
  exhaleMs: number;
  restMs: number;
}

export const PACES = {
  slow: { inhaleMs: 4000, exhaleMs: 5000, restMs: 1200 },
  easy: { inhaleMs: 3000, exhaleMs: 3500, restMs: 1000 },
} satisfies Record<string, Pace>;

/** Вдох засчитан, если держали хотя бы такую долю положенного времени. */
export const MIN_INHALE = 0.7;

export interface BreathState {
  phase: Phase;
  /** 0…1 — насколько прошла текущая фаза. */
  t: number;
  breaths: number;
  goal: number;
}

export type BreathEvent = 'inhale-start' | 'too-short' | 'exhale-start' | 'breath-done' | 'all-done';

export const startBreath = (goal: number): BreathState => ({ phase: 'ready', t: 0, breaths: 0, goal });

const phaseMs = (p: Phase, pace: Pace) => (p === 'inhale' ? pace.inhaleMs : p === 'exhale' ? pace.exhaleMs : pace.restMs);

/**
 * Шаг времени. `holding` — нажата ли кнопка (в режиме follow игнорируется: круг дышит сам).
 * Возвращает новое состояние и события, которые случились за этот шаг.
 */
export function tick(s: BreathState, dtMs: number, holding: boolean, mode: Mode, pace: Pace): { state: BreathState; events: BreathEvent[] } {
  const events: BreathEvent[] = [];
  let { phase, t, breaths } = s;
  const hold = mode === 'follow' ? true : holding;
  if (phase === 'done') return { state: s, events };
  if (phase === 'ready' || phase === 'rest') {
    if (phase === 'rest') t = Math.min(1, t + dtMs / pace.restMs);
    const restOver = phase === 'ready' || t >= 1;
    if (restOver && hold) {
      phase = 'inhale';
      t = 0;
      events.push('inhale-start');
    }
    return { state: { ...s, phase, t }, events };
  }
  if (phase === 'inhale') {
    if (hold) {
      t = Math.min(1, t + dtMs / pace.inhaleMs);
      if (mode === 'follow' && t >= 1) {
        phase = 'exhale';
        t = 0;
        events.push('exhale-start');
      }
    } else if (t >= MIN_INHALE) {
      phase = 'exhale';
      t = 0;
      events.push('exhale-start');
    } else {
      phase = 'ready';
      t = 0;
      events.push('too-short');
    }
    return { state: { ...s, phase, t }, events };
  }
  // Выдох идёт сам, держать кнопку не нужно.
  t = Math.min(1, t + dtMs / phaseMs('exhale', pace));
  if (t >= 1) {
    breaths++;
    events.push('breath-done');
    if (breaths >= s.goal) {
      phase = 'done';
      events.push('all-done');
    } else {
      phase = 'rest';
    }
    t = 0;
  }
  return { state: { ...s, phase, t, breaths }, events };
}

/** Размер круга-подсказки: растёт на вдохе, сдувается на выдохе. */
export function circleScale(s: BreathState): number {
  if (s.phase === 'inhale') return 0.6 + 0.4 * s.t;
  if (s.phase === 'exhale') return 1 - 0.4 * s.t;
  return 0.6;
}
