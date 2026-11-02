import type { Vec } from './game/ink';
import type { Level } from './game/levels';
import {
  DROP_R,
  LINE_W,
  PLANK_W,
  plankEnds,
  POT_H,
  POT_WALL,
  SPINNER_W,
  WALL_W,
  WORLD_SIZE,
  type Plank,
  type Simulation,
} from './game/simulation';

// Отрисовка на Canvas 2D: звёздное небо, уровень, капли, частицы.
// Мир 800×800 вписывается в экран целиком; вокруг него — небо.

export interface View {
  scale: number;
  ox: number;
  oy: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FrameState {
  sim: Simulation | null;
  /** Штрих, который рисуют прямо сейчас. */
  stroke: Vec[] | null;
  /** Прозрачность подсказки-решения, 0 — не видно. */
  ghost: number;
  /** Доска, которую тащат. */
  dragged: unknown;
  /** 0..1 — раскрытие цветка после победы. */
  bloom: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'dot' | 'star' | 'ring';
}

const PETALS = ['#ff7eb6', '#ffb86b', '#c792ff', '#7ee7ff'];

export class Renderer {
  view: View = { scale: 1, ox: 0, oy: 0 };
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private readonly stars = Array.from({ length: 160 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.3,
    phase: Math.random() * Math.PI * 2,
  }));
  private particles: Particle[] = [];
  private readonly dropSprite: HTMLCanvasElement;
  private asteroidShapes = new Map<object, Vec[]>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.dropSprite = makeDropSprite();
  }

  resize(width: number, height: number, insets: Insets) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const availW = Math.max(100, width - insets.left - insets.right);
    const availH = Math.max(100, height - insets.top - insets.bottom);
    const scale = Math.min(availW / WORLD_SIZE, availH / WORLD_SIZE);
    this.view = {
      scale,
      ox: insets.left + (availW - WORLD_SIZE * scale) / 2,
      oy: insets.top + (availH - WORLD_SIZE * scale) / 2,
    };
  }

  toWorld(clientX: number, clientY: number): Vec {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - this.view.ox) / this.view.scale,
      y: (clientY - rect.top - this.view.oy) / this.view.scale,
    };
  }

  /** Экранные координаты точки мира (для пузыря-подсказки и т.п.). */
  toScreen(p: Vec): Vec {
    return { x: this.view.ox + p.x * this.view.scale, y: this.view.oy + p.y * this.view.scale };
  }

  burst(x: number, y: number, kind: 'collect' | 'swallow' | 'win' | 'splash' | 'grow') {
    const add = (n: number, make: () => Partial<Particle>) => {
      for (let i = 0; i < n; i++) {
        const max = 40 + Math.random() * 30;
        this.particles.push({ x, y, vx: 0, vy: 0, life: max, max, size: 3, color: '#fff', kind: 'dot', ...make() });
      }
    };
    const angle = () => Math.random() * Math.PI * 2;
    if (kind === 'collect') {
      add(5, () => {
        const a = angle();
        return { vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 1.5, color: '#9cf6ff', size: 2.5, kind: 'star' };
      });
    } else if (kind === 'splash') {
      add(3, () => ({ vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2.5, color: '#7fd4ff', size: 2, life: 20, max: 20 }));
    } else if (kind === 'swallow') {
      add(1, () => ({ color: '#c08bff', size: 14, kind: 'ring', life: 30, max: 30 }));
    } else if (kind === 'grow') {
      add(12, () => {
        const a = angle();
        return { vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, color: '#b6ff8a', size: 3, kind: 'star' };
      });
    } else {
      add(70, () => {
        const a = angle();
        const s = 2 + Math.random() * 6;
        const max = 70 + Math.random() * 50;
        return {
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 3,
          color: PETALS[Math.floor(Math.random() * PETALS.length)],
          size: 3 + Math.random() * 3,
          kind: Math.random() < 0.5 ? 'star' : 'dot',
          life: max,
          max,
        };
      });
    }
  }

  draw(state: FrameState, time: number) {
    const { ctx } = this;
    this.drawSky(time);
    const { sim } = state;
    if (!sim) return;

    const { scale, ox, oy } = this.view;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    this.drawField();
    const { level } = sim;
    level.holes?.forEach((h) => this.drawHole(h, time));
    level.walls?.forEach((w) => this.drawWall(w));
    level.asteroids?.forEach((a) => this.drawAsteroid(a));
    this.drawPot(level, sim, state.bloom, time);
    if (state.ghost > 0) this.drawGhost(level, state.ghost, time);
    for (const line of sim.lines) this.drawVine(line.points, 1);
    if (state.stroke && state.stroke.length > 0) this.drawVine(state.stroke, 0.75);
    for (const plank of sim.planks) this.drawPlank(plank, plank === state.dragged, time);
    for (const spinner of sim.spinners) this.drawSpinner(spinner.body.position, spinner.body.angle, spinner.len);
    this.drawEmitter(level, sim.phase === 'pouring' && sim.emitted < level.drops, time);
    for (const drop of sim.drops) {
      const s = (DROP_R + 3) * 2;
      ctx.drawImage(this.dropSprite, drop.position.x - s / 2, drop.position.y - s / 2, s, s);
    }
    this.drawParticles();
    ctx.restore();
  }

  private drawSky(time: number) {
    const { ctx, width: w, height: h } = this;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0b0f2e');
    bg.addColorStop(0.6, '#1a1146');
    bg.addColorStop(1, '#2a0f45');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const nebula = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    nebula(w * 0.15, h * 0.2, Math.max(w, h) * 0.45, 'rgba(90, 60, 200, 0.25)');
    nebula(w * 0.85, h * 0.8, Math.max(w, h) * 0.5, 'rgba(200, 60, 160, 0.18)');

    for (const s of this.stars) {
      const a = 0.45 + 0.55 * Math.sin(time / 700 + s.phase) ** 2;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawField() {
    const { ctx } = this;
    ctx.save();
    roundRect(ctx, 0, 0, WORLD_SIZE, WORLD_SIZE, 36);
    ctx.fillStyle = 'rgba(120, 160, 255, 0.05)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.strokeStyle = 'rgba(140, 180, 255, 0.22)';
    ctx.stroke();
    ctx.restore();
  }

  private drawEmitter(level: Level, active: boolean, time: number) {
    const { ctx } = this;
    const { x, y } = level.emitter;
    const bob = Math.sin(time / 400) * 3;
    ctx.save();
    ctx.translate(x, y + bob);
    // Хвост кометы.
    const tail = ctx.createLinearGradient(0, 0, 90, -60);
    tail.addColorStop(0, 'rgba(140, 220, 255, 0.55)');
    tail.addColorStop(1, 'rgba(140, 220, 255, 0)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(-18, -22);
    ctx.quadraticCurveTo(60, -70, 120, -80);
    ctx.quadraticCurveTo(70, -20, 24, 20);
    ctx.closePath();
    ctx.fill();
    // Тело.
    const body = ctx.createRadialGradient(-10, -12, 4, 0, 0, 34);
    body.addColorStop(0, '#e9fbff');
    body.addColorStop(0.5, '#8fdcff');
    body.addColorStop(1, '#3a8fd9');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    // Лицо: моргает раз в несколько секунд.
    const blink = time % 3600 < 140;
    ctx.fillStyle = '#16325c';
    for (const ex of [-11, 11]) {
      ctx.beginPath();
      if (blink) ctx.fillRect(ex - 5, -6, 10, 2.5);
      else ctx.ellipse(ex, -5, 4, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 130, 170, 0.6)';
    ctx.beginPath();
    ctx.arc(-18, 5, 4.5, 0, Math.PI * 2);
    ctx.arc(18, 5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16325c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (active) ctx.ellipse(0, 9, 5, 6, 0, 0, Math.PI * 2);
    else ctx.arc(0, 5, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  private drawPot(level: Level, sim: Simulation, bloom: number, time: number) {
    const { ctx } = this;
    const { x, y, w } = level.pot;
    const top = y - POT_H;
    const outer = w / 2 + POT_WALL;

    // Летающий островок под горшком.
    ctx.save();
    ctx.fillStyle = '#4b3a6b';
    ctx.beginPath();
    ctx.moveTo(x - outer - 26, y + POT_WALL);
    ctx.quadraticCurveTo(x, y + POT_WALL + 70, x + outer + 26, y + POT_WALL);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6fd18c';
    roundRect(ctx, x - outer - 30, y + POT_WALL - 6, (outer + 30) * 2, 12, 6);
    ctx.fill();
    ctx.restore();

    // Растение растёт с каждой каплей.
    const g = sim.growth;
    const stemTop = top - 10 - 110 * g - 30 * bloom;
    const sway = Math.sin(time / 600) * 4 * g;
    ctx.save();
    ctx.strokeStyle = '#3fbf5f';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    if (g > 0) {
      ctx.beginPath();
      ctx.moveTo(x, top + 12);
      ctx.quadraticCurveTo(x - 14 + sway, (top + stemTop) / 2, x + sway, stemTop);
      ctx.stroke();
      const leaf = (t: number, side: number, size: number) => {
        const ly = top + 12 + (stemTop - top - 12) * t;
        ctx.save();
        ctx.translate(x + sway * t - 4, ly);
        ctx.rotate(side * 0.7);
        ctx.fillStyle = '#5be07f';
        ctx.beginPath();
        ctx.ellipse(side * size, 0, size, size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      leaf(0.35, -1, 10 + 8 * Math.min(1, g * 2));
      if (g >= 0.25) leaf(0.55, 1, 14 * Math.min(1, (g - 0.25) * 3 + 0.3));
      if (g >= 0.5) leaf(0.75, -1, 12 * Math.min(1, (g - 0.5) * 3 + 0.3));
    }
    // Бутон и цветок.
    if (g >= 0.75 || bloom > 0) {
      const open = bloom;
      const bx = x + sway;
      const by = stemTop;
      const petals = 8;
      const radius = 10 + 18 * open;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(time / 2000);
      for (let i = 0; i < petals; i++) {
        ctx.rotate((Math.PI * 2) / petals);
        ctx.fillStyle = PETALS[i % PETALS.length];
        ctx.beginPath();
        ctx.ellipse(radius * 0.9, 0, radius * 0.75, radius * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(bx, by, 9 + 6 * open, 0, Math.PI * 2);
      ctx.fill();
      if (open > 0.5) {
        ctx.fillStyle = '#5a3a1a';
        ctx.beginPath();
        ctx.arc(bx - 4, by - 2, 1.8, 0, Math.PI * 2);
        ctx.arc(bx + 4, by - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bx, by + 1, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    } else if (g === 0) {
      // Семечко ждёт воду.
      ctx.fillStyle = '#c99a5b';
      ctx.beginPath();
      ctx.ellipse(x, top + 14, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Сам горшок: чуть шире кверху, поверх физических стенок.
    ctx.save();
    const potGrad = ctx.createLinearGradient(x - outer, 0, x + outer, 0);
    potGrad.addColorStop(0, '#d2693c');
    potGrad.addColorStop(0.5, '#f08a52');
    potGrad.addColorStop(1, '#c25a30');
    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.moveTo(x - outer - 4, top);
    ctx.lineTo(x + outer + 4, top);
    ctx.lineTo(x + outer - 6, y + POT_WALL);
    ctx.lineTo(x - outer + 6, y + POT_WALL);
    ctx.closePath();
    ctx.fill();
    // Земля и вода внутри видны через «окошко».
    ctx.fillStyle = '#5b3a24';
    roundRect(ctx, x - w / 2, top + 12, w, POT_H - 12, 8);
    ctx.fill();
    const water = g * (POT_H - 20);
    ctx.fillStyle = 'rgba(110, 200, 255, 0.55)';
    roundRect(ctx, x - w / 2 + 4, y - water - 2, w - 8, water, 6);
    ctx.fill();
    ctx.fillStyle = '#e07a45';
    roundRect(ctx, x - outer - 8, top - 6, (outer + 8) * 2, 16, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, x - outer - 2, top - 3, (outer + 2) * 2 * 0.4, 5, 3);
    ctx.fill();
    ctx.restore();
  }

  private drawVine(points: readonly Vec[], alpha: number) {
    const { ctx } = this;
    if (points.length === 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      if (points.length === 1) ctx.lineTo(points[0].x + 0.1, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
      }
      const last = points[points.length - 1];
      if (points.length > 1) ctx.lineTo(last.x, last.y);
    };
    path();
    ctx.strokeStyle = '#1f7a3e';
    ctx.lineWidth = LINE_W + 4;
    ctx.stroke();
    path();
    ctx.strokeStyle = '#4fd47a';
    ctx.lineWidth = LINE_W;
    ctx.stroke();
    path();
    ctx.strokeStyle = 'rgba(210, 255, 200, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Листики через каждые ~45 единиц.
    let acc = 0;
    let side = 1;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      acc += seg;
      if (acc < 45) continue;
      acc = 0;
      side = -side;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang + side * 0.9);
      ctx.fillStyle = '#7ef09a';
      ctx.beginPath();
      ctx.ellipse(0, -side * 10, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawGhost(level: Level, alpha: number, time: number) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -time / 30;
    ctx.lineCap = 'round';
    ctx.lineWidth = LINE_W;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    for (const line of level.solution.lines) {
      ctx.beginPath();
      line.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
    level.solution.planks?.forEach((p, i) => {
      const len = level.planks?.[i]?.len ?? 200;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(120, 240, 255, 0.95)';
      roundRect(ctx, -len / 2, -PLANK_W / 2, len, PLANK_W, PLANK_W / 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  private drawPlank(plank: Plank, dragged: boolean, time: number) {
    const { ctx } = this;
    const [a, b] = plankEnds(plank);
    const { len } = plank;
    ctx.save();
    ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
    ctx.rotate(plank.body.angle);
    const glow = dragged ? 1 : 0.5 + 0.3 * Math.sin(time / 300);
    ctx.shadowColor = `rgba(120, 240, 255, ${glow})`;
    ctx.shadowBlur = dragged ? 24 : 14;
    const grad = ctx.createLinearGradient(0, -PLANK_W / 2, 0, PLANK_W / 2);
    grad.addColorStop(0, '#c9fbff');
    grad.addColorStop(1, '#3fc4e6');
    ctx.fillStyle = grad;
    roundRect(ctx, -len / 2, -PLANK_W / 2, len, PLANK_W, PLANK_W / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Точки-«ручка»: значит, доску можно двигать.
    ctx.fillStyle = 'rgba(20, 70, 110, 0.6)';
    for (const dx of [-16, -6, 4, 14]) {
      ctx.beginPath();
      ctx.arc(dx, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawSpinner(pos: Vec, angle: number, len: number) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffb347';
    roundRect(ctx, -len / 2, -SPINNER_W / 2, len, SPINNER_W, SPINNER_W / 2);
    ctx.fill();
    ctx.fillStyle = '#4aa3ff';
    for (const s of [-1, 1]) {
      roundRect(ctx, s * len * 0.25 - 16, -SPINNER_W / 2 + 2, 32, SPINNER_W - 4, 3);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#e8e8f5';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWall(w: { x1: number; y1: number; x2: number; y2: number }) {
    const { ctx } = this;
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) + WALL_W;
    ctx.save();
    ctx.translate((w.x1 + w.x2) / 2, (w.y1 + w.y2) / 2);
    ctx.rotate(Math.atan2(w.y2 - w.y1, w.x2 - w.x1));
    const grad = ctx.createLinearGradient(0, -WALL_W / 2, 0, WALL_W / 2);
    grad.addColorStop(0, '#aab6d6');
    grad.addColorStop(1, '#55607e');
    ctx.fillStyle = grad;
    roundRect(ctx, -len / 2, -WALL_W / 2, len, WALL_W, WALL_W / 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(30, 36, 60, 0.6)';
    for (let x = -len / 2 + 18; x < len / 2 - 10; x += 34) {
      ctx.beginPath();
      ctx.arc(x, 0, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawAsteroid(a: { x: number; y: number; r: number }) {
    const { ctx } = this;
    let shape = this.asteroidShapes.get(a);
    if (!shape) {
      shape = Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2;
        const rr = a.r * (1 + Math.sin(i * 2.7 + a.x) * 0.06);
        return { x: Math.cos(ang) * rr, y: Math.sin(ang) * rr };
      });
      this.asteroidShapes.set(a, shape);
    }
    ctx.save();
    ctx.translate(a.x, a.y);
    const grad = ctx.createRadialGradient(-a.r * 0.4, -a.r * 0.4, a.r * 0.1, 0, 0, a.r * 1.1);
    grad.addColorStop(0, '#b9a9c9');
    grad.addColorStop(1, '#5d4f73');
    ctx.fillStyle = grad;
    ctx.beginPath();
    shape.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(60, 45, 80, 0.45)';
    for (const [cx, cy, cr] of [
      [0.3, -0.2, 0.22],
      [-0.35, 0.3, 0.16],
      [0.1, 0.45, 0.12],
    ]) {
      ctx.beginPath();
      ctx.arc(cx * a.r, cy * a.r, cr * a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawHole(h: { x: number; y: number; r: number }, time: number) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(h.x, h.y);
    const reach = h.r * 3;
    const glow = ctx.createRadialGradient(0, 0, h.r * 0.5, 0, 0, reach);
    glow.addColorStop(0, 'rgba(150, 80, 255, 0.45)');
    glow.addColorStop(1, 'rgba(150, 80, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, reach, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(time / 500);
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = `rgba(${200 - i * 15}, 140, 255, 0.7)`;
      ctx.beginPath();
      ctx.arc(0, 0, h.r * (1.1 + i * 0.25), 0, Math.PI * 0.9);
      ctx.stroke();
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, h.r);
    core.addColorStop(0, '#000');
    core.addColorStop(0.7, '#0a0418');
    core.addColorStop(1, '#5a2aa8');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, h.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawParticles() {
    const { ctx } = this;
    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life--;
      if (p.life <= 0) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.kind === 'ring' ? 0 : 0.08;
      p.vx *= 0.98;
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'star') {
        ctx.fillStyle = p.color;
        drawStar(ctx, p.x, p.y, p.size * 1.6, p.size * 0.7);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      alive.push(p);
    }
    ctx.globalAlpha = 1;
    this.particles = alive;
  }
}

function makeDropSprite() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const r = size / 2;
  const glow = ctx.createRadialGradient(r, r, r * 0.4, r, r, r);
  glow.addColorStop(0, 'rgba(120, 210, 255, 0.5)');
  glow.addColorStop(1, 'rgba(120, 210, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const body = ctx.createRadialGradient(r * 0.8, r * 0.75, 2, r, r, r * 0.7);
  body.addColorStop(0, '#e8fbff');
  body.addColorStop(0.45, '#6fd0ff');
  body.addColorStop(1, '#2a7fe0');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(r, r, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}
