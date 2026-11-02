import { Application, Container, Graphics, type FederatedPointerEvent, type PointData } from 'pixi.js';
import type { BrushTool } from '../tools';
import { CANVAS_BACKGROUND } from './constants';

/** Обёртка над PixiJS: холст, ввод указателем и штрихи. React-код общается только с ней. */
export class DrawingEngine {
  tool: BrushTool;
  color: number;

  private readonly app = new Application();
  private readonly strokes = new Container();
  private current: Graphics | null = null;
  private last: PointData | null = null;

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
      resolution: window.devicePixelRatio || 1,
    });
    host.appendChild(engine.app.canvas);
    engine.setupInput();
    return engine;
  }

  clear() {
    this.strokes.removeChildren().forEach((child) => child.destroy());
  }

  destroy() {
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
  }

  private onDown = (e: FederatedPointerEvent) => {
    this.current = new Graphics();
    this.strokes.addChild(this.current);
    this.last = e.global.clone();
    // Точка при одиночном касании.
    this.tool.drawSegment(this.current, this.last, { x: this.last.x + 0.1, y: this.last.y }, this.color);
  };

  private onMove = (e: FederatedPointerEvent) => {
    if (!this.current || !this.last) return;
    const point = e.global.clone();
    this.tool.drawSegment(this.current, this.last, point, this.color);
    this.last = point;
  };

  private onUp = () => {
    this.current = null;
    this.last = null;
  };
}
