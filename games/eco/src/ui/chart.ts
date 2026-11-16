// График-прогноз: столбики выработки (солнце + ветер) и ступеньки расхода по часам с рассвета.
import type { DayResult } from '../game/sim';

const W = 480;
const H = 150;
const PAD = 18;

export interface ChartState {
  result: DayResult;
  /** Номер текущего часа при просмотре суток (0–23), -1 — не идёт. */
  cursor: number;
  /** Показывать провалы и заряд: после запуска суток. */
  revealed: boolean;
}

export function chartSvg({ result, cursor, revealed }: ChartState, labels: { hour: (clock: number) => string }) {
  const { hours, capacity } = result;
  const top = Math.max(4, ...hours.map((h) => Math.max(h.solar + h.wind, h.demand))) * 1.1;
  const bw = (W - PAD * 2) / hours.length;
  const y = (v: number) => H - PAD - (v / top) * (H - PAD * 2);
  const parts: string[] = [];

  hours.forEach((h, i) => {
    const x = PAD + i * bw;
    const night = h.clock < 6 || h.clock >= 18;
    if (night) parts.push(`<rect x="${x}" y="${PAD / 2}" width="${bw}" height="${H - PAD * 1.5}" class="eco-ch-night"/>`);
    if (revealed && h.missing > 0) parts.push(`<rect x="${x}" y="${PAD / 2}" width="${bw}" height="${H - PAD * 1.5}" class="eco-ch-dark"/>`);
    const sunTop = y(h.solar);
    parts.push(`<rect x="${x + 2}" y="${sunTop}" width="${bw - 4}" height="${H - PAD - sunTop}" rx="2" class="eco-ch-sun"/>`);
    const windTop = y(h.solar + h.wind);
    parts.push(`<rect x="${x + 2}" y="${windTop}" width="${bw - 4}" height="${sunTop - windTop}" rx="2" class="eco-ch-wind"/>`);
    if (i % 6 === 0) parts.push(`<text x="${x + 1}" y="${H - 3}" class="eco-ch-label">${labels.hour(h.clock)}</text>`);
  });

  const steps = hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${PAD + i * bw} ${y(h.demand)}H${PAD + (i + 1) * bw}`).join('');
  parts.push(`<path d="${steps}" class="eco-ch-demand"/>`);

  if (revealed && capacity > 0) {
    const cy = (v: number) => H - PAD - (v / capacity) * (H - PAD * 2);
    const line = hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${PAD + (i + 0.5) * bw} ${cy(h.charge)}`).join('');
    parts.push(`<path d="${line}" class="eco-ch-charge"/>`);
  }
  if (cursor >= 0) parts.push(`<rect x="${PAD + cursor * bw}" y="2" width="${bw}" height="${H - PAD}" rx="3" class="eco-ch-cursor"/>`);

  return `<svg viewBox="0 0 ${W} ${H}" class="eco-chart-svg" role="img">${parts.join('')}</svg>`;
}
