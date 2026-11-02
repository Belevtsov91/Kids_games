import type { Synth } from './Synth';

// Фоновый ритм «бум-тсс» на восьмых. Звуки планируются чуть вперёд по часам AudioContext,
// поэтому ритм не плывёт, даже если таймеры браузера дёргаются.

const BEAT_BPM = 100;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

export class BeatLoop {
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private listener: ((beat: number) => void) | null = null;
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly synth: Synth) {}

  get running() {
    return this.timer !== null;
  }

  /** `onBeat` вызывается на каждую долю — под неё зверята покачиваются. */
  start(onBeat: (beat: number) => void) {
    if (this.timer) return;
    this.listener = onBeat;
    this.step = 0;
    this.nextTime = this.synth.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.listener = null;
  }

  dispose() {
    this.stop();
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
  }

  private schedule() {
    const { ctx } = this.synth;
    const eighth = 60 / BEAT_BPM / 2;
    while (this.nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const step = this.step % 8;
      const t = this.nextTime;
      if (step % 4 === 0) this.kick(t);
      if (step % 4 === 2) this.synth.noiseBurst(t, 0.12, 0.12, 2500, 'bandpass');
      this.synth.noiseBurst(t, 0.04, step % 2 === 0 ? 0.05 : 0.025, 8000, 'highpass');
      if (step % 2 === 0) this.notify(step / 2, t);
      this.nextTime += eighth;
      this.step++;
    }
  }

  private kick(t: number) {
    const osc = this.synth.osc('sine', 140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    this.synth.env(osc, t, 0.002, 0.35, 0.25);
  }

  /** Сообщает о доле ровно тогда, когда она прозвучит. */
  private notify(beat: number, t: number) {
    const listener = this.listener;
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      listener?.(beat);
    }, Math.max(0, (t - this.synth.ctx.currentTime) * 1000));
    this.timeouts.add(id);
  }
}
