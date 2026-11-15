// Проигрывание суток по часам: таймер, ускорение, пауза. Сам ничего не рисует — зовёт onHour.

export class Playback {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private index = 0;
  private fast = false;
  private paused = false;
  private running = false;

  constructor(
    private readonly total: number,
    private readonly stepMs: number,
    private readonly onHour: (index: number) => void,
    private readonly onDone: () => void,
  ) {}

  get isRunning() {
    return this.running;
  }

  start() {
    this.stop();
    this.index = 0;
    this.fast = false;
    this.running = true;
    this.onHour(0);
    this.schedule();
  }

  /** Досмотреть быстрее. */
  hurry() {
    this.fast = true;
  }

  pause() {
    this.paused = true;
    this.clear();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.running) this.schedule();
  }

  stop() {
    this.running = false;
    this.clear();
  }

  private clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule() {
    this.clear();
    this.timer = setTimeout(() => this.tick(), this.fast ? this.stepMs / 5 : this.stepMs);
  }

  private tick() {
    if (!this.running || this.paused) return;
    this.index++;
    if (this.index >= this.total) {
      this.running = false;
      this.onDone();
      return;
    }
    this.onHour(this.index);
    this.schedule();
  }
}
