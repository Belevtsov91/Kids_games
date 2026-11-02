// Все звуки синтезируются Web Audio на лету: никаких файлов, ничего не грузится.

type Wave = OscillatorType;

class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private muted = false;
  private paused = false;

  /** AudioContext можно создать только после жеста пользователя. */
  private audio() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended' && !this.paused) void this.ctx.resume();
    return { ctx: this.ctx, out: this.master! };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  pause() {
    this.paused = true;
    void this.ctx?.suspend();
  }

  resume() {
    this.paused = false;
    void this.ctx?.resume();
  }

  dispose() {
    this.ambience?.source.stop();
    this.ambience = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private tone(freq: number, duration: number, { wave = 'sine' as Wave, volume = 0.3, delay = 0, slide = 1 } = {}) {
    if (this.muted) return;
    const { ctx, out } = this.audio();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  private noiseBuffer(ctx: AudioContext, seconds: number, brown = false) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = brown ? (last + 0.02 * white) / 1.02 : white;
      data[i] = brown ? last * 3.5 : white;
    }
    return buffer;
  }

  private noise(duration: number, { freq = 1200, q = 1, volume = 0.3, type = 'bandpass' as BiquadFilterType, sweep = 1 } = {}) {
    if (this.muted) return;
    const { ctx, out } = this.audio();
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, duration);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freq, t);
    if (sweep !== 1) filter.frequency.exponentialRampToValueAtTime(freq * sweep, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(out);
    src.start(t);
  }

  /** Тихий шум прибоя на фоне. */
  startAmbience() {
    if (this.ambience || this.muted) return;
    const { ctx, out } = this.audio();
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx, 4, true);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    // Волны накатывают: громкость медленно качается.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(gain.gain);
    source.connect(filter).connect(gain).connect(out);
    source.start();
    lfo.start();
    this.ambience = { source, gain };
  }

  place(pitch: number) {
    this.tone(pitch, 0.12, { wave: 'triangle', volume: 0.35 });
    this.tone(pitch * 2, 0.08, { wave: 'sine', volume: 0.12, delay: 0.02 });
    this.noise(0.06, { freq: 2500, volume: 0.08 });
  }

  dig() {
    this.noise(0.18, { freq: 700, q: 0.8, volume: 0.35, sweep: 0.4 });
    this.tone(140, 0.14, { wave: 'square', volume: 0.08, slide: 0.6 });
  }

  paint() {
    this.noise(0.22, { freq: 3000, q: 2, volume: 0.15, sweep: 1.8 });
    this.tone(660, 0.1, { volume: 0.12, delay: 0.05, slide: 1.3 });
  }

  plant() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, { wave: 'sine', volume: 0.2, delay: i * 0.06 }));
    this.noise(0.25, { freq: 4000, q: 0.7, volume: 0.06 });
  }

  boat() {
    this.noise(0.5, { freq: 900, q: 0.6, volume: 0.3, type: 'lowpass', sweep: 0.3 });
    this.tone(110, 0.5, { wave: 'sawtooth', volume: 0.12, delay: 0.15 });
    this.tone(165, 0.5, { wave: 'sawtooth', volume: 0.08, delay: 0.15 });
  }

  push() {
    this.noise(0.3, { freq: 1200, q: 0.6, volume: 0.2, type: 'lowpass', sweep: 0.5 });
  }

  crate() {
    this.noise(0.15, { freq: 2000, q: 1, volume: 0.1, sweep: 0.4 });
    this.tone(880, 0.25, { wave: 'sine', volume: 0.08, slide: 0.5 });
  }

  thud() {
    this.tone(90, 0.18, { wave: 'sine', volume: 0.35, slide: 0.5 });
    this.noise(0.1, { freq: 400, volume: 0.15 });
  }

  splash() {
    this.noise(0.4, { freq: 1500, q: 0.5, volume: 0.22, sweep: 0.3 });
  }

  click() {
    this.tone(880, 0.05, { wave: 'triangle', volume: 0.12 });
  }

  denied() {
    this.tone(220, 0.12, { wave: 'square', volume: 0.07, slide: 0.8 });
  }

  undo() {
    this.tone(600, 0.12, { wave: 'triangle', volume: 0.15, slide: 0.6 });
  }

  quest() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, { wave: 'triangle', volume: 0.22, delay: i * 0.1 }));
    this.tone(1568, 0.5, { wave: 'sine', volume: 0.1, delay: 0.4 });
  }

  dayNight(night: boolean) {
    const notes = night ? [784, 659, 523] : [523, 659, 784];
    notes.forEach((f, i) => this.tone(f, 0.35, { wave: 'sine', volume: 0.15, delay: i * 0.09 }));
  }
}

export const sound = new Sound();
