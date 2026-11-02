// Капли воды: одна заранее нарисованная картинка-спрайт, которая копируется на каждую каплю.
import type Matter from 'matter-js';
import { DROP_R } from '../game/simulation';

export function makeDropSprite() {
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

export function drawDrops(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, drops: readonly Matter.Body[]) {
  const s = (DROP_R + 3) * 2;
  for (const drop of drops) ctx.drawImage(sprite, drop.position.x - s / 2, drop.position.y - s / 2, s, s);
}
