interface Patch { x: number; y: number; image: ImageData }

/** Store only changed rectangles; cap total undo memory at 24 MB. */
export class ColorHistory {
  private patches: Patch[] = [];
  private bytes = 0;
  get canUndo() { return this.patches.length > 0; }

  record(before: ImageData, after: ImageData) {
    const { width, height } = before;
    let left = width, right = -1, top = height, bottom = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (before.data[i] === after.data[i] && before.data[i + 1] === after.data[i + 1] && before.data[i + 2] === after.data[i + 2] && before.data[i + 3] === after.data[i + 3]) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) return false;
    const w = right - left + 1, h = bottom - top + 1;
    const image = new ImageData(w, h);
    for (let y = 0; y < h; y++) {
      const start = ((top + y) * width + left) * 4;
      image.data.set(before.data.subarray(start, start + w * 4), y * w * 4);
    }
    this.patches.push({ x: left, y: top, image });
    this.bytes += image.data.byteLength;
    while (this.bytes > 24 * 1024 * 1024 || this.patches.length > 40) this.bytes -= this.patches.shift()!.image.data.byteLength;
    return true;
  }

  undo(ctx: CanvasRenderingContext2D) {
    const patch = this.patches.pop();
    if (!patch) return;
    this.bytes -= patch.image.data.byteLength;
    ctx.putImageData(patch.image, patch.x, patch.y);
  }
}
