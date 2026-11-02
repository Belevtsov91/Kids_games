// Геометрия и материалы блоков: по одному набору на тип блока.
import { BoxGeometry, BufferAttribute, Color, MeshStandardMaterial } from 'three';
import { BLOCKS } from '../../game/blocks';
import type { BlockType, Cell } from '../../game/world';

/** Куб с цветами вершин: верх, бока (темнее книзу) и низ своего цвета. */
export function blockGeometry(look: (typeof BLOCKS)[BlockType]) {
  const geometry = new BoxGeometry(1, 1, 1);
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const top = new Color(look.top);
  const side = new Color(look.side);
  const bottom = new Color(look.bottom);
  const c = new Color();
  for (let i = 0; i < position.count; i++) {
    const face = Math.floor(i / 4); // порядок граней BoxGeometry: +x, -x, +y, -y, +z, -z
    if (face === 2) c.copy(top);
    else if (face === 3) c.copy(bottom);
    else c.copy(side).multiplyScalar(position.getY(i) < 0 ? 0.82 : 1);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

export function blockMaterial(look: (typeof BLOCKS)[BlockType]) {
  return new MeshStandardMaterial({
    vertexColors: true,
    roughness: look.transparent ? 0.1 : 0.85,
    metalness: look.transparent ? 0.1 : 0,
    transparent: look.transparent,
    opacity: look.transparent ? 0.5 : 1,
    depthWrite: !look.transparent,
    emissive: look.glow ? new Color('#ffae2b') : new Color('#000'),
    emissiveIntensity: look.glow ? 0.4 : 0,
  });
}

/** Псевдослучайный оттенок блока: так стена не выглядит плоской. */
export const shade = ({ x, y, z }: Cell) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return 0.9 + (h - Math.floor(h)) * 0.14;
};
