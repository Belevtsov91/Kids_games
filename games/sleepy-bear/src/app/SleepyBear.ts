import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import { HURRY_MINUTES, nextScene, SCENES, stickersFor, type SceneId } from '../game/logic';
import { loadSave, storeSave } from '../game/saveData';
import { tr } from '../i18n';
import { bathScene } from '../scenes/Bath';
import { dinnerScene } from '../scenes/Dinner';
import { nightScene } from '../scenes/Night';
import { pajamaScene } from '../scenes/Pajama';
import { teethScene } from '../scenes/Teeth';
import type { Scene, SceneCtx } from '../scenes/types';
import { el, showHint } from '../ui/dom';
import { finaleScreen, sceneDots, startScreen } from '../ui/screens';

const RUN: Record<SceneId, (ctx: SceneCtx) => Scene> = {
  dinner: dinnerScene,
  bath: bathScene,
  teeth: teethScene,
  pajama: pajamaScene,
  night: nightScene,
};
/** Через сколько секунд без касаний показать ручку и повторить задание. */
const HINT_AFTER_MS = 6000;

/** Вечер Тёпы: экран начала → пять сцен → «спокойной ночи» с наклейками. */
export class SleepyBear {
  private readonly root = el('div', 'sb');
  private readonly sound: Sound;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly offs: (() => void)[] = [];
  private scene: Scene | null = null;
  private current: SceneId | null = null;
  private nights = 0;
  private cleanPaws = false;
  private hurry = false;
  private lastSaid = '';
  private lastTouch = Date.now();
  private hintTarget: () => Element | null = () => null;
  private disposed = false;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    const { comfort } = sdk;
    this.sound = new Sound(sdk.audio.muted, { effects: comfort.effectsVolume, music: comfort.musicVolume });
    this.root.classList.toggle('sb-calm', comfort.reduceMotion);
    this.root.classList.toggle('sb-large', comfort.bigButtons);
    container.appendChild(this.root);
    this.offs.push(sdk.audio.onMuteChange((m) => this.sound.setMuted(m)));
    this.offs.push(sdk.time.onEnding((left) => left <= HURRY_MINUTES && this.goHurry()));
    const hintTick = setInterval(() => this.hintCheck(), 1000);
    this.offs.push(() => clearInterval(hintTick));
    void loadSave(sdk).then((save) => {
      if (this.disposed) return;
      this.nights = save.nights;
      this.showStart();
    });
  }

  pause() {
    this.sound.pause();
  }

  resume() {
    this.sound.resume();
  }

  dispose() {
    this.disposed = true;
    this.scene?.dispose();
    this.timers.forEach(clearTimeout);
    this.offs.forEach((off) => off());
    this.sound.dispose();
    this.root.remove();
  }

  private showStart() {
    this.root.replaceChildren(
      startScreen(this.nights, () => {
        this.sound.unlock();
        this.sound.say(tr().start);
        this.cleanPaws = false;
        this.current = null;
        this.later(() => this.advance(), 1800);
      }),
    );
  }

  private advance(result?: { cleanPaws?: boolean }) {
    if (result?.cleanPaws) this.cleanPaws = true;
    this.scene?.dispose();
    this.scene = null;
    const next = nextScene(this.current, this.hurry);
    if (!next) return void this.finish();
    this.current = next;
    this.hintTarget = () => null;
    this.lastTouch = Date.now();
    const stage = el('div', 'sb-stage');
    const dots = sceneDots();
    dots.set(SCENES.indexOf(next));
    const repeat = el('button', 'sb-repeat', '🔊');
    repeat.type = 'button';
    repeat.setAttribute('aria-label', '🔊');
    repeat.addEventListener('click', () => this.sound.say(this.lastSaid));
    this.root.replaceChildren(dots.node, repeat, stage);
    const ctx: SceneCtx = {
      stage,
      sound: this.sound,
      progress: this.sdk.progress,
      rng: Math.random,
      nights: this.nights,
      say: (text) => {
        this.lastSaid = text;
        this.sound.say(text);
      },
      touched: () => {
        this.lastTouch = Date.now();
        stage.querySelector('.sb-hint')?.remove();
      },
      setHintTarget: (get) => (this.hintTarget = get),
      done: (r) => (this.current === next ? this.later(() => this.advance(r), 200) : undefined),
      later: (fn, ms) => this.later(() => this.current === next && fn(), ms),
    };
    this.scene = RUN[next](ctx);
  }

  /** Время кончается: что бы ни делали, Тёпа сразу ложится спать — без резкого обрыва. */
  private goHurry() {
    if (this.hurry) return;
    this.hurry = true;
    if (!this.current || this.current === 'night') return;
    this.sound.say(tr().hurry);
    this.current = 'pajama';
    this.later(() => this.advance(), 2500);
  }

  private finish() {
    const before = this.nights;
    const stickers = stickersFor(before, this.cleanPaws);
    this.nights = before + 1;
    this.sdk.progress.level(this.nights);
    stickers.forEach((id) => this.sdk.progress.sticker(id));
    void storeSave(this.sdk, { nights: this.nights });
    this.current = null;
    this.sound.say(tr().bye);
    this.root.replaceChildren(
      finaleScreen({
        nights: this.nights,
        stickers,
        manifest: this.sdk.manifest,
        onAgain: () => this.showStart(),
        onExit: () => this.sdk.exit(),
      }),
    );
  }

  private hintCheck() {
    if (!this.current || Date.now() - this.lastTouch < HINT_AFTER_MS) return;
    this.lastTouch = Date.now();
    const stage = this.root.querySelector<HTMLElement>('.sb-stage');
    if (stage) showHint(stage, this.hintTarget());
    if (this.lastSaid) this.sound.say(this.lastSaid);
  }

  private later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      if (!this.disposed) fn();
    }, ms);
    this.timers.add(id);
  }
}
