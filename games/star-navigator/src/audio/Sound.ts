// Звуки синтезируются Web Audio (без файлов), фразы — голосом браузера на языке игры, если он есть.
// Всё молчит, когда в оболочке выключен звук.
import { tr } from '../i18n';

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

export class Sound {
  private ctx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private readonly speech = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
  /** Громкость эффектов из «Удобства» (0–1). */
  private volume = 1;

  constructor(private muted: boolean) {
    this.pickVoice();
    this.speech?.addEventListener('voiceschanged', this.pickVoice);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.speech?.cancel();
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
    this.speech?.cancel();
  }

  resume() {
    void this.ctx?.resume();
  }

  dispose() {
    this.speech?.removeEventListener('voiceschanged', this.pickVoice);
    this.speech?.cancel();
    void this.ctx?.close();
    this.ctx = null;
  }

  launch() {
    this.play([{ freq: 140, slideTo: 620, at: 0, dur: 0.5, type: 'sawtooth', gain: 0.12 }]);
  }

  brake() {
    this.play([{ freq: 500, slideTo: 160, at: 0, dur: 0.3, type: 'triangle', gain: 0.18 }]);
  }

  crystal() {
    this.play([
      { freq: 1047, at: 0, dur: 0.1, gain: 0.18 },
      { freq: 1568, at: 0.07, dur: 0.18, gain: 0.18 },
    ]);
  }

  fail() {
    this.play([
      { freq: 330, at: 0, dur: 0.16, type: 'triangle', gain: 0.22 },
      { freq: 220, at: 0.14, dur: 0.3, type: 'triangle', gain: 0.22 },
    ]);
  }

  win() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    this.play(melody.map((freq, i) => ({ freq, at: i * 0.12, dur: i === melody.length - 1 ? 0.5 : 0.15, gain: 0.2 })));
  }

  say(text: string) {
    if (this.muted || !this.speech || !this.voice) return;
    this.speech.cancel();
    const phrase = new SpeechSynthesisUtterance(text);
    phrase.voice = this.voice;
    phrase.lang = this.voice.lang;
    phrase.rate = 0.95;
    phrase.pitch = 1.15;
    this.speech.speak(phrase);
  }

  private pickVoice = () => {
    // Без голоса на языке игры молчим: чужой голос читает текст неразборчиво.
    const lang = tr().speech;
    this.voice = this.speech?.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
  };

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
