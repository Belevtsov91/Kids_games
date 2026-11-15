import type { Voice } from '../game/kit';
import { Voices } from './voices';

// Звук студии: один AudioContext, общая громкость, компрессор, чтобы громкий бит не хрипел.

export class StudioAudio {
  private ctxRef: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voices | null = null;
  private muted = false;

  constructor(private readonly volume: number) {}

  get ctx() {
    return this.ctxRef;
  }

  /** Контекст создаётся по первому касанию: браузеры не дают играть звук без жеста. */
  unlock(): AudioContext | null {
    if (!this.ctxRef) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.ratio.value = 4;
      this.master = ctx.createGain();
      this.master.gain.value = this.level();
      this.master.connect(compressor).connect(ctx.destination);
      this.voices = new Voices(ctx, this.master);
      this.ctxRef = ctx;
    }
    if (this.ctxRef.state === 'suspended') void this.ctxRef.resume();
    return this.ctxRef;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctxRef) this.master.gain.setTargetAtTime(this.level(), this.ctxRef.currentTime, 0.02);
  }

  /** Сыграть звук пэда: сейчас или в точное время t (для секвенсора). */
  play(voice: Voice, t?: number) {
    const ctx = this.unlock();
    if (!ctx || !this.voices) return;
    this.voices.play(voice, Math.max(t ?? 0, ctx.currentTime + 0.003));
  }

  suspend() {
    void this.ctxRef?.suspend();
  }

  resume() {
    if (this.ctxRef?.state === 'suspended') void this.ctxRef.resume();
  }

  dispose() {
    void this.ctxRef?.close();
    this.ctxRef = null;
  }

  private level() {
    return this.muted ? 0 : 0.85 * this.volume;
  }
}
