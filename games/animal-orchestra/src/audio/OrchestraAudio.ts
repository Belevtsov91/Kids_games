import type { Animal } from '../game/animals';
import type { SoundMode } from '../game/song';
import { BeatLoop } from './BeatLoop';
import { playInstrument } from './instruments';
import { Synth } from './Synth';
import { playVoice } from './voices';

// Все звуки синтезируются Web Audio: ни одного файла, мгновенная загрузка, работает офлайн.

const VOLUME = 0.8;

export class OrchestraAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private synth: Synth | null = null;
  private beat: BeatLoop | null = null;
  private muted = false;

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
      this.master.gain.value = this.muted ? 0 : VOLUME;
      this.master.connect(compressor).connect(this.ctx.destination);
      this.synth = new Synth(this.ctx, this.master);
      this.beat = new BeatLoop(this.synth);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : VOLUME, this.ctx.currentTime, 0.02);
  }

  play(animal: Animal, mode: SoundMode) {
    const s = this.ready();
    if (!s) return;
    const t = s.ctx.currentTime + 0.005;
    if (mode === 'voice') playVoice(s, animal.voice, t);
    else playInstrument(s, animal.instrument, animal.freq, t);
  }

  /** Весёлое «тада» за правильный ответ. */
  praise() {
    const s = this.ready();
    if (!s) return;
    const t = s.ctx.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => s.bell(f, t + i * 0.09, 0.6));
  }

  /** Мягкое «ой» без упрёка. */
  oops() {
    const s = this.ready();
    if (!s) return;
    const t = s.ctx.currentTime + 0.02;
    const osc = s.osc('triangle', 330, t);
    osc.frequency.exponentialRampToValueAtTime(196, t + 0.35);
    s.env(osc, t, 0.01, 0.4, 0.35);
  }

  /** Короткий щелчок интерфейса. */
  click() {
    const s = this.ready();
    if (!s) return;
    s.bell(880, s.ctx.currentTime + 0.005, 0.15, 0.25);
  }

  /** Фоновый ритм «бум-тсс», под который зверята покачиваются. */
  startBeat(onBeat: (step: number) => void) {
    if (this.ready()) this.beat?.start(onBeat);
  }

  stopBeat() {
    this.beat?.stop();
  }

  get beating() {
    return this.beat?.running ?? false;
  }

  pause() {
    this.stopBeat();
    void this.ctx?.suspend();
  }

  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  dispose() {
    this.beat?.dispose();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.synth = null;
    this.beat = null;
  }

  private ready() {
    if (!this.ctx || !this.synth) return null;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.synth;
  }
}
