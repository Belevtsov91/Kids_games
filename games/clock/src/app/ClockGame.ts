import type { GameSdk } from '@ig/sdk';
import { Sound } from '../audio/Sound';
import type { ClockTime, Level } from '../game/clock';
import { dayPartOf, hurryPlan, nextUnlocked, planDay, stickersFor, type Task } from '../game/day';
import { loadSave, storeSave, type Save } from '../game/saveData';
import { tr } from '../i18n';
import { button, el } from '../ui/dom';
import { createScene, type Scene } from '../ui/scene';
import { finaleScreen, startScreen } from '../ui/screens';
import { runTask } from './tasks';

/** «Который час»: выбор уровня → день Тёпы из шести заданий → конец дня с наклейками. */
export class ClockGame {
  private readonly root = el('div', 'wc');
  private readonly sound: Sound;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly offs: (() => void)[] = [];
  private save: Save = { days: 0, unlocked: 0 };
  private level: Level = 0;
  private plan: Task[] = [];
  private index = 0;
  private mistakes = 0;
  private scene: Scene | null = null;
  private stopTask: () => void = () => undefined;
  private hands: ClockTime = { h: 7, m: 0 };
  private lastSaid = '';
  private hurry = false;
  private dayId = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    private readonly sdk: GameSdk,
  ) {
    const { comfort } = sdk;
    this.sound = new Sound(sdk.audio.muted, { effects: comfort.effectsVolume, music: comfort.musicVolume });
    this.root.classList.toggle('wc-calm', comfort.reduceMotion);
    this.root.classList.toggle('wc-large', comfort.bigButtons);
    container.appendChild(this.root);
    this.offs.push(sdk.audio.onMuteChange((m) => this.sound.setMuted(m)));
    this.offs.push(sdk.time.onEnding(() => this.goHurry()));
    void loadSave(sdk).then((save) => {
      if (this.disposed) return;
      this.save = save;
      this.level = save.unlocked;
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
    this.stopTask();
    this.timers.forEach(clearTimeout);
    this.offs.forEach((off) => off());
    this.sound.dispose();
    this.root.remove();
  }

  private say(text: string) {
    this.lastSaid = text;
    this.sound.say(text);
  }

  private showStart() {
    this.root.replaceChildren(
      startScreen({
        days: this.save.days,
        unlocked: this.save.unlocked,
        current: this.level,
        onPlay: (level) => this.startDay(level),
        onLocked: () => (this.sound.unlock(), this.sound.soft(), this.say(tr().locked)),
      }),
    );
  }

  private startDay(level: Level) {
    this.sound.unlock();
    this.level = level;
    this.plan = planDay(level, Math.random);
    this.index = 0;
    this.mistakes = 0;
    this.hurry = false;
    this.dayId++;
    const repeat = button('wc-repeat', '🔊', tr().repeat, () => this.sound.say(this.lastSaid));
    this.scene = createScene(level >= 2, repeat);
    this.root.replaceChildren(this.scene.node);
    this.hands = { h: 12, m: 0 };
    this.say(tr().start);
    this.later(() => this.runCurrent(), 2600);
  }

  private runCurrent() {
    const scene = this.scene;
    const task = this.plan[this.index];
    if (!scene || !task) return void this.finish();
    const day = this.dayId;
    scene.part(dayPartOf(task.hour24));
    scene.bear(task.event === 'sleep' ? 'sleepy' : 'happy');
    scene.progress(this.index, this.plan.length);
    this.stopTask = runTask(task, {
      scene,
      level: this.level,
      sound: this.sound,
      rng: Math.random,
      from: this.hands,
      say: (text) => this.say(text),
      answer: (ok) => this.sdk.progress.skill('numbers', ok),
      later: (fn, ms) => this.later(() => day === this.dayId && fn(), ms),
      done: (mistakes) => {
        if (day !== this.dayId) return;
        this.stopTask();
        this.mistakes += mistakes;
        this.hands = task.time;
        this.sdk.progress.skill('routine', true);
        this.index++;
        scene.progress(this.index, this.plan.length);
        this.runCurrent();
      },
    });
  }

  /** Время кончается: текущее задание доигрываем, потом сразу вечер — без резкого обрыва. */
  private goHurry() {
    if (this.hurry || !this.scene) return;
    this.hurry = true;
    this.plan = hurryPlan(this.plan, this.index);
    this.say(tr().hurry);
  }

  private finish() {
    const before = this.save.days;
    const stickers = stickersFor(before, this.level, this.mistakes);
    const unlocked = nextUnlocked(this.save.unlocked, this.level, this.mistakes);
    const levelUp = unlocked > this.save.unlocked;
    this.save = { days: before + 1, unlocked };
    if (levelUp) this.level = unlocked;
    this.sdk.progress.level(this.save.days);
    stickers.forEach((id) => this.sdk.progress.sticker(id));
    void storeSave(this.sdk, this.save);
    this.scene = null;
    this.dayId++;
    this.sound.lullaby();
    this.say(levelUp ? `${tr().dayDone} ${tr().levelUp}` : tr().dayDone);
    this.root.replaceChildren(
      finaleScreen({
        days: this.save.days,
        stickers,
        levelUp,
        manifest: this.sdk.manifest,
        onAgain: () => this.showStart(),
        onExit: () => this.sdk.exit(),
      }),
    );
  }

  private later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      if (!this.disposed) fn();
    }, ms);
    this.timers.add(id);
  }
}
