// Подсказка: сверяем программу ребёнка с решением уровня, оставляем верное начало
// и показываем, какую команду и куда положить дальше.
import { isBlock, same, type Cmd, type Kind, type Path } from './program';

export interface Hint {
  /** Программа без ошибочного хвоста (у блоков поправлены число повторов и условие). */
  program: Cmd[];
  /** Куда класть следующую команду. */
  container: Path;
  /** Какую команду положить; null — программа уже совпала с решением. */
  next: Kind | null;
}

export function hintFor(sample: readonly Cmd[], program: readonly Cmd[], prefix: Path = []): Hint {
  const out: Cmd[] = [];
  for (let i = 0; i < sample.length; i++) {
    const s = sample[i];
    const p = program[i];
    if (same(p, s)) {
      out.push(structuredClone(s));
      continue;
    }
    if (p && isBlock(p) && isBlock(s) && p.k === s.k) {
      const inner = hintFor(s.body, p.body, [...prefix, i]);
      out.push({ ...structuredClone(s), body: inner.program });
      if (inner.next) return { program: out, container: inner.container, next: inner.next };
      continue;
    }
    return { program: out, container: prefix, next: s.k };
  }
  return { program: out, container: prefix, next: null };
}
