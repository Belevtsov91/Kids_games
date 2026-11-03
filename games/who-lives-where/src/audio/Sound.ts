// Звуки синтезируются Web Audio (без файлов), фразы — голосом браузера, если есть русский голос.
// Всё молчит, когда в оболочке выключен звук.
import { tr } from '../i18n';

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

export class Sound {
  private ctx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private readonly speech = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;

  constructor(private muted: boolean) {
    this.pickVoice();
    this.speech?.addEventListener('voiceschanged', this.pickVoice);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.speech?.cancel();
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

  pick() {
    this.play([{ freq: 520, slideTo: 880, at: 0, dur: 0.12, type: 'sine', gain: 0.25 }]);
  }

  drop() {
    this.play([{ freq: 300, slideTo: 180, at: 0, dur: 0.12, type: 'triangle', gain: 0.2 }]);
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
    if (this.muted || !ctx || ctx.state === 'closed') return;
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
      gain.gain.exponentialRampToValueAtTime(note.gain ?? 0.2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}
