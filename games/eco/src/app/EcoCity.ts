// Эко-город целиком: меню районов ⇄ экран района, звёзды, наклейки и навыки для родителя.
import type { GameSdk } from '@ig/sdk';
import { Sfx } from '../audio/Sfx';
import { LEVELS, levelById } from '../game/levels';
import { allLit, cleanStars, perfectCount, record, SAVE_KEY, type Stars } from '../game/save';
import type { DayResult } from '../game/sim';
import { el } from '../ui/dom';
import { renderMenu } from '../ui/menu';
import { LevelScreen } from './LevelScreen';

export class EcoCity {
  private readonly root = el('div', 'eco');
  private readonly sfx: Sfx;
  private stars: Stars;
  private screen: LevelScreen | null = null;
  private menu: HTMLElement | null = null;
  private readonly offs: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    if (sdk.comfort.bigButtons) this.root.classList.add('eco-large');
    if (sdk.comfort.reduceMotion) this.root.classList.add('eco-still');
    this.sfx = new Sfx(sdk.audio.muted, sdk.comfort.effectsVolume);
    this.offs.push(sdk.audio.onMuteChange((m) => this.sfx.setMuted(m)));
    this.offs.push(sdk.time.onEnding(() => this.screen?.ending()));
    this.stars = cleanStars(sdk.storage.load(SAVE_KEY));
    container.appendChild(this.root);
    this.showMenu();
  }

  private clear() {
    this.screen?.dispose();
    this.screen = null;
    this.menu?.remove();
    this.menu = null;
  }

  private showMenu() {
    this.clear();
    this.menu = renderMenu(this.stars, (id) => this.play(id), () => this.sdk.exit());
    this.root.appendChild(this.menu);
  }

  private play(id: number) {
    const level = levelById(id);
    if (!level) return this.showMenu();
    this.clear();
    const index = LEVELS.indexOf(level);
    const next = LEVELS[index + 1];
    this.screen = new LevelScreen(level, this.sdk, this.sfx, {
      hasNext: !!next,
      onWin: (stars, cost, result) => this.win(id, stars, cost, result),
      onFail: () => this.sdk.progress.skill('logic', false),
      onNext: () => (next ? this.play(next.id) : this.showMenu()),
      onMenu: () => this.showMenu(),
    });
    this.root.appendChild(this.screen.root);
  }

  private win(id: number, stars: number, _cost: number, result: DayResult) {
    const { progress } = this.sdk;
    progress.level(id);
    progress.skill('logic', true);
    progress.skill('numbers', stars === 3);
    progress.skill('nature', true);
    this.stars = record(this.stars, id, stars);
    this.sdk.storage.save(SAVE_KEY, this.stars);
    progress.sticker('first-light');
    const level = levelById(id);
    if (level?.tools.includes('wind') && result.hours.some((h) => h.wind > 0)) progress.sticker('wind-power');
    if (result.capacity > 0 && result.hours.some((h) => h.clock < 6 && h.solar + h.wind === 0)) progress.sticker('night-keeper');
    if (perfectCount(this.stars) >= 3) progress.sticker('thrifty');
    if (allLit(this.stars)) progress.sticker('eco-mayor');
  }

  pause() {
    this.screen?.pause();
    this.sfx.pause();
  }

  resume() {
    this.sfx.resume();
    this.screen?.resume();
  }

  dispose() {
    this.clear();
    for (const off of this.offs) off();
    this.sfx.dispose();
    this.root.remove();
  }
}
