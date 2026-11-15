// Небо с солнцем и луной, часы и счётчик баланса: «сейчас дают», «сейчас тратят», заряд батарей.
import type { Hour } from '../game/sim';
import { tr } from '../i18n';
import { el, esc } from './dom';

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',');

/** Яркость неба по часу: 0 ночь, 1 день, плавно на рассвете и закате. */
export function daylight(clock: number) {
  if (clock >= 8 && clock <= 16) return 1;
  if (clock === 7 || clock === 17) return 0.6;
  if (clock === 6 || clock === 18) return 0.3;
  return 0;
}

export class Sky {
  readonly root = el('div', 'eco-sky');
  private readonly orb = el('div', 'eco-orb');
  private readonly clock = el('div', 'eco-clock');

  constructor() {
    this.root.append(this.orb, this.clock);
    this.show(12, false);
  }

  /** clock — час на часах; running — идут сутки (показываем время). */
  show(clock: number, running: boolean) {
    const light = daylight(clock);
    this.root.style.setProperty('--day', light.toFixed(2));
    // Солнце идёт по дуге с 6 до 18, луна — с 18 до 6.
    const isSun = clock >= 6 && clock < 18;
    const t = ((clock - (isSun ? 6 : 18) + 24) % 24) / 12;
    this.orb.className = `eco-orb ${isSun ? 'is-sun' : 'is-moon'}`;
    this.orb.style.left = `${8 + t * 84}%`;
    this.orb.style.top = `${30 - Math.sin(t * Math.PI) * 22}%`;
    this.clock.textContent = running ? tr().hour(clock) : '';
    this.clock.hidden = !running;
  }
}

export class Meter {
  readonly root = el('div', 'eco-meter');
  private readonly bar = el('div', 'eco-meter-bar');
  private readonly fill = el('span', 'eco-meter-fill');
  private readonly nums = el('div', 'eco-meter-nums');
  private readonly cell = el('span', 'eco-gauge-fill');
  private readonly cellText = el('span', 'eco-gauge-text');

  constructor() {
    const t = tr();
    this.bar.appendChild(this.fill);
    const gauge = el('div', 'eco-gauge');
    gauge.append(this.cell, this.cellText);
    const left = el('div', 'eco-meter-side');
    left.append(el('div', 'eco-meter-label', esc(t.balance)), this.bar, this.nums);
    const right = el('div', 'eco-meter-side eco-meter-battery');
    right.append(el('div', 'eco-meter-label', esc(t.battery)), gauge);
    this.root.append(left, right);
    this.show(null, 0);
  }

  show(hour: Hour | null, capacity: number) {
    const supply = hour ? hour.solar + hour.wind : 0;
    const demand = hour?.demand ?? 0;
    const diff = supply - demand;
    const span = Math.max(4, supply, demand);
    // Полоса от центра: вправо — избыток, влево — нехватка.
    const width = Math.min(50, (Math.abs(diff) / span) * 50);
    this.fill.style.width = `${width}%`;
    this.fill.style.left = diff >= 0 ? '50%' : `${50 - width}%`;
    this.fill.className = `eco-meter-fill ${hour && hour.missing > 0 ? 'is-dark' : diff >= 0 ? 'is-plus' : 'is-minus'}`;
    this.nums.textContent = hour ? `☀️🌬️ ${fmt(supply)} ⚡ · 🏠 ${fmt(demand)} ⚡` : '—';
    const level = hour && capacity > 0 ? hour.charge / capacity : 0;
    this.cell.style.height = `${level * 100}%`;
    this.cellText.textContent = capacity > 0 ? `${fmt(hour?.charge ?? 0)} / ${capacity}` : '0';
  }
}
