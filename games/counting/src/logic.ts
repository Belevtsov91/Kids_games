export const modes = ['count', 'feed', 'digit', 'sequence', 'compare', 'calculate'] as const;
export type Mode = (typeof modes)[number];
export interface Question {
  mode: Mode;
  a: number;
  b: number;
  answer: number;
  options: number[];
  sequence: number[];
  gap: number;
  subtract: boolean;
}
export function createQuestion(mode: Mode, limit: number, random = Math.random): Question {
  const integer = (max: number) => Math.min(max - 1, Math.floor(random() * max));
  let a = 1 + integer(limit);
  let b = 1 + integer(limit);
  let answer = a;
  const subtract = random() < 0.5;
  const sequence = Array.from({ length: Math.min(5, limit) }, (_, i) => i + 1);
  const start = integer(limit - sequence.length + 1);
  sequence.forEach((_, i) => (sequence[i] += start));
  const gap = integer(sequence.length);
  if (mode === 'sequence') answer = sequence[gap];
  if (mode === 'compare') answer = a === b ? 0 : a > b ? 1 : 2;
  if (mode === 'calculate') {
    if (subtract) {
      b = integer(a + 1);
      answer = a - b;
    } else {
      a = integer(limit);
      b = 1 + integer(limit - a);
      answer = a + b;
    }
  }
  const candidates = Array.from({ length: limit + 1 }, (_, i) => i).filter((n) => n !== answer);
  // Fisher–Yates: seedable generator makes sessions testable.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = integer(i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const options = [...candidates.slice(0, 3), answer];
  for (let i = options.length - 1; i > 0; i--) {
    const j = integer(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { mode, a, b, answer, options, sequence, gap, subtract };
}
