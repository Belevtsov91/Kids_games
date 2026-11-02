import { STEP_MS } from '../game/simulation';

// Игровой цикл: физика шагает ровно по 1/60 с, отрисовка — с частотой экрана.

/** Если вкладка подвисла, догоняем не больше стольких шагов за кадр. */
const MAX_STEPS_PER_FRAME = 5;

export class GameLoop {
  private running = false;
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;

  /** `step` — один шаг физики, `render` — кадр (вызывается после шагов). */
  constructor(
    private readonly step: () => void,
    private readonly render: (now: number) => void,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.tick);
    this.accumulator = Math.min(this.accumulator + (now - this.lastTime), STEP_MS * MAX_STEPS_PER_FRAME);
    while (this.accumulator >= STEP_MS) {
      this.step();
      this.accumulator -= STEP_MS;
    }
    this.lastTime = now;
    this.render(now);
  };
}
