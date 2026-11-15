// Сцена над вопросом: дорога с зеброй и светофором (или парк с мамой), по которой шаг за шагом идёт Тёпа.
import type { Chapter, Light } from '../game/rounds';
import { bearSvg, MAMA, TYOPA } from './bear';
import { el } from './dom';

const ROAD = `<svg class="sr-bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
  <rect width="400" height="200" fill="#9ad66f"/>
  <rect y="44" width="400" height="20" fill="#e9e2d6"/><rect y="64" width="400" height="80" fill="#5a5f73"/>
  <rect y="144" width="400" height="20" fill="#e9e2d6"/>
  <g fill="#ffd447">${[10, 70, 270, 330].map((x) => `<rect x="${x}" y="102" width="34" height="4" rx="2"/>`).join('')}</g>
  <g fill="#fff">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="166" y="${69 + i * 12.6}" width="68" height="7" rx="2"/>`).join('')}</g>
  <circle cx="30" cy="20" r="16" fill="#6cc04a"/><circle cx="370" cy="186" r="14" fill="#6cc04a"/><circle cx="350" cy="22" r="12" fill="#7fd05a"/>
</svg>`;

const PARK = `<svg class="sr-bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
  <rect width="400" height="200" fill="#a6dd7c"/>
  <path d="M200 200C150 160 260 130 200 100S170 40 200 0" stroke="#efdcb8" stroke-width="44" fill="none"/>
  <g fill="#6cc04a"><circle cx="60" cy="50" r="26"/><circle cx="340" cy="60" r="30"/><circle cx="80" cy="160" r="22"/><circle cx="330" cy="160" r="24"/></g>
  <g fill="#ff9ec4"><circle cx="120" cy="120" r="5"/><circle cx="290" cy="110" r="5"/><circle cx="140" cy="40" r="4"/></g>
</svg>`;

export class Scene {
  readonly node: HTMLElement;
  private readonly bear = el('div', 'sr-bear');
  private readonly car = el('div', 'sr-car', '🚗');
  private readonly light = el('div', 'sr-light');

  constructor(chapter: Chapter) {
    this.node = el('div', `sr-scene sr-scene-${chapter.scene}`);
    this.node.innerHTML = chapter.scene === 'road' ? ROAD : PARK;
    this.bear.innerHTML = bearSvg(TYOPA);
    const lamps = el('div', 'sr-tl');
    lamps.append(el('i', 'sr-lamp sr-lamp-red'), el('i', 'sr-lamp sr-lamp-yellow'), el('i', 'sr-lamp sr-lamp-green'));
    const ped = el('div', 'sr-ped');
    ped.append(el('i', 'sr-lamp sr-lamp-stop', '🧍'), el('i', 'sr-lamp sr-lamp-walk', '🚶'));
    this.light.append(lamps, ped);
    if (chapter.scene === 'park') {
      const mama = el('div', 'sr-mama');
      mama.innerHTML = bearSvg(MAMA, true);
      this.node.append(mama);
    } else this.node.append(this.light, this.car);
    this.node.append(this.bear);
    this.setLight(null);
    this.setPos(0);
  }

  /** Какой сигнал горит; null — светофор выключен (вопросы без светофора). */
  setLight(light: Light | null) {
    this.light.dataset.light = light ?? '';
    this.light.hidden = light === null;
  }

  /** Сколько пути прошёл Тёпа: 0 — у края дороги, 1 — на той стороне. */
  setPos(part: number) {
    this.node.style.setProperty('--sr-pos', String(Math.min(1, Math.max(0, part))));
  }

  /** По дороге проезжает машина: поэтому мы и ждём. */
  carPass() {
    this.replay(this.car, 'is-driving');
  }

  /** Тёпа вздрагивает и отступает назад — так было бы опасно. */
  startle() {
    this.replay(this.bear, 'is-startled');
  }

  /** Тёпа переходит всю дорогу по зебре и возвращается к началу для следующего сигнала. */
  cross() {
    this.replay(this.bear, 'is-crossing');
  }

  hop() {
    this.replay(this.bear, 'is-hop');
  }

  private replay(node: HTMLElement, cls: string) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }
}
