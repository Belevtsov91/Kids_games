// Звуки синтезируются Web Audio, без файлов. Всё молчит, когда в оболочке выключен звук.
type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

export class Sound {
  private ctx: AudioContext | null = null;
  /** Громкость эффектов из «Удобства» (0–1). */
  private volume = 1;

  constructor(private muted: boolean) {}

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume));
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

  tap() {
    this.play([{ freq: 520, slideTo: 760, at: 0, dur: 0.1, type: 'sine', gain: 0.18 }]);
  }

  /** Шар летит к стране: мягкий «вжух» вверх. */
  whoosh() {
    this.play([{ freq: 220, slideTo: 520, at: 0, dur: 0.45, type: 'triangle', gain: 0.12 }]);
  }

  correct() {
    this.play([
      { freq: 659, at: 0, dur: 0.14 },
      { freq: 784, at: 0.1, dur: 0.14 },
      { freq: 1047, at: 0.2, dur: 0.28 },
    ]);
  }

  wrong() {
    this.play([
      { freq: 330, at: 0, dur: 0.16, type: 'triangle', gain: 0.22 },
      { freq: 262, at: 0.14, dur: 0.24, type: 'triangle', gain: 0.22 },
    ]);
  }

  win() {
    const melody = [523, 659, 784, 659, 784, 1047];
    this.play(melody.map((freq, i) => ({ freq, at: i * 0.13, dur: i === melody.length - 1 ? 0.5 : 0.16, gain: 0.22 })));
  }

  private play(notes: Note[]) {
    const ctx = this.ctx;
    if (this.muted || !this.volume || !ctx || ctx.state === 'closed') return;
    const now = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + note.at;
      const end = start + note.dur;
      osc.type = note.type ?? 'sine';
      osc.frequency.setValueAtTime(note.freq, start);
      if (note.slideTo) osc.frequency.exponentialRampToValueAtTime(note.slideTo, end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime((note.gain ?? 0.2) * this.volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}
