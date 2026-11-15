// Один рейс: холст со сценой, прицел пальцем или ползунками, полёт в реальном времени.
import type { GameComfort } from '@ig/sdk';
import type { Sound } from '../audio/Sound';
import { advance, burn, home, previewPath, startFlight, timeScale, type Flight, type FlightStatus } from '../game/flight';
import type { Level } from '../game/levels';
import type { Vec } from '../game/physics';
import { tr } from '../i18n';
import { aimToward, createControls, type Aim } from '../ui/controls';
import { el } from '../ui/dom';
import { drawFrame } from '../ui/render';
import { fitView, toWorld, type View } from '../ui/view';

export interface MissionEnd {
  status: FlightStatus;
  got: number;
  attempts: number;
}

export class Mission {
  readonly root = el('div', 'sn-mission');
  private readonly canvas = el('canvas', 'sn-canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly info = el('div', 'sn-info');
  private readonly status = el('div', 'sn-status');
  private readonly controls: ReturnType<typeof createControls>;
  private readonly observer: ResizeObserver;
  private view: View = fitView(1, 1);
  private aim: Aim;
  private flight: Flight | null = null;
  private preview: Vec[] = [];
  private attempts = 0;
  private clock = 0;
  private wave = 0;
  private last = 0;
  private raf = 0;
  private paused = false;
  private dragging = false;
  private ended = false;

  constructor(
    private readonly level: Level,
    aim: Aim,
    private readonly sound: Sound,
    private readonly comfort: GameComfort,
    private readonly onEnd: (end: MissionEnd) => void,
  ) {
    const t = tr();
    this.aim = aim;
    this.ctx = this.canvas.getContext('2d')!;
    this.info.append(
      el('div', 'sn-goal', level.goal === 'orbit' ? t.goalOrbit : t.goalLand),
      el('div', 'sn-hint', t.hints[level.id]),
    );
    this.controls = createControls(aim, {
      onAim: (a) => this.setAim(a),
      onLaunch: () => this.launch(),
      onBrake: () => this.brake(),
      onRetry: () => this.reset(),
    });
    const field = el('div', 'sn-field');
    this.canvas.setAttribute('aria-label', t.aimHint);
    field.append(this.canvas, this.status);
    this.root.append(this.info, field, this.controls.root);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.canvas);
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointermove', this.onMove);
    this.canvas.addEventListener('pointerup', this.onUp);
    this.canvas.addEventListener('pointercancel', this.onUp);
    this.reset();
    this.raf = requestAnimationFrame(this.loop);
  }

  get currentAim() {
    return { ...this.aim };
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.last = 0;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.root.remove();
  }

  /** Новая попытка того же рейса: ракета снова на старте. */
  reset() {
    this.flight = null;
    this.ended = false;
    this.wave = 0;
    this.preview = previewPath(this.level, this.aim.angle, this.aim.power);
    this.controls.setFlying(false, 0);
    this.updateStatus();
  }

  private setAim(a: Aim) {
    this.aim = a;
    this.preview = previewPath(this.level, a.angle, a.power);
  }

  private launch() {
    if (this.flight) return;
    this.attempts += 1;
    this.flight = startFlight(this.level, this.aim.angle, this.aim.power);
    this.preview = [];
    this.sound.launch();
    this.controls.setFlying(true, this.flight.burns);
    this.updateStatus();
  }

  private brake() {
    if (!this.flight || !burn(this.flight)) return;
    this.sound.brake();
    this.controls.setFlying(true, this.flight.burns);
  }

  private updateStatus() {
    const t = tr();
    const got = this.flight ? this.flight.got.filter(Boolean).length : 0;
    const parts = [t.attempt(Math.max(1, this.attempts + (this.flight ? 0 : 1)))];
    if (this.level.crystals.length) parts.push(t.crystals(got, this.level.crystals.length));
    this.status.textContent = parts.join('  ·  ');
  }

  private resize() {
    const ratio = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.round(w * ratio));
    this.canvas.height = Math.max(1, Math.round(h * ratio));
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.view = fitView(w, h);
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.last ? Math.min(1 / 20, (now - this.last) / 1000) : 0;
    this.last = now;
    if (this.paused) return;
    this.clock += dt;
    const f = this.flight;
    if (f && f.status === 'flying') {
      for (const e of advance(f, this.level, dt * timeScale(f, this.level))) {
        if (e === 'crystal') {
          this.sound.crystal();
          this.updateStatus();
        }
      }
      if (f.status !== 'flying') this.finish(f);
    }
    if (this.ended && f?.status === 'won') this.wave = Math.min(1, this.wave + dt * 3);
    drawFrame(this.ctx, this.view, {
      level: this.level,
      t: f ? f.t : 0,
      flight: f,
      preview: this.preview,
      aim: f ? null : this.aim,
      clock: this.clock,
      calm: this.comfort.reduceMotion,
      wave: this.wave,
    });
  };

  private finish(f: Flight) {
    if (this.ended) return;
    this.ended = true;
    this.controls.setFlying(true, 0);
    this.onEnd({ status: f.status, got: f.got.filter(Boolean).length, attempts: this.attempts });
  }

  /** Прицел жестом: тянем от планеты Тёпы, длина — мощность. */
  private aimFrom(e: PointerEvent) {
    const a = aimToward(home(this.level), toWorld(this.view, e.offsetX, e.offsetY));
    this.controls.setAim(a);
    this.setAim(a);
  }

  private onDown = (e: PointerEvent) => {
    if (this.flight) return;
    this.dragging = true;
    this.canvas.setPointerCapture?.(e.pointerId);
    this.aimFrom(e);
  };

  private onMove = (e: PointerEvent) => {
    if (this.dragging) this.aimFrom(e);
  };

  private onUp = () => {
    this.dragging = false;
  };
}
