import { describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import { tools } from '../src/tools';
import { CANVAS_BACKGROUND } from '../src/engine/constants';

// Graphics из Pixi без WebGL: записываем вызовы цепочки moveTo → lineTo → stroke.
function fakeGraphics() {
  const g = { moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() };
  g.moveTo.mockReturnValue(g);
  g.lineTo.mockReturnValue(g);
  g.stroke.mockReturnValue(g);
  return g;
}

describe('инструменты рисования', () => {
  it('у каждого инструмента уникальный id', () => {
    expect(new Set(tools.map((t) => t.id)).size).toBe(tools.length);
  });

  it.each(tools.filter((t) => t.id !== 'eraser'))('$label рисует выбранным цветом', (tool) => {
    const g = fakeGraphics();
    tool.drawSegment(g as unknown as Graphics, { x: 0, y: 0 }, { x: 10, y: 10 }, 0xe5484d);
    expect(g.stroke).toHaveBeenCalled();
    for (const [style] of g.stroke.mock.calls) expect(style.color).toBe(0xe5484d);
  });

  it('ластик рисует цветом фона, а не выбранным', () => {
    const eraser = tools.find((t) => t.id === 'eraser')!;
    const g = fakeGraphics();
    eraser.drawSegment(g as unknown as Graphics, { x: 0, y: 0 }, { x: 10, y: 10 }, 0xe5484d);
    expect(g.stroke.mock.calls[0][0].color).toBe(CANVAS_BACKGROUND);
  });
});
