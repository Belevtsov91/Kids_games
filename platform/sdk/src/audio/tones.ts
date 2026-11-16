// Звуки эффектов, синтезированные Web Audio на лету: без файлов.

export type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

export class Tones {
  private ctx: AudioContext | null = null;

  /** Контекст создаём по первому касанию: иначе браузер его не запустит. */
  unlock() {
    if (!this.ctx && typeof window !== 'undefined') {
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

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }

  /** Сыграть ноты с громкостью 0–1. Без контекста (не было касания) молчит. */
  play(notes: Note[], volume = 1) {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'closed' || volume <= 0) return;
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
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, (note.gain ?? 0.2) * volume), start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}
