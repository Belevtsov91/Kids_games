import type { GameSdk } from '@ig/sdk';
import { Sfx } from './audio';
import { extendStroke, strokeLength, type Vec } from './game/ink';
import { levels, PLANK_TURN } from './game/levels';
import { isUnlocked, starsFor } from './game/scoring';
import { Simulation, STEP_MS, WORLD_SIZE, type Plank, type SimEvent } from './game/simulation';
import { createProgress, type ProgressStore } from './progress';
import { Renderer, type Insets } from './render';
import './styles.css';

// Контроллер игры: экраны (карта уровней и уровень), ввод, игровой цикл.
// Весь интерфейс — обычный DOM поверх одного холста.

const PLANET_COLORS = [
  ['#7ee7ff', '#2f8ef0'],
  ['#c7a6ff', '#7a4ee8'],
  ['#ffb3d1', '#e8578f'],
  ['#ffd27e', '#e8902f'],
  ['#9ff2b4', '#2fb85b'],
  ['#ffa98a', '#e2553a'],
  ['#e6e6ff', '#8c8cc8'],
  ['#b0f0ff', '#3fa6c4'],
  ['#ffe48a', '#c9a12f'],
  ['#ff9be0', '#a03fe0'],
];

const BLOOM_MS = 1500;
const MAX_STEPS_PER_FRAME = 5;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

interface Drag {
  pointerId: number;
  plank: Plank | null;
  start: Vec;
  offset: Vec;
  moved: boolean;
}

export class SpaceGardener {
  private readonly root = document.createElement('div');
  private readonly canvas = document.createElement('canvas');
  private readonly renderer: Renderer;
  private readonly sfx = new Sfx();
  private readonly progress: ProgressStore;
  private readonly cleanups: (() => void)[] = [];

  private screen: 'map' | 'play' = 'map';
  private mapEl!: HTMLElement;
  private playEl!: HTMLElement;
  private overlayEl!: HTMLElement;
  private tipEl!: HTMLElement;
  private inkEl!: HTMLElement;
  private inkFill!: HTMLElement;
  private countEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private pourBtn!: HTMLButtonElement;
  private undoBtn!: HTMLButtonElement;

  private levelIndex = 0;
  private sim: Simulation | null = null;
  private stroke: Vec[] | null = null;
  private drag: Drag | null = null;
  private ghostUntil = 0;
  private bloomStart = 0;
  private tipTimer = 0;
  private resultTimer = 0;
  private running = false;
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;
  private lastCount = -1;
  private lastInk = -1;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    this.progress = createProgress(sdk);
    this.root.className = 'sg-root';
    this.canvas.className = 'sg-canvas';
    this.canvas.setAttribute('aria-label', 'Игровое поле: рисуй лианы пальцем');
    this.root.appendChild(this.canvas);
    this.renderer = new Renderer(this.canvas);
    this.buildDom();
    container.appendChild(this.root);

    this.sfx.setMuted(sdk.audio.muted);
    this.cleanups.push(sdk.audio.onMuteChange((muted) => this.sfx.setMuted(muted)));

    const observer = new ResizeObserver(() => this.layout());
    observer.observe(this.root);
    this.cleanups.push(() => observer.disconnect());

    this.listen(this.canvas, 'pointerdown', this.onPointerDown);
    this.listen(this.canvas, 'pointermove', this.onPointerMove);
    this.listen(this.canvas, 'pointerup', this.onPointerUp);
    this.listen(this.canvas, 'pointercancel', this.onPointerUp);
    this.listen(this.root, 'pointerdown', () => this.sfx.unlock(), true);
    this.listen(window, 'keydown', this.onKey);

    this.showMap();
    this.start();
    void this.progress.load().then(() => this.screen === 'map' && this.renderMap());
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.sfx.suspend();
  }

  resume() {
    this.sfx.resume();
    this.start();
  }

  destroy() {
    this.pause();
    clearTimeout(this.tipTimer);
    clearTimeout(this.resultTimer);
    this.cleanups.forEach((fn) => fn());
    this.sfx.close();
    this.root.remove();
  }

  // ---------- DOM ----------

  private listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    capture = false,
  ) {
    const fn = handler as EventListener;
    target.addEventListener(type, fn, capture);
    this.cleanups.push(() => target.removeEventListener(type, fn, capture));
  }

  private buildDom() {
    this.mapEl = document.createElement('div');
    this.mapEl.className = 'sg-map';

    this.playEl = document.createElement('div');
    this.playEl.innerHTML = `
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
        <button class="sg-btn sg-primary" data-act="pour" title="Полить (пробел)">💧 <span class="sg-label">Полить</span></button>
        <button class="sg-btn sg-icon" data-act="restart" aria-label="Начать заново" title="Заново (R)">🔄</button>
      </div>`;
    this.titleEl = this.playEl.querySelector('.sg-title')!;
    this.inkEl = this.playEl.querySelector('.sg-ink')!;
    this.inkFill = this.playEl.querySelector('.sg-ink-bar i')!;
    this.countEl = this.playEl.querySelector('.sg-count')!;
    this.tipEl = this.playEl.querySelector('.sg-tip')!;
    this.pourBtn = this.playEl.querySelector('[data-act="pour"]')!;
    this.undoBtn = this.playEl.querySelector('[data-act="undo"]')!;

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'sg-overlay';
    this.overlayEl.hidden = true;

    this.root.append(this.mapEl, this.playEl, this.overlayEl);
    this.listen(this.root, 'click', this.onClick);
  }

  private onClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target || (target as HTMLButtonElement).disabled) return;
    const act = target.dataset.act;
    this.sfx.unlock();
    this.sfx.click();
    switch (act) {
      case 'level':
        return this.startLevel(Number(target.dataset.index));
      case 'levels':
        return this.showMap();
      case 'undo':
        return this.undo();
      case 'hint':
        this.ghostUntil = performance.now() + 4000;
        return;
      case 'pour':
        return this.pour();
      case 'restart':
        return this.restart();
      case 'next':
        return this.startLevel(this.levelIndex + 1);
      case 'retry':
        return this.restart();
      case 'exit':
        return this.sdk.exit();
    }
  };

  private showMap() {
    this.screen = 'map';
    this.sim = null;
    this.stroke = null;
    this.drag = null;
    clearTimeout(this.resultTimer);
    this.overlayEl.hidden = true;
    this.playEl.hidden = true;
    this.mapEl.hidden = false;
    this.renderMap();
  }

  private renderMap() {
    const stars = levels.map((l) => this.progress.stars(l.id));
    const total = stars.reduce((a, b) => a + b, 0);
    const current = stars.findIndex((s) => s === 0);
    const name = this.sdk.profile?.name;
    this.mapEl.innerHTML = `
      <div class="sg-map-inner">
        <h1>🌱 Космический садовник</h1>
        <p class="sg-sub">${name ? `${escapeHtml(name)}, помоги` : 'Помоги'} кометке полить космические цветы! Рисуй пальцем лианы, чтобы капли докатились до горшка.</p>
        <div class="sg-total"><span>⭐ ${total} / ${levels.length * 3}</span></div>
        <div class="sg-levels">
          ${levels
            .map((level, i) => {
              const open = isUnlocked(i, stars);
              const [light, dark] = PLANET_COLORS[i % PLANET_COLORS.length];
              const starRow = [1, 2, 3].map((n) => `<span class="${stars[i] >= n ? '' : 'off'}">⭐</span>`).join('');
              return `
                <button class="sg-level${i === current ? ' sg-level-current' : ''}" data-act="level" data-index="${i}" ${open ? '' : 'disabled'}
                  aria-label="Уровень ${i + 1}: ${escapeHtml(level.name)}${open ? `, звёзд: ${stars[i]}` : ', закрыт'}">
                  <span class="sg-planet" style="background: radial-gradient(circle at 30% 30%, ${light}, ${dark})">${open ? i + 1 : '🔒'}</span>
                  <span class="sg-level-name">${escapeHtml(level.name)}</span>
                  <span class="sg-level-stars" aria-hidden="true">${starRow}</span>
                </button>`;
            })
            .join('')}
        </div>
      </div>`;
  }

  private startLevel(index: number) {
    if (index >= levels.length) return this.showMap();
    const level = levels[index];
    this.levelIndex = index;
    this.sim = new Simulation(level, (Math.random() * 1e9) | 0);
    this.sim.onEvent(this.onSimEvent);
    this.stroke = null;
    this.drag = null;
    this.bloomStart = 0;
    this.lastCount = -1;
    this.lastInk = -1;
    clearTimeout(this.resultTimer);
    this.screen = 'play';
    this.mapEl.hidden = true;
    this.playEl.hidden = false;
    this.overlayEl.hidden = true;
    this.titleEl.textContent = `${index + 1}. ${level.name}`;
    this.showTip(level.tip, 6000);
    // На первом уровне сразу показываем, где рисовать.
    this.ghostUntil = index === 0 ? performance.now() + 4500 : 0;
    this.layout();
    this.updateHud();
  }

  private showTip(text: string, ms: number) {
    this.tipEl.textContent = text;
    this.tipEl.classList.remove('hidden');
    clearTimeout(this.tipTimer);
    this.tipTimer = window.setTimeout(() => this.tipEl.classList.add('hidden'), ms);
  }

  private hideTip() {
    clearTimeout(this.tipTimer);
    this.tipEl.classList.add('hidden');
  }

  private layout() {
    const rect = this.root.getBoundingClientRect();
    const insets: Insets = { top: 8, right: 8, bottom: 8, left: 8 };
    if (this.screen === 'play') {
      const top = this.playEl.querySelector('.sg-hud-top')!.getBoundingClientRect();
      const bottom = this.playEl.querySelector('.sg-hud-bottom')!.getBoundingClientRect();
      insets.top = top.bottom - rect.top + 8;
      // Кнопки справа колонкой (телефон боком) или снизу рядом.
      if (bottom.height > bottom.width) insets.right = rect.right - bottom.left + 8;
      else insets.bottom = rect.bottom - bottom.top + 8;
    }
    this.renderer.resize(rect.width, rect.height, insets);
  }

  private updateHud() {
    const sim = this.sim;
    if (!sim) return;
    const { level } = sim;
    if (sim.collected !== this.lastCount) {
      if (this.lastCount >= 0 && sim.collected > this.lastCount) {
        this.countEl.classList.remove('bump');
        void this.countEl.offsetWidth;
        this.countEl.classList.add('bump');
      }
      this.lastCount = sim.collected;
      this.countEl.textContent = `💧 ${Math.min(sim.collected, level.need)}/${level.need}`;
    }
    const inkLeft = sim.inkLeft - (this.stroke ? strokeLength(this.stroke) : 0);
    const share = Math.max(0, inkLeft / level.ink);
    if (Math.abs(share - this.lastInk) > 0.002) {
      this.lastInk = share;
      this.inkFill.style.width = `${share * 100}%`;
      this.inkEl.classList.toggle('low', share < 0.2);
    }
    this.pourBtn.disabled = sim.phase !== 'edit';
    this.pourBtn.querySelector('.sg-label')!.textContent = sim.phase === 'edit' ? 'Полить' : 'Льётся…';
    this.undoBtn.disabled = sim.lines.length === 0 || !sim.canEdit;
  }

  // ---------- Действия ----------

  private pour() {
    if (!this.sim || this.sim.phase !== 'edit') return;
    this.hideTip();
    this.ghostUntil = 0;
    this.sim.startPour();
    this.sfx.pour();
    this.updateHud();
  }

  private undo() {
    if (this.sim?.canEdit && this.sim.undo()) this.updateHud();
  }

  private restart() {
    if (!this.sim) return;
    clearTimeout(this.resultTimer);
    this.overlayEl.hidden = true;
    this.bloomStart = 0;
    this.sim.reset();
    this.updateHud();
  }

  private onSimEvent = (e: SimEvent) => {
    const flower = this.sim ? { x: this.sim.level.pot.x, y: this.sim.level.pot.y - 120 } : { x: 0, y: 0 };
    switch (e.type) {
      case 'splash':
        this.sfx.splash(e.speed);
        if (e.speed > 4) this.renderer.burst(e.x, e.y, 'splash');
        break;
      case 'collect':
        this.sfx.collect(e.count);
        this.renderer.burst(e.x, e.y, 'collect');
        break;
      case 'swallow':
        this.sfx.swallow();
        this.renderer.burst(e.x, e.y, 'swallow');
        break;
      case 'stage':
        if (e.stage < 4) {
          this.sfx.grow();
          this.renderer.burst(flower.x, flower.y + 40, 'grow');
        }
        break;
      case 'win':
        this.sfx.win();
        this.bloomStart = performance.now();
        this.renderer.burst(flower.x, flower.y - 20, 'win');
        this.resultTimer = window.setTimeout(() => this.showWin(), BLOOM_MS);
        break;
      case 'lose':
        this.resultTimer = window.setTimeout(() => this.showLose(), 700);
        break;
    }
  };

  private showWin() {
    const sim = this.sim;
    if (!sim) return;
    const stars = starsFor(sim.inkUsed, sim.level.ink);
    void this.progress.record(sim.level.id, stars);
    const last = this.levelIndex === levels.length - 1;
    const praise = ['Цветок расцвёл!', 'Отлично!', 'Супер-садовник!'][stars - 1];
    this.overlayEl.innerHTML = `
      <div class="sg-card" role="dialog" aria-label="${praise}">
        <div class="sg-card-emoji">🌸</div>
        <h2>${praise}</h2>
        <div class="sg-stars" aria-label="Звёзд: ${stars} из 3"><span>⭐</span><span>⭐</span><span>⭐</span></div>
        <p>${stars < 3 ? 'Потрать меньше лианы, чтобы получить больше звёзд.' : 'Лианы ушло совсем чуть-чуть, супер!'}</p>
        <div class="sg-actions">
          <button class="sg-btn" data-act="retry">🔄 Ещё раз</button>
          <button class="sg-btn" data-act="levels">🪐 Уровни</button>
          ${last ? '<button class="sg-btn sg-green" data-act="levels">🏆 Готово</button>' : '<button class="sg-btn sg-green" data-act="next">Дальше ➜</button>'}
        </div>
      </div>`;
    this.overlayEl.hidden = false;
    const spans = this.overlayEl.querySelectorAll('.sg-stars span');
    for (let i = 0; i < stars; i++) {
      window.setTimeout(() => {
        spans[i]?.classList.add('on');
        this.sfx.star(i);
      }, 250 + i * 300);
    }
    this.overlayEl.querySelector<HTMLButtonElement>('.sg-green')?.focus({ preventScroll: true });
  }

  private showLose() {
    const sim = this.sim;
    if (!sim) return;
    this.sfx.lose();
    this.overlayEl.innerHTML = `
      <div class="sg-card" role="dialog" aria-label="Попробуй ещё">
        <div class="sg-card-emoji">🥀</div>
        <h2>Цветку не хватило воды</h2>
        <p>Собрано ${sim.collected} из ${sim.level.need} капель. Поправь лианы и попробуй ещё раз! Если трудно, нажми 💡.</p>
        <div class="sg-actions">
          <button class="sg-btn" data-act="levels">🪐 Уровни</button>
          <button class="sg-btn sg-green" data-act="retry">🔄 Ещё раз</button>
        </div>
      </div>`;
    this.overlayEl.hidden = false;
    this.overlayEl.querySelector<HTMLButtonElement>('.sg-green')?.focus({ preventScroll: true });
  }

  // ---------- Ввод ----------

  private onPointerDown = (e: PointerEvent) => {
    const sim = this.sim;
    if (this.screen !== 'play' || !sim || !sim.canEdit || this.drag || !this.overlayEl.hidden) return;
    if (!e.isPrimary) return;
    const p = this.renderer.toWorld(e.clientX, e.clientY);
    if (p.x < -20 || p.y < -20 || p.x > WORLD_SIZE + 20 || p.y > WORLD_SIZE + 20) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.hideTip();
    const plank = sim.plankAt(p, 26 / Math.min(1, this.renderer.view.scale * 1.4));
    if (plank) {
      const { position } = plank.body;
      this.drag = { pointerId: e.pointerId, plank, start: p, offset: { x: position.x - p.x, y: position.y - p.y }, moved: false };
      return;
    }
    if (sim.inkLeft < 1) {
      this.sfx.empty();
      this.inkEl.classList.remove('shake');
      void this.inkEl.offsetWidth;
      this.inkEl.classList.add('shake');
      return;
    }
    this.drag = { pointerId: e.pointerId, plank: null, start: p, offset: { x: 0, y: 0 }, moved: false };
    this.stroke = [clampToWorld(p)];
  };

  private onPointerMove = (e: PointerEvent) => {
    const drag = this.drag;
    const sim = this.sim;
    if (!drag || !sim || e.pointerId !== drag.pointerId) return;
    // Касание сыплет события чаще кадра: берём все промежуточные точки, линия выходит ровнее.
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const points = (events.length ? events : [e]).map((ev) => this.renderer.toWorld(ev.clientX, ev.clientY));
    const last = points[points.length - 1];
    if (Math.hypot(last.x - drag.start.x, last.y - drag.start.y) > 6) drag.moved = true;

    if (drag.plank) {
      sim.movePlank(drag.plank, last.x + drag.offset.x, last.y + drag.offset.y);
      return;
    }
    if (!this.stroke) return;
    for (const point of points) {
      const before = this.stroke.length;
      const ok = extendStroke(this.stroke, clampToWorld(point), sim.inkLeft);
      if (this.stroke.length > before) this.sfx.rustle();
      if (!ok) break;
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const drag = this.drag;
    const sim = this.sim;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.drag = null;
    if (!sim) return;
    if (drag.plank) {
      if (!drag.moved) {
        sim.turnPlank(drag.plank, PLANK_TURN);
        this.sfx.click();
      }
      return;
    }
    const stroke = this.stroke;
    this.stroke = null;
    if (stroke && sim.addLine(stroke)) this.sfx.vineDone();
    this.updateHud();
  };

  private onKey = (e: KeyboardEvent) => {
    if (this.screen !== 'play' || e.repeat) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'KeyZ' && !e.altKey) {
      this.undo();
    } else if (e.code === 'Space' && this.overlayEl.hidden) {
      e.preventDefault();
      this.sfx.unlock();
      this.pour();
    } else if (e.code === 'KeyR') {
      this.restart();
    }
  };

  // ---------- Цикл ----------

  private start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.tick);
    const sim = this.sim;
    if (sim) {
      this.accumulator = Math.min(this.accumulator + (now - this.lastTime), STEP_MS * MAX_STEPS_PER_FRAME);
      while (this.accumulator >= STEP_MS) {
        sim.step();
        this.accumulator -= STEP_MS;
      }
      this.updateHud();
    }
    this.lastTime = now;
    const ghostLeft = this.ghostUntil - now;
    this.renderer.draw(
      {
        sim: this.screen === 'play' ? sim : null,
        stroke: this.stroke,
        ghost: ghostLeft > 0 ? Math.min(1, ghostLeft / 600) : 0,
        dragged: this.drag?.plank ?? null,
        bloom: this.bloomStart ? Math.min(1, (now - this.bloomStart) / 900) : 0,
      },
      now,
    );
  };
}

function clampToWorld(p: Vec): Vec {
  return { x: Math.max(0, Math.min(WORLD_SIZE, p.x)), y: Math.max(0, Math.min(WORLD_SIZE, p.y)) };
}
