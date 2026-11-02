// Кирпичики синтеза поверх Web Audio: генераторы, фильтры, огибающая, вибрато, тремоло и шум.

export class Synth {
  private readonly noise: AudioBuffer;

  constructor(
    readonly ctx: AudioContext,
    private readonly master: GainNode,
  ) {
    this.noise = makeNoise(ctx);
  }

  /** Колокольчик: основной тон и звонкий обертон. */
  bell(f: number, t: number, length: number, gain = 0.35) {
    this.env(this.osc('sine', f, t), t, 0.003, gain, length);
    this.env(this.osc('sine', f * 2.76, t), t, 0.003, gain * 0.25, length * 0.4);
  }

  osc(type: OscillatorType, freq: number, t: number) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    return osc;
  }

  filter(type: BiquadFilterType, freq: number, q: number) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /**
   * Огибающая: атака до `peak`, затухание за `length` секунд.
   * `hold` — сколько держать громкость перед затуханием (для тянущихся звуков).
   */
  env(source: OscillatorNode | AudioBufferSourceNode, t: number, attack: number, peak: number, length: number, filter?: BiquadFilterNode, hold = 0) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    if (hold > 0) g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(length, attack + hold + 0.05));
    if (filter) source.connect(filter).connect(g);
    else source.connect(g);
    g.connect(this.master);
    source.start(t);
    source.stop(t + length + 0.1);
    source.onended = () => g.disconnect();
    return g;
  }

  vibrato(osc: OscillatorNode, t: number, rate: number, depth: number, delay: number) {
    const lfo = this.osc('sine', rate, t);
    const amount = this.ctx.createGain();
    amount.gain.setValueAtTime(0, t);
    amount.gain.linearRampToValueAtTime(depth, t + delay + 0.1);
    lfo.connect(amount).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + 1.5);
  }

  tremolo(gain: GainNode, t: number, rate: number, depth: number, length: number) {
    const lfo = this.osc('sine', rate, t);
    const amount = this.ctx.createGain();
    amount.gain.value = depth * 0.5;
    const wobble = this.ctx.createGain();
    gain.disconnect();
    gain.connect(wobble).connect(this.master);
    lfo.connect(amount).connect(wobble.gain);
    lfo.start(t);
    lfo.stop(t + length + 0.1);
    lfo.onended = () => wobble.disconnect();
  }

  noiseBurst(t: number, length: number, gain: number, freq: number, type: BiquadFilterType, attack = 0.002) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    this.env(src, t, attack, gain, length, this.filter(type, freq, 1.2));
  }
}

/** Секунда белого шума — из неё делаются удары, шорохи и дыхание флейты. */
function makeNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}
