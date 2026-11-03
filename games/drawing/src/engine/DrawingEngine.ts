import { Application, Assets, Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent, type PointData } from 'pixi.js';
import type { BrushTool } from '../tools';
import { CANVAS_BACKGROUND } from './constants';
import { History } from './history';

interface Stroke {
  graphics: Graphics;
  last: PointData;
}

/** Больше не нужно для сохранения: так PNG остаётся лёгким, а сервер принимает до 10 МБ. */
const EXPORT_MAX_SIDE = 1600;

/**
 * Обёртка над PixiJS: холст, ввод указателем и штрихи. React-код общается только с ней.
 * Каждый палец рисует свой штрих, поэтому рисовать можно двумя руками сразу.
 */
export class DrawingEngine {
  tool: BrushTool;
  color: number;
  /** Вызывается, когда меняется история (можно ли отменить). */
  onChange: (() => void) | null = null;

  private readonly app = new Application();
  private readonly strokes = new Container();
  private readonly active = new Map<number, Stroke>();
  private readonly history = new History(this.strokes);
  private destroyed = false;

  private constructor(tool: BrushTool, color: number) {
    this.tool = tool;
    this.color = color;
  }

  static async create(host: HTMLElement, tool: BrushTool, color: number) {
    const engine = new DrawingEngine(tool, color);
    await engine.app.init({
      resizeTo: host,
      background: CANVAS_BACKGROUND,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    host.appendChild(engine.app.canvas);
    engine.setupInput();
    return engine;
  }

  get canUndo() {
    return this.history.canUndo;
  }

  get isEmpty() {
    return this.strokes.children.length === 0;
  }

  clear() {
    if (this.isEmpty) return;
    this.active.clear();
    this.history.clear();
    this.onChange?.();
  }

  undo() {
    this.active.clear();
    this.history.undo();
    this.onChange?.();
  }

  /** Открыть сохранённый рисунок: он ложится на холст, поверх можно рисовать дальше. */
  async load(dataUrl: string) {
    const texture = await Assets.load<import('pixi.js').Texture>({ src: dataUrl, parser: 'texture' });
    if (this.destroyed) return;
    const sprite = new Sprite(texture);
    const { width, height } = this.app.screen;
    const scale = Math.min(width / texture.width, height / texture.height);
    sprite.scale.set(scale);
    sprite.position.set((width - texture.width * scale) / 2, (height - texture.height * scale) / 2);
    this.active.clear();
    this.history.replaceAll(sprite);
    this.onChange?.();
  }

  /** PNG рисунка (с белым фоном) в виде data URL. */
  async exportPng(): Promise<string> {
    const { width, height } = this.app.screen;
    const scale = Math.min(1, EXPORT_MAX_SIDE / Math.max(width, height));
    const frame = new Container();
    const background = new Graphics().rect(0, 0, width, height).fill(CANVAS_BACKGROUND);
    frame.addChild(background);
    frame.addChild(this.strokes);
    try {
      return await this.app.renderer.extract.base64({
        target: frame,
        frame: new Rectangle(0, 0, width, height),
        resolution: scale,
        format: 'png',
      });
    } finally {
      this.app.stage.addChildAt(this.strokes, 0);
      background.destroy();
      frame.destroy();
    }
  }

  destroy() {
    this.destroyed = true;
    this.active.clear();
    this.app.destroy(true, { children: true });
  }

  private setupInput() {
    const { stage } = this.app;
    stage.addChild(this.strokes);
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;
    stage.on('pointerdown', this.onDown);
    stage.on('pointermove', this.onMove);
    stage.on('pointerup', this.onUp);
    stage.on('pointerupoutside', this.onUp);
    stage.on('pointercancel', this.onUp);
  }

  private onDown = (e: FederatedPointerEvent) => {
    const graphics = new Graphics();
    this.history.push(graphics);
    const last = e.global.clone();
    this.active.set(e.pointerId, { graphics, last });
    // Точка при одиночном касании.
    this.tool.drawSegment(graphics, last, { x: last.x + 0.1, y: last.y }, this.color);
    this.onChange?.();
  };

  private onMove = (e: FederatedPointerEvent) => {
    const stroke = this.active.get(e.pointerId);
    if (!stroke) return;
    const point = e.global.clone();
    // Слишком близкие точки не добавляем: меньше вершин — плавнее на слабых планшетах.
    if (Math.hypot(point.x - stroke.last.x, point.y - stroke.last.y) < 1.5) return;
    this.tool.drawSegment(stroke.graphics, stroke.last, point, this.color);
    stroke.last = point;
  };

  private onUp = (e: FederatedPointerEvent) => {
    this.active.delete(e.pointerId);
  };
}
