import { STEPS } from './pattern';

// Время в секундах: шаг — шестнадцатая доля такта 4/4.

export const stepSeconds = (bpm: number) => 60 / bpm / 4;

/** Сдвиг нечётных шагов для свинга (доля шага). Чётные шаги идут ровно. */
export const swingOffset = (step: number, bpm: number, swing: number) => (step % 2 === 1 ? swing * stepSeconds(bpm) : 0);

export const nextStep = (step: number) => (step + 1) % STEPS;

/**
 * Куда записать удар во время игры: шаг, что звучит сейчас, или следующий,
 * если ребёнок попал ближе ко второму (прошло больше половины шага).
 */
export function quantize(currentStep: number, secondsSinceStep: number, bpm: number): number {
  return secondsSinceStep > stepSeconds(bpm) / 2 ? nextStep(currentStep) : currentStep;
}

/** Длина такта в секундах — для подсказок и тестов. */
export const barSeconds = (bpm: number) => stepSeconds(bpm) * STEPS;
