import { floodFill, lineMask } from './floodFill';
import { ColorHistory } from './ColorHistory';

export type ColoringTool = 'fill' | 'brush' | 'eraser';
export class ColoringEngine {
  tool: ColoringTool = 'fill';
  color = '#ee6655';
  brushSize = 14;
  onChange: (() => void) | null = null;
  private readonly paint = document.createElement('canvas');
  private readonly lines = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly view: CanvasRenderingContext2D;
  private readonly history = new ColorHistory();
  private readonly events = new AbortController();
  private mask: Uint8Array = new Uint8Array(0);
  private pointer: number | null = null;
  private before: ImageData | null = null;
  private last = { x: 0, y: 0 };
  private destroyed = false;
  private ready = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = this.paint.getContext('2d', { willReadFrequently: true })!;
    this.view = canvas.getContext('2d')!;
    const options = { signal: this.events.signal };
    canvas.addEventListener('pointerdown', this.down, options);
    canvas.addEventListener('pointermove', this.move, options);
    canvas.addEventListener('pointerup', this.up, options);
    canvas.addEventListener('pointercancel', this.up, options);
    canvas.addEventListener('lostpointercapture', this.up, options);
  }

  async load(src: string) {
    const image = new Image();
    image.src = src;
    await image.decode();
    if (this.destroyed) return;
    for (const canvas of [this.canvas, this.paint, this.lines]) { canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; }
    const ctx = this.lines.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, this.lines.width, this.lines.height);
    ctx.drawImage(image, 0, 0);
    this.mask = lineMask(ctx.getImageData(0, 0, this.lines.width, this.lines.height).data);
    this.ctx.fillStyle = '#fff'; this.ctx.fillRect(0, 0, this.paint.width, this.paint.height);
    this.ready = true;
    this.render();
  }

  get canUndo() { return this.history.canUndo; }
  private snapshot() { return this.ctx.getImageData(0, 0, this.paint.width, this.paint.height); }
  private commit(before: ImageData) {
    if (this.history.record(before, this.snapshot())) this.onChange?.();
    this.render();
  }
  clear() {
    if (!this.ready) return;
    this.finishStroke();
    const before = this.snapshot();
    this.ctx.fillStyle = '#fff'; this.ctx.fillRect(0, 0, this.paint.width, this.paint.height);
    this.commit(before);
  }
  undo() { this.finishStroke(); this.history.undo(this.ctx); this.render(); this.onChange?.(); }
  exportPng() { this.finishStroke(); this.render(); return this.canvas.toDataURL('image/png'); }
  destroy() { this.destroyed = true; this.events.abort(); this.onChange = null; }

  private render() {
    this.view.globalCompositeOperation = 'source-over';
    this.view.drawImage(this.paint, 0, 0);
    this.view.globalCompositeOperation = 'multiply';
    this.view.drawImage(this.lines, 0, 0);
    this.view.globalCompositeOperation = 'source-over';
  }
  private point(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * this.canvas.width / r.width, y: (e.clientY - r.top) * this.canvas.height / r.height };
  }
  private down = (e: PointerEvent) => {
    if (!this.ready || this.pointer !== null || e.button !== 0) return;
    e.preventDefault();
    const p = this.point(e);
    const before = this.snapshot();
    if (this.tool === 'fill') {
      const after = this.snapshot();
      const color = parseInt(this.color.slice(1), 16);
      if (floodFill(after.data, this.mask, after.width, after.height, p.x, p.y, [color >> 16, color >> 8 & 255, color & 255])) {
        this.ctx.putImageData(after, 0, 0); this.commit(before);
      }
      return;
    }
    this.pointer = e.pointerId; this.before = before; this.last = p;
    this.canvas.setPointerCapture(e.pointerId);
    this.segment(p);
  };
  private segment(p: { x: number; y: number }) {
    this.ctx.strokeStyle = this.tool === 'eraser' ? '#fff' : this.color;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';
    this.ctx.beginPath(); this.ctx.moveTo(this.last.x, this.last.y); this.ctx.lineTo(p.x + .01, p.y); this.ctx.stroke();
    this.last = p; this.render();
  }
  private move = (e: PointerEvent) => { if (this.pointer === e.pointerId) this.segment(this.point(e)); };
  private finishStroke() {
    const before = this.before;
    this.pointer = null; this.before = null;
    if (before) this.commit(before);
  }
  private up = (e: PointerEvent) => { if (this.pointer === e.pointerId) this.finishStroke(); };
}
