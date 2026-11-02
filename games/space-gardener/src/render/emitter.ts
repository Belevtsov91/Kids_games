// Комета-лейка: моргает и открывает рот, пока льёт воду.
import type { Level } from '../game/levels';

export function drawEmitter(ctx: CanvasRenderingContext2D, level: Level, active: boolean, time: number) {
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
