import type { BrushTool } from './types';

export const marker: BrushTool = {
  id: 'marker',
  label: 'Фломастер',
  emoji: '🖊️',
  drawSegment(g, from, to, color) {
    g.moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ width: 14, color, alpha: 1, cap: 'round', join: 'round' });
  },
};
