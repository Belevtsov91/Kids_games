// Звуки синтезируются Web Audio: файлов нет, игра весит меньше.
// AudioContext создаётся по первому касанию (так требуют браузеры).

type Wave = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private lastSplash = 0;
  private lastRustle = 0;

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.6;
  }

  /** Вызывать из обработчика касания. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  suspend() {
    if (this.ctx?.state === 'running') void this.ctx.suspend();
  }

  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private tone(freq: number, duration: number, opts: { wave?: Wave; volume?: number; delay?: number; slideTo?: number } = {}) {
    const { ctx, master } = this;
    if (!ctx || !master || this.muted) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.wave ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.volume ?? 0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(duration: number, volume: number, filterFreq: number) {
    const { ctx, master } = this;
    if (!ctx || !master || this.muted) return;
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(master);
    src.start();
  }

  click() {
    this.tone(660, 0.08, { wave: 'triangle', volume: 0.2 });
  }

  /** Шорох лианы, пока рисуют. */
  rustle() {
    const now = performance.now();
    if (now - this.lastRustle < 70) return;
    this.lastRustle = now;
    this.noise(0.06, 0.12, 2200 + Math.random() * 1200);
  }

  vineDone() {
    this.tone(520, 0.12, { wave: 'triangle', volume: 0.18, slideTo: 780 });
  }

  empty() {
    this.tone(220, 0.18, { wave: 'square', volume: 0.08, slideTo: 160 });
  }

  pour() {
    this.noise(0.5, 0.18, 900);
    this.tone(400, 0.3, { volume: 0.12, slideTo: 900 });
  }

  /** Капля ударилась: тихий «плюх», не чаще нескольких раз в секунду. */
  splash(speed: number) {
    const now = performance.now();
    if (now - this.lastSplash < 55) return;
    this.lastSplash = now;
    const f = 900 + Math.random() * 500;
    this.tone(f, 0.07, { volume: Math.min(0.12, 0.03 + speed * 0.01), slideTo: f * 0.55 });
  }

  /** Капля в горшке: нота поднимается с каждой каплей. */
  collect(count: number) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const note = scale[count % scale.length] + 12 * Math.floor(count / scale.length / 2);
    this.tone(523.25 * 2 ** (note / 12), 0.22, { volume: 0.16 });
  }

  swallow() {
    this.tone(180, 0.35, { wave: 'sawtooth', volume: 0.06, slideTo: 50 });
  }

  grow() {
    [784, 988, 1175].forEach((f, i) => this.tone(f, 0.18, { volume: 0.12, delay: i * 0.06 }));
  }

  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, { wave: 'triangle', volume: 0.2, delay: i * 0.11 }));
    this.tone(1568, 0.6, { volume: 0.1, delay: 0.6 });
  }

  star(index: number) {
    this.tone(880 * 2 ** (index * 4 / 12), 0.25, { wave: 'triangle', volume: 0.2 });
  }

  lose() {
    [392, 330, 262].forEach((f, i) => this.tone(f, 0.3, { wave: 'triangle', volume: 0.15, delay: i * 0.15 }));
  }
}
