// Игра «Тайная почта»: переключает экраны, хранит прогресс и выдаёт наклейки.
import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import type { Mode } from '../game/rounds';
import { starsFor } from '../game/rounds';
import { earnedStickers, finishBag, readSave, SAVE_KEY, type Save } from '../game/save';
import { packFor } from '../packs';
import { h } from '../ui/dom';
import { createBag } from './bag';
import { doneScreen, menuScreen } from './screens';

/** Навык, который тренирует каждый режим (для кабинета родителя). */
const SKILL = { wheel: 'logic', lighthouse: 'letters', riddle: 'reading' } as const;

export class CipherGame {
  private readonly root: HTMLElement;
  private readonly sound: Sound;
  private readonly pack;
  private save: Save;
  private bag: ReturnType<typeof createBag> | null = null;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    this.pack = packFor(sdk.locale);
    this.sound = new Sound(sdk);
    this.save = readSave(sdk.storage.load(SAVE_KEY));
    this.root = h('div', { class: 'cp-root' });
    this.root.classList.toggle('is-calm', sdk.comfort.reduceMotion);
    this.root.classList.toggle('is-big', sdk.comfort.bigButtons);
    container.appendChild(this.root);
    this.menu();
  }

  private showScreen(el: HTMLElement) {
    this.bag?.dispose();
    this.bag = null;
    this.root.replaceChildren(el);
  }

  private menu() {
    this.showScreen(menuScreen(this.save, this.sdk.profile?.name ?? null, (mode) => this.play(mode), () => this.sdk.exit()));
  }

  private play(mode: Mode) {
    const tier = this.save.bags[mode];
    const bag = createBag({
      mode,
      tier,
      pack: this.pack,
      sound: this.sound,
      rng: Math.random,
      reduceMotion: this.sdk.comfort.reduceMotion,
      onLetter: () => this.sdk.progress.sticker('first-letter'),
      onFinish: (mistakes, letters) => this.finish(mode, mistakes, letters),
      onExit: () => this.menu(),
    });
    this.showScreen(bag.el);
    this.bag = bag;
  }

  private finish(mode: Mode, mistakes: number, letters: number) {
    const stars = starsFor(mistakes);
    this.save = finishBag(this.save, mode, stars, letters);
    this.sdk.storage.save(SAVE_KEY, this.save);
    this.sdk.progress.level(`${mode}-${this.save.bags[mode]}`);
    this.sdk.progress.skill(SKILL[mode], stars >= 2);
    for (const sticker of earnedStickers(this.save)) this.sdk.progress.sticker(sticker);
    this.sound.fanfare();
    this.showScreen(doneScreen(stars, mistakes, () => this.play(mode), () => this.menu()));
  }

  pause() {
    this.root.classList.add('is-paused');
  }

  resume() {
    this.root.classList.remove('is-paused');
  }

  dispose() {
    this.bag?.dispose();
    this.sound.dispose();
    this.root.remove();
  }
}
