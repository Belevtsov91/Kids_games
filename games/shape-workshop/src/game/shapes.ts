// Фигуры и их геометрия в координатах картинки 0…100. Без DOM — покрыто тестами.

export const SHAPES = ['circle', 'oval', 'square', 'rect', 'triangle', 'semicircle', 'star'] as const;
export type ShapeType = (typeof SHAPES)[number];

export interface Piece {
  type: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Поворот в градусах вокруг центра. */
  rot?: number;
  color: string;
}

export const center = (p: Pick<Piece, 'x' | 'y' | 'w' | 'h'>) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 });

/** Контур фигуры как SVG-путь (без поворота — его добавляет transform). */
export function shapePath(p: Pick<Piece, 'type' | 'x' | 'y' | 'w' | 'h'>): string {
  const { x, y, w, h } = p;
  const r = (n: number) => Math.round(n * 100) / 100;
  switch (p.type) {
    case 'circle':
    case 'oval':
      return `M${r(x)},${r(y + h / 2)}a${r(w / 2)},${r(h / 2)} 0 1,0 ${r(w)},0a${r(w / 2)},${r(h / 2)} 0 1,0 ${r(-w)},0Z`;
    case 'square':
    case 'rect':
      return `M${r(x)},${r(y)}h${r(w)}v${r(h)}h${r(-w)}Z`;
    case 'triangle':
      return `M${r(x + w / 2)},${r(y)}L${r(x + w)},${r(y + h)}L${r(x)},${r(y + h)}Z`;
    case 'semicircle':
      return `M${r(x)},${r(y + h)}a${r(w / 2)},${r(h)} 0 0,1 ${r(w)},0Z`;
    case 'star': {
      const c = center(p);
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const k = i % 2 ? 0.45 : 1;
        return `${r(c.x + (Math.cos(a) * w * k) / 2)},${r(c.y + (Math.sin(a) * h * k) / 2)}`;
      });
      return `M${pts.join('L')}Z`;
    }
  }
}

/** Ближайшее свободное место той же фигуры к точке броска; null — далеко или не та фигура. */
export function findSlot(slots: readonly Piece[], filled: ReadonlySet<number>, type: ShapeType, point: { x: number; y: number }, maxDist = 22): number | null {
  let best: number | null = null;
  let bestD = maxDist;
  slots.forEach((s, i) => {
    if (filled.has(i) || s.type !== type) return;
    const c = center(s);
    const d = Math.hypot(c.x - point.x, c.y - point.y);
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/** Фигура, место которой ближе всего к точке, — чтобы сказать «здесь нужен круг». */
export function nearestSlot(slots: readonly Piece[], filled: ReadonlySet<number>, point: { x: number; y: number }): number | null {
  let best: number | null = null;
  let bestD = Infinity;
  slots.forEach((s, i) => {
    if (filled.has(i)) return;
    const c = center(s);
    const d = Math.hypot(c.x - point.x, c.y - point.y);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}
