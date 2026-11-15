// Короткие звуки Web Audio без файлов. Громкость — из настроек взрослого, «выкл. звук» — из оболочки.

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

export class Sfx {
  private ctx: AudioContext | null = null;

  constructor(
    private muted: boolean,
    private readonly volume: number,
  ) {}

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  /** Контекст создаём по первому касанию: иначе браузер его не запустит. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  pause() {
    void this.ctx?.suspend();
  }

  resume() {
    void this.ctx?.resume();
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }

  place() {
    this.play([{ freq: 520, slideTo: 780, at: 0, dur: 0.08, gain: 0.2 }]);
  }

  remove() {
    this.play([{ freq: 520, slideTo: 300, at: 0, dur: 0.08, gain: 0.18 }]);
  }

  nope() {
    this.play([{ freq: 220, at: 0, dur: 0.12, type: 'square', gain: 0.08 }]);
  }

  tick(dark: boolean) {
    this.play([{ freq: dark ? 160 : 880, at: 0, dur: 0.04, type: dark ? 'sawtooth' : 'sine', gain: dark ? 0.08 : 0.05 }]);
  }

  win() {
    this.play([523, 659, 784, 1047].map((freq, i) => ({ freq, at: i * 0.12, dur: 0.18, type: 'triangle' as const, gain: 0.2 })));
  }

  fail() {
    this.play([{ freq: 330, slideTo: 160, at: 0, dur: 0.4, type: 'triangle', gain: 0.2 }]);
  }

  private play(notes: Note[]) {
    const ctx = this.ctx;
    if (!ctx || this.muted || this.volume <= 0) return;
    const now = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.at);
      if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, now + n.at + n.dur);
      const peak = (n.gain ?? 0.2) * this.volume;
      gain.gain.setValueAtTime(0.0001, now + n.at);
      gain.gain.exponentialRampToValueAtTime(peak, now + n.at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.at);
      osc.stop(now + n.at + n.dur + 0.02);
    }
  }
}
