// Частицы: искры при сборе капли, кольцо у чёрной дыры, салют при победе.
import { drawStar } from './canvas';
import { PETALS } from './colors';

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

export type BurstKind = 'collect' | 'swallow' | 'win' | 'splash' | 'grow';

export class Particles {
  private particles: Particle[] = [];

  burst(x: number, y: number, kind: BurstKind) {
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

  /** Сдвигает живые частицы на кадр и рисует их; погасшие выбрасывает. */
  draw(ctx: CanvasRenderingContext2D) {
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
