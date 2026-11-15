import { nextStep, stepSeconds, swingOffset } from '../game/timing';

// Секвенсор с упреждением: каждые 25 мс планирует в Web Audio шаги на 0.12 с вперёд.
// Так ритм ровный, даже если вкладка на миг занята, а подсветка шага приходит отдельно.

const TICK_MS = 25;
const LOOKAHEAD = 0.12;

export interface SequencerHooks {
  /** Темп и свинг читаем на каждом шаге: их можно крутить прямо во время игры. */
  tempo(): { bpm: number; swing: number };
  /** Запланировать звуки шага на время t (секунды AudioContext). */
  schedule(step: number, t: number): void;
  /** Шаг зазвучал: подсветка, кивок Тёпы. */
  onStep(step: number): void;
}

export class Sequencer {
  private timer: ReturnType<typeof setInterval> | null = null;
  private visuals = new Set<ReturnType<typeof setTimeout>>();
  private step = 0;
  private nextTime = 0;
  private ctx: AudioContext | null = null;
  /** Шаг, который звучит сейчас, и когда он начался: для записи с пэдов. */
  current = -1;
  currentAt = 0;

  constructor(private readonly hooks: SequencerHooks) {}

  get playing() {
    return this.timer !== null;
  }

  start(ctx: AudioContext) {
    if (this.timer) return;
    this.ctx = ctx;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.visuals.forEach(clearTimeout);
    this.visuals.clear();
    this.current = -1;
  }

  /** Секунды с начала текущего шага по часам звука. */
  sinceStep() {
    return this.ctx ? Math.max(0, this.ctx.currentTime - this.currentAt) : 0;
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    // Вкладка долго спала: не догоняем пропущенное пачкой звуков, а продолжаем с «сейчас».
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.02;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      const { bpm, swing } = this.hooks.tempo();
      const step = this.step;
      const t = this.nextTime + swingOffset(step, bpm, swing);
      this.hooks.schedule(step, t);
      const id = setTimeout(() => {
        this.visuals.delete(id);
        this.current = step;
        this.currentAt = t;
        this.hooks.onStep(step);
      }, Math.max(0, (t - ctx.currentTime) * 1000));
      this.visuals.add(id);
      this.nextTime += stepSeconds(bpm);
      this.step = nextStep(step);
    }
  }
}
