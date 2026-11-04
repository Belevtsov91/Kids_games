// Звуки синтезирует Web Audio (без файлов), фразы — голос браузера на языке игры.
// Громкость эффектов и голоса — из настроек взрослого (sdk.comfort), «выкл. звук» — из оболочки.
import { tr } from '../i18n';

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

/** Колыбельная из пяти нот: каждая звезда в окне — следующая нота. */
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

  pop(i = 0) {
    const f = 600 + (i % 5) * 120;
    this.play([{ freq: f, slideTo: f * 1.6, at: 0, dur: 0.09, gain: 0.22 }]);
  }

  munch() {
    this.play([0, 0.12, 0.24].map((at) => ({ freq: 180, slideTo: 120, at, dur: 0.08, type: 'triangle' as const, gain: 0.25 })));
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

  sparkle() {
    this.play([1318, 1568, 2093].map((freq, i) => ({ freq, at: i * 0.06, dur: 0.12, gain: 0.12 })));
  }

  click() {
    this.play([{ freq: 220, at: 0, dur: 0.05, type: 'square', gain: 0.08 }]);
  }

  /** Нота колыбельной — тише и мягче, это «музыка». */
  note(i: number) {
    const freq = LULLABY[i % LULLABY.length];
    this.play([{ freq, at: 0, dur: 0.9, type: 'sine', gain: 0.2 }], this.volume.music);
  }

  lullaby() {
    this.play(LULLABY.map((freq, i) => ({ freq, at: i * 0.55, dur: 0.8, gain: 0.16 })), this.volume.music);
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
