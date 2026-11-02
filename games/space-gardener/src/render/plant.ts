// Растение в горшке: семечко → стебель с листьями → бутон → цветок с лицом.
import { PETALS } from './colors';

/** `x` — центр горшка, `top` — его верхний край, `growth` — доля собранной воды 0..1, `bloom` — раскрытие цветка 0..1. */
export function drawPlant(ctx: CanvasRenderingContext2D, x: number, top: number, growth: number, bloom: number, time: number) {
  const g = growth;
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
}
