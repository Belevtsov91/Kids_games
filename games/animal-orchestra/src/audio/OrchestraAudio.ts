import type { Animal, Instrument, Voice } from '../game/animals';
import type { SoundMode } from '../game/song';

// Все звуки синтезируются Web Audio: ни одного файла, мгновенная загрузка, работает офлайн.

const BEAT_BPM = 100;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

export class OrchestraAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private beatTimer: ReturnType<typeof setInterval> | null = null;
  private beatStep = 0;
  private nextBeatTime = 0;
  private beatListener: ((step: number) => void) | null = null;
  private readonly timeouts = new Set<ReturnType<typeof setTimeout>>();

  /** Контекст создаётся по первому касанию: браузеры не дают играть звук без жеста. */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(compressor).connect(this.ctx.destination);
      this.noise = this.makeNoise();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  play(animal: Animal, mode: SoundMode) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.005;
    if (mode === 'voice') this.voice(animal.voice, t);
    else this.instrument(animal.instrument, animal.freq, t);
  }

  /** Весёлое «тада» за правильный ответ. */
  praise() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.bell(f, t + i * 0.09, 0.6));
  }

  /** Мягкое «ой» без упрёка. */
  oops() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    const osc = this.osc('triangle', 330, t);
    osc.frequency.exponentialRampToValueAtTime(196, t + 0.35);
    this.env(osc, t, 0.01, 0.4, 0.35);
  }

  /** Короткий щелчок интерфейса. */
  click() {
    const ctx = this.ready();
    if (!ctx) return;
    this.bell(880, ctx.currentTime + 0.005, 0.15, 0.25);
  }

  /** Фоновый ритм «бум-тсс», под который зверята покачиваются. */
  startBeat(onBeat: (step: number) => void) {
    const ctx = this.ready();
    if (!ctx || this.beatTimer) return;
    this.beatListener = onBeat;
    this.beatStep = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;
    this.beatTimer = setInterval(() => this.scheduleBeat(), LOOKAHEAD_MS);
  }

  stopBeat() {
    if (this.beatTimer) clearInterval(this.beatTimer);
    this.beatTimer = null;
    this.beatListener = null;
  }

  get beating() {
    return this.beatTimer !== null;
  }

  pause() {
    this.stopBeat();
    void this.ctx?.suspend();
  }

  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  dispose() {
    this.stopBeat();
    this.timeouts.forEach(clearTimeout);
    this.timeouts.clear();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private ready() {
    if (!this.ctx || !this.master) return null;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private scheduleBeat() {
    const ctx = this.ctx;
    if (!ctx) return;
    const eighth = 60 / BEAT_BPM / 2;
    while (this.nextBeatTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const step = this.beatStep % 8;
      const t = this.nextBeatTime;
      if (step % 4 === 0) this.kick(t);
      if (step % 4 === 2) this.snap(t);
      this.hat(t, step % 2 === 0 ? 0.05 : 0.025);
      if (step % 2 === 0) {
        const listener = this.beatListener;
        const id = setTimeout(() => {
          this.timeouts.delete(id);
          listener?.(step / 2);
        }, Math.max(0, (t - ctx.currentTime) * 1000));
        this.timeouts.add(id);
      }
      this.nextBeatTime += eighth;
      this.beatStep++;
    }
  }

  // ---------- инструменты ----------

  private instrument(kind: Instrument, f: number, t: number) {
    switch (kind) {
      case 'drum': {
        const osc = this.osc('sine', f * 2.2, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.25);
        this.env(osc, t, 0.003, 0.9, 0.45);
        this.noiseBurst(t, 0.06, 0.35, 1800, 'bandpass');
        break;
      }
      case 'tuba': {
        const osc = this.osc('sawtooth', f, t);
        const lp = this.filter('lowpass', 300, 2);
        lp.frequency.setValueAtTime(300, t);
        lp.frequency.linearRampToValueAtTime(900, t + 0.08);
        lp.frequency.exponentialRampToValueAtTime(350, t + 0.6);
        this.env(osc, t, 0.04, 0.55, 0.7, lp);
        break;
      }
      case 'marimba': {
        this.env(this.osc('sine', f, t), t, 0.002, 0.7, 0.6);
        this.env(this.osc('sine', f * 4, t), t, 0.002, 0.18, 0.12);
        break;
      }
      case 'piano': {
        this.env(this.osc('triangle', f, t), t, 0.004, 0.6, 1.3);
        this.env(this.osc('sine', f * 2, t), t, 0.004, 0.2, 0.6);
        this.env(this.osc('sine', f * 3, t), t, 0.004, 0.07, 0.3);
        break;
      }
      case 'violin': {
        const osc = this.osc('sawtooth', f, t);
        this.vibrato(osc, t, 5.5, f * 0.012, 0.15);
        const lp = this.filter('lowpass', 2600, 1);
        this.env(osc, t, 0.09, 0.32, 0.75, lp, 0.45);
        break;
      }
      case 'trumpet': {
        const osc = this.osc('sawtooth', f, t);
        this.vibrato(osc, t, 6, f * 0.008, 0.2);
        const lp = this.filter('lowpass', 700, 3);
        lp.frequency.setValueAtTime(700, t);
        lp.frequency.linearRampToValueAtTime(3200, t + 0.05);
        lp.frequency.exponentialRampToValueAtTime(1500, t + 0.4);
        this.env(osc, t, 0.03, 0.38, 0.6, lp, 0.35);
        break;
      }
      case 'flute': {
        const osc = this.osc('sine', f * 2, t);
        this.vibrato(osc, t, 5, f * 0.02, 0.18);
        this.env(osc, t, 0.07, 0.5, 0.7, undefined, 0.4);
        this.noiseBurst(t, 0.5, 0.06, f * 2, 'bandpass', 0.06);
        break;
      }
    }
  }

  // ---------- голоса зверей ----------

  private voice(kind: Voice, t: number) {
    switch (kind) {
      case 'growl': {
        // «Р-р-р»: низкий хрип, дрожащий по громкости.
        const osc = this.osc('sawtooth', 90, t);
        osc.frequency.linearRampToValueAtTime(75, t + 0.7);
        const lp = this.filter('lowpass', 500, 4);
        const g = this.env(osc, t, 0.05, 0.6, 0.75, lp, 0.6);
        this.tremolo(g, t, 22, 0.35, 0.8);
        this.noiseBurst(t, 0.7, 0.08, 400, 'lowpass', 0.05);
        break;
      }
      case 'moo': {
        // «Му-у»: низкая нота, фильтр открывается и закрывается.
        const osc = this.osc('sawtooth', 120, t);
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.linearRampToValueAtTime(140, t + 0.25);
        osc.frequency.linearRampToValueAtTime(105, t + 1);
        const lp = this.filter('lowpass', 250, 6);
        lp.frequency.setValueAtTime(250, t);
        lp.frequency.linearRampToValueAtTime(900, t + 0.3);
        lp.frequency.linearRampToValueAtTime(350, t + 1);
        this.env(osc, t, 0.08, 0.7, 1.05, lp, 0.85);
        break;
      }
      case 'croak': {
        // «Ква-ква»: два коротких квакающих звука.
        for (const start of [t, t + 0.28]) {
          const osc = this.osc('square', 180, start);
          osc.frequency.setValueAtTime(180, start);
          osc.frequency.linearRampToValueAtTime(240, start + 0.08);
          osc.frequency.linearRampToValueAtTime(150, start + 0.2);
          const bp = this.filter('bandpass', 900, 3);
          const g = this.env(osc, start, 0.01, 0.45, 0.22, bp, 0.12);
          this.tremolo(g, start, 35, 0.5, 0.22);
        }
        break;
      }
      case 'woof': {
        // «Гав-гав».
        for (const start of [t, t + 0.25]) {
          const osc = this.osc('sawtooth', 320, start);
          osc.frequency.exponentialRampToValueAtTime(140, start + 0.14);
          const bp = this.filter('bandpass', 700, 1.5);
          this.env(osc, start, 0.005, 0.7, 0.17, bp);
          this.noiseBurst(start, 0.08, 0.25, 1200, 'bandpass');
        }
        break;
      }
      case 'meow': {
        // «Мя-у»: голос скользит вверх и вниз.
        const osc = this.osc('sawtooth', 480, t);
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.linearRampToValueAtTime(820, t + 0.22);
        osc.frequency.linearRampToValueAtTime(420, t + 0.6);
        const bp = this.filter('bandpass', 1100, 4);
        bp.frequency.setValueAtTime(900, t);
        bp.frequency.linearRampToValueAtTime(1600, t + 0.2);
        bp.frequency.linearRampToValueAtTime(900, t + 0.6);
        this.env(osc, t, 0.06, 0.9, 0.62, bp, 0.45);
        break;
      }
      case 'trumpet': {
        // Слоновий «ту-ру-ру».
        const osc = this.osc('sawtooth', 420, t);
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.linearRampToValueAtTime(700, t + 0.15);
        osc.frequency.linearRampToValueAtTime(560, t + 0.7);
        this.vibrato(osc, t, 9, 25, 0.1);
        const bp = this.filter('bandpass', 1400, 2);
        this.env(osc, t, 0.03, 0.75, 0.8, bp, 0.6);
        break;
      }
      case 'tweet': {
        // «Чик-чирик»: три быстрые трели.
        [0, 0.12, 0.24].forEach((d, i) => {
          const start = t + d;
          const osc = this.osc('sine', 2400 + i * 300, start);
          osc.frequency.setValueAtTime(2400 + i * 300, start);
          osc.frequency.exponentialRampToValueAtTime(3600 + i * 200, start + 0.05);
          osc.frequency.exponentialRampToValueAtTime(2600, start + 0.09);
          this.env(osc, start, 0.005, 0.35, 0.1);
        });
        break;
      }
    }
  }

  // ---------- ритм ----------

  private kick(t: number) {
    const osc = this.osc('sine', 140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    this.env(osc, t, 0.002, 0.35, 0.25);
  }

  private snap(t: number) {
    this.noiseBurst(t, 0.12, 0.12, 2500, 'bandpass');
  }

  private hat(t: number, gain: number) {
    this.noiseBurst(t, 0.04, gain, 8000, 'highpass');
  }

  // ---------- кирпичики ----------

  private bell(f: number, t: number, length: number, gain = 0.35) {
    this.env(this.osc('sine', f, t), t, 0.003, gain, length);
    this.env(this.osc('sine', f * 2.76, t), t, 0.003, gain * 0.25, length * 0.4);
  }

  private osc(type: OscillatorType, freq: number, t: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    return osc;
  }

  private filter(type: BiquadFilterType, freq: number, q: number) {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /**
   * Огибающая: атака до `peak`, затухание за `length` секунд.
   * `hold` — сколько держать громкость перед затуханием (для тянущихся звуков).
   */
  private env(source: OscillatorNode | AudioBufferSourceNode, t: number, attack: number, peak: number, length: number, filter?: BiquadFilterNode, hold = 0) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    if (hold > 0) g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(length, attack + hold + 0.05));
    if (filter) source.connect(filter).connect(g);
    else source.connect(g);
    g.connect(this.master!);
    source.start(t);
    source.stop(t + length + 0.1);
    source.onended = () => g.disconnect();
    return g;
  }

  private vibrato(osc: OscillatorNode, t: number, rate: number, depth: number, delay: number) {
    const lfo = this.osc('sine', rate, t);
    const amount = this.ctx!.createGain();
    amount.gain.setValueAtTime(0, t);
    amount.gain.linearRampToValueAtTime(depth, t + delay + 0.1);
    lfo.connect(amount).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + 1.5);
  }

  private tremolo(gain: GainNode, t: number, rate: number, depth: number, length: number) {
    const lfo = this.osc('sine', rate, t);
    const amount = this.ctx!.createGain();
    amount.gain.value = depth * 0.5;
    const wobble = this.ctx!.createGain();
    gain.disconnect();
    gain.connect(wobble).connect(this.master!);
    lfo.connect(amount).connect(wobble.gain);
    lfo.start(t);
    lfo.stop(t + length + 0.1);
    lfo.onended = () => wobble.disconnect();
  }

  private noiseBurst(t: number, length: number, gain: number, freq: number, type: BiquadFilterType, attack = 0.002) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    this.env(src, t, attack, gain, length, this.filter(type, freq, 1.2));
  }

  private makeNoise() {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
