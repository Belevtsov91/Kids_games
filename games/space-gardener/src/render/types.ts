import type { Vec } from '../game/ink';
import type { Simulation } from '../game/simulation';

/** Как мир 800×800 вписан в экран: масштаб и сдвиг. */
export interface View {
  scale: number;
  ox: number;
  oy: number;
}

/** Отступы под панели интерфейса, которые мир не должен перекрывать. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FrameState {
  sim: Simulation | null;
  /** Штрих, который рисуют прямо сейчас. */
  stroke: Vec[] | null;
  /** Прозрачность подсказки-решения, 0 — не видно. */
  ghost: number;
  /** Доска, которую тащат. */
  dragged: unknown;
  /** 0..1 — раскрытие цветка после победы. */
  bloom: number;
}
