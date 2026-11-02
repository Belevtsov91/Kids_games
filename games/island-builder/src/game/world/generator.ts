// Генератор островов: случайный рельеф по seed и пустая поляна.
import { GRID, MAX_HEIGHT, cellKey, type BlockType, type TreeKind, type World } from './grid';

/** Детерминированный генератор случайных чисел: один seed — один и тот же остров. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateIsland(seed: number): World {
  const random = rng(seed);
  // Несколько «холмов» разной силы задают рельеф.
  const hills = Array.from({ length: 4 }, () => ({
    x: GRID / 2 + (random() - 0.5) * 8,
    z: GRID / 2 + (random() - 0.5) * 8,
    r: 3 + random() * 4,
    h: 1.5 + random() * 3.5,
  }));
  const radius = 6 + random() * 2;
  const blocks = new Map<string, BlockType>();
  const trees = new Map<string, TreeKind>();

  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const dx = x + 0.5 - GRID / 2;
      const dz = z + 0.5 - GRID / 2;
      const wobble = Math.sin(x * 0.9 + seed) * 0.8 + Math.cos(z * 0.7 + seed * 0.3) * 0.8;
      const dist = Math.hypot(dx, dz) + wobble;
      if (dist > radius) continue;
      let height = 1;
      for (const hill of hills) {
        const d = Math.hypot(x - hill.x, z - hill.z);
        if (d < hill.r) height += hill.h * (1 - d / hill.r) ** 2;
      }
      // У берега остров плоский: пляж.
      if (dist > radius - 1.5) height = 1;
      const top = Math.min(MAX_HEIGHT - 2, Math.max(1, Math.round(height)));
      for (let y = 0; y < top; y++) {
        let type: BlockType;
        if (y === top - 1) type = top === 1 ? 'sand' : top >= 6 ? 'snow' : top >= 5 ? 'stone' : 'grass';
        else type = top - y > 2 ? 'stone' : top === 1 ? 'sand' : 'grass';
        blocks.set(cellKey(x, y, z), type);
      }
      const ground = blocks.get(cellKey(x, top - 1, z))!;
      if (random() < (ground === 'grass' ? 0.12 : ground === 'sand' ? 0.05 : ground === 'snow' ? 0.15 : 0)) {
        const kind: TreeKind = ground === 'sand' ? 'palm' : ground === 'snow' ? 'pine' : random() < 0.3 ? 'flowers' : random() < 0.5 ? 'round' : 'pine';
        trees.set(cellKey(x, top, z), kind);
      }
    }
  }
  return { blocks, trees };
}

/** Маленький плоский островок: чистый лист для своей постройки. */
export function flatIsland(): World {
  const blocks = new Map<string, BlockType>();
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const d = Math.hypot(x + 0.5 - GRID / 2, z + 0.5 - GRID / 2);
      if (d <= 6) blocks.set(cellKey(x, 0, z), d > 4.8 ? 'sand' : 'grass');
    }
  }
  return { blocks, trees: new Map() };
}
