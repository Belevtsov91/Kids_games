// Звуки синтезируются Web Audio на лету (без файлов), слова читает голос браузера на языке игры.
import { tr } from '../i18n';

export class Sound {
  private ctx: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  muted: boolean;

  constructor(muted: boolean) {
    this.muted = muted;
    if (typeof speechSynthesis !== 'undefined') {
      const pick = () => {
        const lang = tr().speech.slice(0, 2);
        const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
        this.voice = voices.find((v) => tr().voiceHint.test(v.name)) ?? voices[0] ?? null;
      };
      pick();
      speechSynthesis.addEventListener?.('voiceschanged', pick);
    }
  }

  /** AudioContext создаётся по первому касанию: иначе браузер его не запустит. */
  private audio() {
    if (this.muted) return null;
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.2, slideTo?: number) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  pop() {
    this.tone(660, 0, 0.08, 'triangle', 0.12, 990);
  }

  /** «Ням»: два коротких укуса вниз по высоте. */
  chomp() {
    this.tone(320, 0, 0.09, 'square', 0.08, 160);
    this.tone(260, 0.11, 0.1, 'square', 0.08, 120);
  }

  wrong() {
    this.tone(220, 0, 0.18, 'sawtooth', 0.07, 150);
    this.tone(180, 0.16, 0.22, 'sawtooth', 0.07, 110);
  }

  word() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.09, 0.22, 'triangle', 0.14));
  }

  fanfare() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.13, 0.3, 'triangle', 0.15));
    this.tone(262, 0, 0.8, 'sine', 0.08);
  }

  click() {
    this.tone(880, 0, 0.05, 'sine', 0.08);
  }

  say(text: string, rate = 0.85) {
    if (this.muted || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = tr().speech;
    u.rate = rate;
    u.pitch = 1.15;
    if (this.voice) u.voice = this.voice;
    speechSynthesis.speak(u);
  }

  stopSpeech() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.stopSpeech();
  }

  dispose() {
    this.stopSpeech();
    void this.ctx?.close();
    this.ctx = null;
  }
}
