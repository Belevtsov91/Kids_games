import type { Voice } from '../game/kit';

// Синтез звуков пэдов на Web Audio: без файлов, всё собирается из генераторов и шума.

type Src = OscillatorNode | AudioBufferSourceNode;

export class Voices {
  private readonly noise: AudioBuffer;

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {
    const length = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  play(voice: Voice, t: number) {
    switch (voice.kind) {
      case 'kick': return this.kick(t);
      case 'snare': return this.snare(t);
      case 'hat': return this.noiseHit(t, 0.06, 0.25, 'highpass', 7000);
      case 'clap': return this.clap(t);
      case 'bass': return this.bass(voice.freq, t);
      case 'chord': return voice.freqs.forEach((f) => this.pluck(f, t));
      case 'vox': return this.vox(t);
      case 'zap': return this.zap(t);
      case 'bell': return this.bell(t);
      case 'scratch': return this.scratch(t);
    }
  }

  private osc(type: OscillatorType, freq: number, t: number) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    return osc;
  }

  private filter(type: BiquadFilterType, freq: number, q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /** Громкость: быстрая атака и затухание за length секунд. */
  private env(src: Src, t: number, peak: number, length: number, via?: AudioNode) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    if (via) src.connect(via).connect(g);
    else src.connect(g);
    g.connect(this.out);
    src.start(t);
    src.stop(t + length + 0.05);
    src.onended = () => g.disconnect();
  }

  private noiseSrc() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    return src;
  }

  private noiseHit(t: number, length: number, peak: number, type: BiquadFilterType, freq: number) {
    this.env(this.noiseSrc(), t, peak, length, this.filter(type, freq, 1.2));
  }

  private kick(t: number) {
    const osc = this.osc('sine', 150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.15);
    this.env(osc, t, 0.9, 0.4);
  }

  private snare(t: number) {
    this.noiseHit(t, 0.18, 0.4, 'bandpass', 1800);
    const body = this.osc('triangle', 190, t);
    body.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    this.env(body, t, 0.3, 0.12);
  }

  private clap(t: number) {
    for (const d of [0, 0.012, 0.024]) this.noiseHit(t + d, 0.05, 0.3, 'bandpass', 1300);
    this.noiseHit(t + 0.03, 0.18, 0.22, 'bandpass', 1100);
  }

  private bass(freq: number, t: number) {
    const lp = this.filter('lowpass', 900, 6);
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.3);
    this.env(this.osc('sawtooth', freq, t), t, 0.45, 0.42, lp);
    this.env(this.osc('sine', freq, t), t, 0.4, 0.42);
  }

  private pluck(freq: number, t: number) {
    const lp = this.filter('lowpass', 3200, 1);
    lp.frequency.setValueAtTime(3200, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + 0.35);
    this.env(this.osc('square', freq, t), t, 0.08, 0.45, lp);
    this.env(this.osc('triangle', freq * 2, t), t, 0.06, 0.3);
  }

  private vox(t: number) {
    // «Эй!»: пила через два форманта гласной «э» с лёгким скольжением вверх.
    for (const [f, q, peak] of [[530, 8, 0.5], [1840, 10, 0.3]] as const) {
      const osc = this.osc('sawtooth', 210, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.18);
      this.env(osc, t, peak, 0.26, this.filter('bandpass', f, q));
    }
  }

  private zap(t: number) {
    const osc = this.osc('square', 1800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
    this.env(osc, t, 0.12, 0.28);
  }

  private bell(t: number) {
    this.env(this.osc('sine', 1046.5, t), t, 0.3, 1.1);
    this.env(this.osc('sine', 1046.5 * 2.76, t), t, 0.08, 0.5);
  }

  private scratch(t: number) {
    const bp = this.filter('bandpass', 600, 4);
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.linearRampToValueAtTime(2400, t + 0.07);
    bp.frequency.linearRampToValueAtTime(400, t + 0.16);
    this.env(this.noiseSrc(), t, 0.5, 0.18, bp);
  }
}
