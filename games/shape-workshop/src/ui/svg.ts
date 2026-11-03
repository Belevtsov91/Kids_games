// SVG-фигуры: та же геометрия, что в game/shapes, только в виде элементов.
import { center, shapePath, type Piece } from '../game/shapes';

const NS = 'http://www.w3.org/2000/svg';

export const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

/** Фигура как <path>; цвет — заливка, если не передан класс-силуэт. */
export function pieceNode(p: Piece, className = 'sw-piece') {
  const c = center(p);
  const path = svgEl('path', { d: shapePath(p), class: className, fill: p.color });
  if (p.rot) path.setAttribute('transform', `rotate(${p.rot} ${c.x} ${c.y})`);
  return path;
}

/** Отдельная маленькая картинка одной фигуры — для лотка и палитры. */
export function pieceIcon(p: Piece) {
  const pad = 4;
  const size = Math.max(p.w, p.h) + pad * 2;
  const c = center(p);
  const svg = svgEl('svg', { viewBox: `${c.x - size / 2} ${c.y - size / 2} ${size} ${size}`, class: 'sw-icon', 'aria-hidden': 'true' });
  svg.append(pieceNode(p));
  return svg;
}

/** Целая картинка: силуэты (если не собрана) или цветные фигуры. */
export function pictureSvg(pieces: readonly Piece[], colored: boolean, className = 'sw-thumb') {
  const svg = svgEl('svg', { viewBox: '0 0 100 100', class: className, 'aria-hidden': 'true' });
  for (const p of pieces) svg.append(pieceNode(p, colored ? 'sw-piece' : 'sw-silhouette'));
  return svg;
}
