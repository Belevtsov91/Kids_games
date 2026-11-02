// Холст поверх сцены: летящие ноты и конфетти. Кадры рисуются, только пока есть частицы.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  glyph: string | null;
  gravity: number;
}

const NOTE_GLYPHS = ['♪', '♫', '♩', '♬'];
const CONFETTI_COLORS = ['#ff5a5f', '#ffb400', '#00a699', '#7b61ff', '#ff7eb6', '#3fae4a', '#4f8fe0'];

export class Effects {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private readonly particles: Particle[] = [];
  private frame = 0;
  private last = 0;
  private readonly observer: ResizeObserver;
  private readonly reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor() {
    this.canvas.className = 'ao-fx';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d')!;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.canvas);
  }

  /** Ноты вылетают из точки (координаты внутри холста, CSS-пиксели). */
  notes(x: number, y: number, color: string, count = 3) {
    if (this.reducedMotion) count = 1;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: (Math.random() - 0.5) * 90,
        vy: -140 - Math.random() * 120,
        rot: (Math.random() - 0.5) * 0.6,
        vr: (Math.random() - 0.5) * 2,
        life: 0,
        ttl: 1.1 + Math.random() * 0.5,
        size: 26 + Math.random() * 18,
        color,
        glyph: NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)],
        gravity: 40,
      });
    }
    this.start();
  }

  confetti() {
    const w = this.canvas.clientWidth;
    const count = this.reducedMotion ? 30 : 120;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: -20 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 160,
        vy: 80 + Math.random() * 160,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 10,
        life: 0,
        ttl: 2.2 + Math.random(),
        size: 8 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        glyph: null,
        gravity: 160,
      });
    }
    this.start();
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.particles.length = 0;
    this.canvas.remove();
  }

  private resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.canvas.clientWidth * ratio);
    this.canvas.height = Math.round(this.canvas.clientHeight * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private start() {
    if (this.frame) return;
    this.last = performance.now();
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.ttl) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const fade = 1 - p.life / p.ttl;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.fillStyle = p.color;
      if (p.glyph) {
        ctx.font = `700 ${p.size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgb(255 255 255 / 0.9)';
        ctx.lineWidth = 4;
        ctx.strokeText(p.glyph, 0, 0);
        ctx.fillText(p.glyph, 0, 0);
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }

    this.frame = this.particles.length ? requestAnimationFrame((t) => this.tick(t)) : 0;
    if (!this.frame) ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
