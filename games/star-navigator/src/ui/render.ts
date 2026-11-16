// Рисуем кадр: небо, орбиты, планеты, кристаллы, след, пунктир, ракету и стрелку прицела.
import { captureRadius, type Flight } from '../game/flight';
import type { Level } from '../game/levels';
import { bodyAt, dirOf, type Body, type Vec } from '../game/physics';
import { drawBear, drawHome } from './bear';
import { skyStars, type View } from './view';

export interface Frame {
  level: Level;
  t: number;
  flight: Flight | null;
  preview: Vec[];
  aim: { angle: number; power: number } | null;
  /** Время с начала анимации, секунды: мерцание, пульс цели. */
  clock: number;
  calm: boolean;
  wave: number;
}

const STARS = skyStars(160);

const dot = (ctx: CanvasRenderingContext2D, p: Vec, r: number, fill: string | CanvasGradient) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
};

const drawBody = (ctx: CanvasRenderingContext2D, b: Body, p: Vec, f: Frame) => {
  if (b.kind === 'sun') {
    const glow = ctx.createRadialGradient(p.x, p.y, b.r * 0.6, p.x, p.y, b.r * 2.2);
    glow.addColorStop(0, 'rgba(255,190,60,0.55)');
    glow.addColorStop(1, 'rgba(255,170,0,0)');
    dot(ctx, p, b.r * 2.2, glow);
  }
  if (b.kind === 'target') {
    const pulse = f.calm ? 0 : Math.sin(f.clock * 3) * 4;
    ctx.strokeStyle = 'rgba(160,230,255,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, f.level.goal === 'orbit' ? captureRadius(f.level) : b.r + 12 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const g = ctx.createRadialGradient(p.x - b.r * 0.35, p.y - b.r * 0.4, b.r * 0.15, p.x, p.y, b.r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, b.color);
  g.addColorStop(1, shade(b.color));
  dot(ctx, p, b.r, g);
  if (b.ring) {
    ctx.strokeStyle = 'rgba(255,230,184,0.85)';
    ctx.lineWidth = Math.max(2, b.r * 0.14);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, b.r * 1.7, b.r * 0.45, -0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
};

/** Тёмная сторона планеты: тот же цвет, приглушённый к фиолетовому небу. */
const shade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number, to: number) => Math.round(c * 0.55 + to * 0.45);
  return `rgb(${mix(n >> 16, 40)},${mix((n >> 8) & 255, 26)},${mix(n & 255, 94)})`;
};

const drawCrystal = (ctx: CanvasRenderingContext2D, c: Vec, clock: number, calm: boolean) => {
  const s = 9 + (calm ? 0 : Math.sin(clock * 4) * 1.2);
  ctx.fillStyle = '#7ff3ff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - s);
  ctx.lineTo(c.x + s * 0.7, c.y);
  ctx.lineTo(c.x, c.y + s);
  ctx.lineTo(c.x - s * 0.7, c.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

const drawRocket = (ctx: CanvasRenderingContext2D, p: Vec, angle: number, flame: boolean) => {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  if (flame) {
    ctx.fillStyle = '#ffae00';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-10, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(-10, -8, 6, 16);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(15, 0);
  ctx.lineTo(8, 4);
  ctx.fill();
  dot(ctx, { x: 2, y: 0 }, 2.4, '#4fc3ff');
  ctx.restore();
};

export const drawFrame = (ctx: CanvasRenderingContext2D, view: View, f: Frame) => {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();
  ctx.save();
  ctx.translate(view.ox, view.oy);
  ctx.scale(view.scale, view.scale);

  for (const s of STARS) dot(ctx, s, s.r, `rgba(255,255,255,${0.35 + (s.r / 2.2) * 0.5})`);

  for (const b of f.level.bodies) {
    if (!b.orbit) continue;
    ctx.strokeStyle = 'rgba(217,210,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.orbit.cx, b.orbit.cy, b.orbit.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const b of f.level.bodies) {
    if (b.kind === 'home') drawHome(ctx, b);
    else drawBody(ctx, b, bodyAt(b, f.t), f);
  }
  f.level.crystals.forEach((c, i) => f.flight?.got[i] || drawCrystal(ctx, c, f.clock, f.calm));

  for (const p of f.preview) dot(ctx, p, 2.6, 'rgba(255,255,255,0.85)');
  if (f.flight) {
    ctx.strokeStyle = 'rgba(255,214,120,0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    f.flight.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.lineTo(f.flight.ship.pos.x, f.flight.ship.pos.y);
    ctx.stroke();
    const v = f.flight.ship.vel;
    drawRocket(ctx, f.flight.ship.pos, Math.atan2(v.y, v.x), f.flight.status === 'flying');
  }

  const home = f.level.bodies[0];
  if (f.aim) {
    const d = dirOf(f.aim.angle);
    const len = home.r + 20 + f.aim.power * 1.1;
    ctx.strokeStyle = '#ffd25a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(home.x + d.x * (home.r + 6), home.y + d.y * (home.r + 6));
    ctx.lineTo(home.x + d.x * len, home.y + d.y * len);
    ctx.stroke();
    drawRocket(ctx, { x: home.x + d.x * (home.r + 12), y: home.y + d.y * (home.r + 12) }, Math.atan2(d.y, d.x), false);
  }
  drawBear(ctx, home, f.wave);
  ctx.restore();
};
