import type { BrushTool } from './types';

export const pencil: BrushTool = {
  id: 'pencil',
  label: 'Карандаш',
  emoji: '✏️',
  drawSegment(g, from, to, color) {
    g.moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({ width: 3, color, alpha: 0.9, cap: 'round', join: 'round' });
  },
};
