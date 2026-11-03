import type { GameSdk } from '@ig/sdk';
import { createProgress, type ProgressStore } from '../api/progress';
import { Sfx } from '../audio/Sfx';
import { strokeLength } from '../game/ink';
import { levels } from '../game/levels';
import { starsFor } from '../game/scoring';
import { Simulation } from '../game/simulation';
import { bindControls, type GameActions } from '../input/controls';
import { PointerInput } from '../input/PointerInput';
import { Renderer } from '../render';
import { Listeners } from '../ui/dom';
import { Hud } from '../ui/Hud';
import { levelMapHtml } from '../ui/levelMap';
import { ResultOverlay } from '../ui/ResultOverlay';
import { lightUpStars, loseCardHtml, winCardHtml } from '../ui/resultCards';
import { GameLoop } from './GameLoop';
import { simFeedback } from './simFeedback';
import '../styles/index.css';
import { levelText, tr } from '../i18n';

// Контроллер игры: экраны (карта уровней и уровень), кнопки и клавиши.
// Весь интерфейс — обычный DOM поверх одного холста.

const BLOOM_MS = 1500;
const LOSE_CARD_DELAY_MS = 700;

export class SpaceGardener implements GameActions {
  private readonly root = document.createElement('div');
  private readonly canvas = document.createElement('canvas');
  private readonly mapEl = document.createElement('div');
  private readonly overlay = new ResultOverlay();
  private readonly hud = new Hud();
  private readonly renderer: Renderer;
  private readonly sfx = new Sfx();
  private readonly progress: ProgressStore;
  private readonly listeners = new Listeners();
  private readonly input: PointerInput;
  private readonly loop: GameLoop;

  private screen: 'map' | 'play' = 'map';
  private levelIndex = 0;
  private sim: Simulation | null = null;
  private ghostUntil = 0;
  private bloomStart = 0;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    this.progress = createProgress(sdk);
    this.root.className = 'sg-root';
    this.canvas.className = 'sg-canvas';
    this.canvas.setAttribute('aria-label', tr().field);
    this.mapEl.className = 'sg-map';
    this.root.append(this.canvas, this.mapEl, this.hud.el, this.overlay.el);
    this.renderer = new Renderer(this.canvas);
    container.appendChild(this.root);

    this.sfx.setMuted(sdk.audio.muted);
    this.listeners.add(sdk.audio.onMuteChange((muted) => this.sfx.setMuted(muted)));
    const observer = new ResizeObserver(() => this.layout());
    observer.observe(this.root);
    this.listeners.add(() => observer.disconnect());
    bindControls(this.root, this.listeners, this.sfx, this);
    this.input = new PointerInput(this.canvas, this.renderer, this.sfx, {
      currentSim: () => this.sim,
      canStartEditing: () => this.isPlaying() && !!this.sim?.canEdit && !this.isCardOpen(),
      onTouch: () => this.hud.hideTip(),
      onInkEmpty: () => this.hud.shakeInk(),
      onChange: () => this.updateHud(),
    }, this.listeners);
    this.loop = new GameLoop(() => this.sim?.step(), this.frame);

    this.showLevels();
    this.loop.start();
    void this.progress.load().then(() => this.screen === 'map' && this.renderMap());
  }

  pause() {
    this.loop.stop();
    this.sfx.suspend();
  }

  resume() {
    this.sfx.resume();
    this.loop.start();
  }

  destroy() {
    this.pause();
    this.overlay.hide();
    this.hud.dispose();
    this.listeners.dispose();
    this.sfx.close();
    this.root.remove();
  }

  // Короткие действия для кнопок и клавиш (GameActions).
  isPlaying = () => this.screen === 'play';
  isCardOpen = () => this.overlay.isOpen;
  exit = () => this.sdk.exit();
  showHint = () => (this.ghostUntil = performance.now() + 4000);
  nextLevel = () => this.openLevel(this.levelIndex + 1);

  showLevels() {
    this.screen = 'map';
    this.sim = null;
    this.input.cancel();
    this.overlay.hide();
    this.hud.el.hidden = true;
    this.mapEl.hidden = false;
    this.renderMap();
  }

  private renderMap() {
    this.mapEl.innerHTML = levelMapHtml(levels.map((l) => this.progress.stars(l.id)), this.sdk.profile?.name);
  }

  openLevel(index: number) {
    if (index >= levels.length) return this.showLevels();
    const level = levels[index];
    this.levelIndex = index;
    const sim = new Simulation(level, (Math.random() * 1e9) | 0);
    sim.onEvent(simFeedback(sim, { sfx: this.sfx, renderer: this.renderer, onWin: this.onWin, onLose: this.onLose }));
    this.sim = sim;
    this.input.cancel();
    this.bloomStart = 0;
    this.overlay.hide();
    this.screen = 'play';
    this.mapEl.hidden = true;
    this.hud.el.hidden = false;
    const text = levelText(level);
    this.hud.reset(`${index + 1}. ${text.name}`);
    this.hud.showTip(text.tip, 6000);
    // На первом уровне сразу показываем, где рисовать.
    this.ghostUntil = index === 0 ? performance.now() + 4500 : 0;
    this.layout();
    this.updateHud();
  }

  private layout() {
    const rect = this.root.getBoundingClientRect();
    const insets = this.screen === 'play' ? this.hud.worldInsets(rect) : { top: 8, right: 8, bottom: 8, left: 8 };
    this.renderer.resize(rect.width, rect.height, insets);
  }

  private updateHud() {
    if (this.sim) this.hud.update(this.sim, this.input.stroke ? strokeLength(this.input.stroke) : 0);
  }

  pour() {
    if (!this.sim || this.sim.phase !== 'edit') return;
    this.hud.hideTip();
    this.ghostUntil = 0;
    this.sim.startPour();
    this.sfx.pour();
    this.updateHud();
  }

  undo() {
    if (this.sim?.canEdit && this.sim.undo()) this.updateHud();
  }

  restart() {
    if (!this.sim) return;
    this.overlay.hide();
    this.bloomStart = 0;
    this.sim.reset();
    this.updateHud();
  }

  private onWin = () => {
    const { level, inkUsed } = this.sim!;
    const stars = starsFor(inkUsed, level.ink);
    this.bloomStart = performance.now();
    this.overlay.showLater(BLOOM_MS, winCardHtml(stars, this.levelIndex === levels.length - 1), (card) => {
      void this.progress.record(level.id, stars);
      lightUpStars(card, stars, (i) => this.sfx.star(i));
    });
  };

  private onLose = () => {
    // Капли ещё докатываются: счёт берём в момент показа карточки.
    const sim = this.sim!;
    this.overlay.showLater(LOSE_CARD_DELAY_MS, () => loseCardHtml(sim.collected, sim.level.need), () => this.sfx.lose());
  };

  private frame = (now: number) => {
    if (this.sim) this.updateHud();
    const ghostLeft = this.ghostUntil - now;
    this.renderer.draw(
      {
        sim: this.screen === 'play' ? this.sim : null,
        stroke: this.input.stroke,
        ghost: ghostLeft > 0 ? Math.min(1, ghostLeft / 600) : 0,
        dragged: this.input.draggedPlank,
        bloom: this.bloomStart ? Math.min(1, (now - this.bloomStart) / 900) : 0,
      },
      now,
    );
  };
}
