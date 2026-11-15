// Звуки синтезирует Web Audio (без файлов), фразы — голос браузера на языке игры.
// Громкость эффектов и голоса — из настроек взрослого (sdk.comfort), «выкл. звук» — из оболочки.
import { tr } from '../i18n';

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

/** Вечерняя мелодия в конце дня. */
export const LULLABY = [392, 440, 523, 440, 392, 330, 392];

export class Sound {
  private ctx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private readonly speech = typeof speechSynthesis === 'undefined' ? null : speechSynthesis;

  constructor(
    private muted: boolean,
    private readonly volume: { effects: number; music: number },
  ) {
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

  /** Тиканье, пока двигается стрелка. */
  tick(i = 0) {
    this.play([{ freq: i % 2 ? 1400 : 1100, at: 0, dur: 0.03, type: 'square', gain: 0.05 }]);
  }

  correct() {
    this.play([
      { freq: 659, at: 0, dur: 0.14 },
      { freq: 784, at: 0.1, dur: 0.14 },
      { freq: 1047, at: 0.2, dur: 0.26 },
    ]);
  }

  soft() {
    this.play([{ freq: 330, slideTo: 262, at: 0, dur: 0.22, type: 'triangle', gain: 0.18 }]);
  }

  click() {
    this.play([{ freq: 220, at: 0, dur: 0.05, type: 'square', gain: 0.08 }]);
  }

  /** Бой часов на башне: столько ударов, сколько часов (не больше четырёх — малышам долго ждать). */
  chime(times = 1) {
    const n = Math.max(1, Math.min(4, times));
    this.play(Array.from({ length: n }, (_, i) => ({ freq: 523, at: i * 0.5, dur: 0.9, type: 'sine' as const, gain: 0.2 })), this.volume.music);
  }

  /** Мелодия конца дня. */
  lullaby() {
    this.play(LULLABY.map((freq, i) => ({ freq, at: i * 0.45, dur: 0.7, gain: 0.16 })), this.volume.music);
  }

  say(text: string) {
    if (this.muted || !this.speech || !this.voice || this.volume.effects === 0) return;
    this.speech.cancel();
    const phrase = new SpeechSynthesisUtterance(text);
    phrase.voice = this.voice;
    phrase.lang = this.voice.lang;
    phrase.rate = 0.9;
    phrase.pitch = 1.15;
    phrase.volume = this.volume.effects;
    this.speech.speak(phrase);
  }

  private pickVoice = () => {
    // Без голоса на языке игры молчим: чужой голос читает текст неразборчиво.
    const lang = tr().speech;
    this.voice = this.speech?.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
  };

  private play(notes: Note[], volume = this.volume.effects) {
    const ctx = this.ctx;
    if (this.muted || !ctx || ctx.state === 'closed' || volume === 0) return;
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
