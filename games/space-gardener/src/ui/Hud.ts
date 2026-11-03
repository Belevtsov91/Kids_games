import type { Simulation } from '../game/simulation';
import type { Insets } from '../render';
import { replayClass } from './dom';
import water from '../../assets/icons/water.svg';

// Панели экрана уровня: название, запас лианы, счётчик капель, подсказка и кнопки.

const HUD_HTML = `
  <div class="sg-hud-top">
    <button class="sg-btn sg-icon" data-act="levels" aria-label="К уровням" title="К уровням">🪐</button>
    <div class="sg-title"></div>
    <div class="sg-ink" title="Запас лианы"><span aria-hidden="true">🌿</span><div class="sg-ink-bar"><i></i></div></div>
    <div class="sg-count" aria-live="polite"></div>
  </div>
  <div class="sg-tip hidden" role="status"></div>
  <div class="sg-hud-bottom">
    <button class="sg-btn sg-icon" data-act="undo" aria-label="Убрать последнюю лиану" title="Убрать лиану (Z)">↩️</button>
    <button class="sg-btn sg-icon" data-act="hint" aria-label="Подсказка" title="Подсказка">💡</button>
    <button class="sg-btn sg-primary" data-act="pour" title="Полить (пробел)"><img class="sg-resource-art" src="${water}" alt=""> <span class="sg-label">Полить</span></button>
    <button class="sg-btn sg-icon" data-act="restart" aria-label="Начать заново" title="Заново (R)">🔄</button>
  </div>`;

export class Hud {
  readonly el = document.createElement('div');
  readonly top: HTMLElement;
  readonly bottom: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly inkEl: HTMLElement;
  private readonly inkFill: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly tipEl: HTMLElement;
  private readonly pourBtn: HTMLButtonElement;
  private readonly undoBtn: HTMLButtonElement;
  private tipTimer = 0;
  // Последние показанные значения: DOM трогаем, только когда что-то изменилось.
  private lastCount = -1;
  private lastInk = -1;

  constructor() {
    this.el.innerHTML = HUD_HTML;
    const q = <T extends HTMLElement>(selector: string) => this.el.querySelector<T>(selector)!;
    this.top = q('.sg-hud-top');
    this.bottom = q('.sg-hud-bottom');
    this.titleEl = q('.sg-title');
    this.inkEl = q('.sg-ink');
    this.inkFill = q('.sg-ink-bar i');
    this.countEl = q('.sg-count');
    this.tipEl = q('.sg-tip');
    this.pourBtn = q('[data-act="pour"]');
    this.undoBtn = q('[data-act="undo"]');
  }

  /** Новый уровень: заголовок и сброс запомненных значений. */
  reset(title: string) {
    this.titleEl.textContent = title;
    this.lastCount = -1;
    this.lastInk = -1;
  }

  /** `strokeInk` — сколько лианы уходит на штрих, который рисуют прямо сейчас. */
  update(sim: Simulation, strokeInk: number) {
    const { level } = sim;
    if (sim.collected !== this.lastCount) {
      if (this.lastCount >= 0 && sim.collected > this.lastCount) replayClass(this.countEl, 'bump');
      this.lastCount = sim.collected;
      this.countEl.replaceChildren();
      const icon = document.createElement('img');
      icon.src = water;
      icon.alt = 'Капли';
      icon.className = 'sg-resource-art';
      this.countEl.append(icon, ` ${Math.min(sim.collected, level.need)}/${level.need}`);
    }
    const share = Math.max(0, (sim.inkLeft - strokeInk) / level.ink);
    if (Math.abs(share - this.lastInk) > 0.002) {
      this.lastInk = share;
      this.inkFill.style.width = `${share * 100}%`;
      this.inkEl.classList.toggle('low', share < 0.2);
    }
    this.pourBtn.disabled = sim.phase !== 'edit';
    this.pourBtn.querySelector('.sg-label')!.textContent = sim.phase === 'edit' ? 'Полить' : 'Льётся…';
    this.undoBtn.disabled = sim.lines.length === 0 || !sim.canEdit;
  }

  /** Отступы, чтобы мир не залезал под панели: сверху и снизу, или справа, если телефон боком. */
  worldInsets(root: DOMRect): Insets {
    const insets: Insets = { top: 8, right: 8, bottom: 8, left: 8 };
    const top = this.top.getBoundingClientRect();
    const bottom = this.bottom.getBoundingClientRect();
    insets.top = top.bottom - root.top + 8;
    if (bottom.height > bottom.width) insets.right = root.right - bottom.left + 8;
    else insets.bottom = root.bottom - bottom.top + 8;
    return insets;
  }

  /** Лиана кончилась: трясём шкалу запаса. */
  shakeInk() {
    replayClass(this.inkEl, 'shake');
  }

  showTip(text: string, ms: number) {
    this.tipEl.textContent = text;
    this.tipEl.classList.remove('hidden');
    clearTimeout(this.tipTimer);
    this.tipTimer = window.setTimeout(() => this.tipEl.classList.add('hidden'), ms);
  }

  hideTip() {
    clearTimeout(this.tipTimer);
    this.tipEl.classList.add('hidden');
  }

  dispose() {
    clearTimeout(this.tipTimer);
  }
}
