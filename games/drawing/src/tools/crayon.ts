import type { BrushTool } from './types';

const STRANDS = 5;
const SPREAD = 6;

// Восковой мелок: несколько тонких полупрозрачных линий со случайным смещением.
export const crayon: BrushTool = {
  id: 'crayon',
  label: 'Мелок',
  emoji: '🖍️',
  drawSegment(g, from, to, color) {
    for (let i = 0; i < STRANDS; i++) {
      const dx = (Math.random() - 0.5) * SPREAD;
      const dy = (Math.random() - 0.5) * SPREAD;
      g.moveTo(from.x + dx, from.y + dy)
        .lineTo(to.x + dx, to.y + dy)
        .stroke({ width: 2.5, color, alpha: 0.35, cap: 'round' });
    }
  },
};
