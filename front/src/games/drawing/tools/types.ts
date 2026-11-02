import type { Graphics, PointData } from 'pixi.js';

export type ToolId = 'pencil' | 'marker' | 'crayon' | 'eraser';

export interface BrushTool {
  id: ToolId;
  label: string;
  emoji: string;
  /** Рисует один отрезок штриха от `from` до `to`. */
  drawSegment(g: Graphics, from: PointData, to: PointData, color: number): void;
}
