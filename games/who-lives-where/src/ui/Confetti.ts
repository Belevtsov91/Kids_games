// Слой-холст поверх игры: конфетти при победе и искорки, когда зверь попал домой.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  spin: number;
  angle: number;
  color: string;
  life: number;
  shape: 'rect' | 'star';
}

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f45'];

export class Confetti {
  readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d')!;
  private particles: Particle[] = [];
  private frame = 0;
  private last = 0;
  private readonly observer = new ResizeObserver(() => this.resize());

  constructor(parent: HTMLElement) {
    this.canvas.className = 'wlw-confetti';
    this.canvas.setAttribute('aria-hidden', 'true');
    parent.appendChild(this.canvas);
    this.observer.observe(this.canvas);
  }

  /** Искорки в точке (координаты относительно холста). */
  sparkle(x: number, y: number, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 160 + Math.random() * 220;
      this.add({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120, size: 7 + Math.random() * 6, life: 0.9, shape: 'star' });
    }
  }

  /** Дождь конфетти сверху на весь экран. */
  burst(count = 140) {
    const width = this.canvas.clientWidth;
    for (let i = 0; i < count; i++) {
      this.add({
        x: Math.random() * width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 160,
        vy: 80 + Math.random() * 160,
        size: 8 + Math.random() * 8,
        life: 3.2,
        shape: Math.random() < 0.25 ? 'star' : 'rect',
      });
    }
  }

  clear() {
    this.particles = [];
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.canvas.remove();
  }

  private add(p: Pick<Particle, 'x' | 'y' | 'vx' | 'vy' | 'size' | 'life' | 'shape'>) {
    this.particles.push({ ...p, spin: (Math.random() - 0.5) * 12, angle: Math.random() * Math.PI, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private resize() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(this.canvas.clientWidth * ratio);
    this.canvas.height = Math.round(this.canvas.clientHeight * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    const height = this.canvas.clientHeight;

    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.vy += (p.shape === 'star' ? 420 : 60) * dt;
      p.vx *= 1 - 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      if (p.life <= 0 || p.y > height + 40) return false;

      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else drawStar(ctx, p.size / 2);
      ctx.restore();
      return true;
    });

    this.frame = this.particles.length ? requestAnimationFrame(this.tick) : 0;
    if (!this.frame) ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
  };
}

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fill();
}
