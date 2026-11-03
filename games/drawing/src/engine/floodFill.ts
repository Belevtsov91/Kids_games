/** Fill one connected area; the immutable line mask keeps contours intact. */
export function floodFill(pixels: Uint8ClampedArray, blocked: Uint8Array, width: number, height: number, x: number, y: number, rgb: readonly number[]): number {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  const start = y * width + x;
  const offset = start * 4;
  if (blocked[start]) return 0;
  const old = pixels.slice(offset, offset + 4);
  if (old[0] === rgb[0] && old[1] === rgb[1] && old[2] === rgb[2] && old[3] === 255) return 0;
  const queue = new Int32Array(width * height);
  const visited = new Uint8Array(width * height);
  let head = 0;
  let tail = 0;
  let changed = 0;
  const visit = (p: number) => {
    if (visited[p] || blocked[p]) return;
    visited[p] = 1;
    const i = p * 4;
    if (Math.abs(pixels[i] - old[0]) > 12 || Math.abs(pixels[i + 1] - old[1]) > 12 || Math.abs(pixels[i + 2] - old[2]) > 12 || Math.abs(pixels[i + 3] - old[3]) > 12) return;
    pixels[i] = rgb[0]; pixels[i + 1] = rgb[1]; pixels[i + 2] = rgb[2]; pixels[i + 3] = 255;
    queue[tail++] = p;
    changed++;
  };
  visit(start);
  while (head < tail) {
    const p = queue[head++];
    if (p % width > 0) visit(p - 1);
    if (p % width < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < width * (height - 1)) visit(p + width);
  }
  return changed;
}

export function lineMask(pixels: Uint8ClampedArray): Uint8Array {
  const mask = new Uint8Array(pixels.length / 4);
  for (let p = 0; p < mask.length; p++) mask[p] = pixels[p * 4 + 3] > 100 && Math.min(pixels[p * 4], pixels[p * 4 + 1], pixels[p * 4 + 2]) < 190 ? 1 : 0;
  return mask;
}
