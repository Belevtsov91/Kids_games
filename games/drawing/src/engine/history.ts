import type { Container, ContainerChild } from 'pixi.js';

/** Сколько шагов назад помним. */
const LIMIT = 60;

type Step = { kind: 'add'; node: ContainerChild } | { kind: 'clear'; nodes: ContainerChild[] };

/**
 * Отмена для рисовалки: каждый штрих — шаг; «очистить» тоже шаг, его можно вернуть.
 * Старые шаги за пределом LIMIT становятся частью рисунка навсегда.
 */
export class History {
  private steps: Step[] = [];

  constructor(private readonly layer: Container) {}

  get canUndo() {
    return this.steps.length > 0;
  }

  push(node: ContainerChild) {
    this.layer.addChild(node);
    this.record({ kind: 'add', node });
  }

  clear() {
    const nodes = this.layer.removeChildren();
    this.record({ kind: 'clear', nodes });
  }

  /** Новый рисунок целиком (открыли сохранённый): старый можно вернуть отменой. */
  replaceAll(node: ContainerChild) {
    this.clear();
    this.push(node);
  }

  undo() {
    const step = this.steps.pop();
    if (!step) return;
    if (step.kind === 'add') {
      this.layer.removeChild(step.node);
      step.node.destroy();
    } else {
      this.layer.addChild(...step.nodes);
    }
  }

  private record(step: Step) {
    this.steps.push(step);
    while (this.steps.length > LIMIT) {
      const old = this.steps.shift()!;
      // Очищенные когда-то штрихи вернуть уже нельзя — освобождаем память.
      if (old.kind === 'clear') old.nodes.forEach((node) => node.destroy());
    }
  }
}
