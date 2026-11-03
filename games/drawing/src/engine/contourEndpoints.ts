export interface ContourEnd { x: number; y: number; dx: number; dy: number }

/** Thin a copy for analysis only. The displayed artwork is never thinned. */
export function contourEndpoints(mask: Uint8Array, width: number, height: number): ContourEnd[] {
  const thin = mask.slice();
  const candidates: number[] = [];
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) if (thin[y * width + x]) candidates.push(y * width + x);
  const offsets = [-width, -width + 1, 1, width + 1, width, width - 1, -1, -width - 1];
  let changed = true;
  for (let round = 0; changed && round < 50; round++) {
    changed = false;
    for (let phase = 0; phase < 2; phase++) {
      const remove: number[] = [];
      for (const p of candidates) {
        if (!thin[p]) continue;
        const n = offsets.map(offset => thin[p + offset]);
        const count = n.reduce((a, b) => a + b, 0);
        if (count < 2 || count > 6) continue;
        let transitions = 0;
        for (let i = 0; i < 8; i++) if (!n[i] && n[(i + 1) % 8]) transitions++;
        if (transitions !== 1) continue;
        if (phase === 0 ? n[0] * n[2] * n[4] || n[2] * n[4] * n[6] : n[0] * n[2] * n[6] || n[0] * n[4] * n[6]) continue;
        remove.push(p);
      }
      if (remove.length) changed = true;
      for (const p of remove) thin[p] = 0;
    }
  }
  const neighbors = (p: number) => offsets.map(offset => p + offset).filter(q => q >= 0 && q < thin.length && Math.abs(q % width - p % width) <= 1 && thin[q]);
  const ends: ContourEnd[] = [];
  for (const p of candidates) {
    if (!thin[p] || neighbors(p).length !== 1) continue;
    let previous = -1, current = p, steps = 0;
    while (steps < 8) {
      const next = neighbors(current).filter(q => q !== previous);
      if (next.length !== 1) break;
      previous = current; current = next[0]; steps++;
    }
    if (steps < 3) continue;
    const dx = p % width - current % width, dy = Math.floor(p / width) - Math.floor(current / width);
    const length = Math.hypot(dx, dy);
    if (length) ends.push({ x: p % width, y: Math.floor(p / width), dx: dx / length, dy: dy / length });
  }
  return ends;
}
