import type { BrushTool } from './types';
import { CANVAS_BACKGROUND } from '../engine/constants';

// Пока просто рисует цветом фона. Позже можно заменить на blendMode 'erase'.
export const eraser: BrushTool = {
  id: 'eraser',
  label: 'Ластик',
  emoji: '🧽',
  drawSegment(g, from, to) {
    g.moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ width: 30, color: CANVAS_BACKGROUND, cap: 'round', join: 'round' });
  },
};
