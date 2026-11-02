import type { Sfx } from '../audio/Sfx';
import { extendStroke, type Vec } from '../game/ink';
import { PLANK_TURN } from '../game/levels';
import { WORLD_SIZE, type Plank, type Simulation } from '../game/simulation';
import type { Renderer } from '../render';
import type { Listeners } from '../ui/dom';

// Ввод пальцем или мышью: рисование лиан и перетаскивание досок (короткое нажатие — поворот).

interface Drag {
  pointerId: number;
  plank: Plank | null;
  start: Vec;
  offset: Vec;
  moved: boolean;
}

interface Host {
  /** Текущая попытка (null на карте уровней). */
  currentSim(): Simulation | null;
  /** Можно ли начать новый штрих: экран уровня, попытка не кончилась, карточка результата закрыта. */
  canStartEditing(): boolean;
  /** Палец коснулся поля: спрятать подсказку. */
  onTouch(): void;
  /** Лиана кончилась. */
  onInkEmpty(): void;
  /** Лиану дорисовали или доску повернули — обновить панели. */
  onChange(): void;
}

const clampToWorld = (p: Vec): Vec => ({ x: Math.max(0, Math.min(WORLD_SIZE, p.x)), y: Math.max(0, Math.min(WORLD_SIZE, p.y)) });

export class PointerInput {
  /** Штрих, который рисуют прямо сейчас. */
  stroke: Vec[] | null = null;
  private drag: Drag | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: Renderer,
    private readonly sfx: Sfx,
    private readonly host: Host,
    listeners: Listeners,
  ) {
    listeners.on(canvas, 'pointerdown', this.onDown);
    listeners.on(canvas, 'pointermove', this.onMove);
    listeners.on(canvas, 'pointerup', this.onUp);
    listeners.on(canvas, 'pointercancel', this.onUp);
  }

  /** Доска, которую тащат (для подсветки). */
  get draggedPlank() {
    return this.drag?.plank ?? null;
  }

  cancel() {
    this.stroke = null;
    this.drag = null;
  }

  private onDown = (e: PointerEvent) => {
    const sim = this.host.currentSim();
    if (!sim || !this.host.canStartEditing() || this.drag || !e.isPrimary) return;
    const p = this.renderer.toWorld(e.clientX, e.clientY);
    if (p.x < -20 || p.y < -20 || p.x > WORLD_SIZE + 20 || p.y > WORLD_SIZE + 20) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.host.onTouch();
    const plank = sim.plankAt(p, 26 / Math.min(1, this.renderer.view.scale * 1.4));
    if (plank) {
      const { position } = plank.body;
      this.drag = { pointerId: e.pointerId, plank, start: p, offset: { x: position.x - p.x, y: position.y - p.y }, moved: false };
      return;
    }
    if (sim.inkLeft < 1) {
      this.sfx.empty();
      this.host.onInkEmpty();
      return;
    }
    this.drag = { pointerId: e.pointerId, plank: null, start: p, offset: { x: 0, y: 0 }, moved: false };
    this.stroke = [clampToWorld(p)];
  };

  private onMove = (e: PointerEvent) => {
    const drag = this.drag;
    const sim = this.host.currentSim();
    if (!drag || !sim || e.pointerId !== drag.pointerId) return;
    // Касание сыплет события чаще кадра: берём все промежуточные точки, линия выходит ровнее.
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const points = (events.length ? events : [e]).map((ev) => this.renderer.toWorld(ev.clientX, ev.clientY));
    const last = points[points.length - 1];
    if (Math.hypot(last.x - drag.start.x, last.y - drag.start.y) > 6) drag.moved = true;

    if (drag.plank) {
      sim.movePlank(drag.plank, last.x + drag.offset.x, last.y + drag.offset.y);
      return;
    }
    if (!this.stroke) return;
    for (const point of points) {
      const before = this.stroke.length;
      const ok = extendStroke(this.stroke, clampToWorld(point), sim.inkLeft);
      if (this.stroke.length > before) this.sfx.rustle();
      if (!ok) break;
    }
  };

  private onUp = (e: PointerEvent) => {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    const sim = this.host.currentSim();
    if (!sim) return;
    if (drag.plank) {
      if (!drag.moved) {
        sim.turnPlank(drag.plank, PLANK_TURN);
        this.sfx.click();
      }
      return;
    }
    const stroke = this.stroke;
    this.stroke = null;
    if (stroke && sim.addLine(stroke)) this.sfx.vineDone();
    this.host.onChange();
  };
}
