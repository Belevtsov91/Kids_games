import { AFTER_EMIT_LIMIT_MS, IDLE_STEPS } from './constants';

export interface PourState {
  collected: number;
  need: number;
  emitted: number;
  totalDrops: number;
  dropsInAir: number;
  idleSteps: number;
  /** Сколько мс прошло с последней выпущенной капли. */
  sinceLastEmit: number;
}

/**
 * Чем кончилась попытка: won — набрали воды, lost — капли кончились, замерли или летят слишком долго,
 * null — полив продолжается.
 */
export function pourOutcome(s: PourState): 'won' | 'lost' | null {
  if (s.collected >= s.need) return 'won';
  if (s.emitted < s.totalDrops) return null;
  const outOfDrops = s.dropsInAir === 0;
  const stuck = s.dropsInAir > 0 && s.idleSteps >= IDLE_STEPS;
  const tooLong = s.sinceLastEmit > AFTER_EMIT_LIMIT_MS;
  return outOfDrops || stuck || tooLong ? 'lost' : null;
}
