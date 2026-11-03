import { contourEndpoints } from './contourEndpoints';

/** Join only a dangling contour's end to a nearby line in its forward direction.
 * Existing lines, closed shapes and their thickness remain byte-for-byte intact.
 */
export function closeLineGaps(mask: Uint8Array, width: number, height: number, maxGap = 14): Uint8Array {
  const result = mask.slice();
  for (const end of contourEndpoints(mask, width, height)) {
    let best: { x: number; y: number; score: number } | null = null;
    for (let dy = -maxGap; dy <= maxGap; dy++) for (let dx = -maxGap; dx <= maxGap; dx++) {
      const distance = Math.hypot(dx, dy);
      if (distance < 2 || distance > maxGap) continue;
      const alignment = (dx * end.dx + dy * end.dy) / distance;
      if (alignment < .87) continue;
      const x = end.x + dx, y = end.y + dy;
      if (x < 1 || y < 1 || x >= width - 1 || y >= height - 1 || !mask[y * width + x]) continue;
      // Must cross real white space, not merely hit the side of its own line.
      let whites = 0;
      for (let t = 1; t < distance; t++) {
        const p = Math.round(end.y + dy * t / distance) * width + Math.round(end.x + dx * t / distance);
        if (!mask[p]) whites++;
      }
      if (whites < 2) continue;
      const score = distance * (2 - alignment);
      if (!best || score < best.score) best = { x, y, score };
    }
    if (!best) continue;
    // A one-pixel bridge seals four-connected fill without widening the drawing.
    const dx = best.x - end.x, dy = best.y - end.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let step = 0; step <= steps; step++) {
      const x = Math.round(end.x + dx * step / steps), y = Math.round(end.y + dy * step / steps);
      result[y * width + x] = 1;
    }
  }
  return result;
}
