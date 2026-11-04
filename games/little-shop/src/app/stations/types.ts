// Общий договор прилавка: он рисует задание в stage и сообщает, верно ли ответил ребёнок.
import type { Sound } from '../../audio/Sound';
import type { Confetti } from '../../ui/Confetti';
import type { Timers } from '../Timers';

export interface StationDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  level: number;
  /** Ответ засчитан (ok) или ошибка; после верного ответа контроллер покажет следующее задание. */
  onResult(ok: boolean): void;
}

export interface StationTask {
  dispose(): void;
}

/** Искорки в центре элемента. */
export function sparkleAt(confetti: Confetti, node: Element) {
  const r = node.getBoundingClientRect();
  const c = confetti.canvas.getBoundingClientRect();
  confetti.sparkle(r.left + r.width / 2 - c.left, r.top + r.height / 2 - c.top);
}
