// Эффекты синтезирует Web Audio на лету (без файлов), слова читает общий голос SDK на языке игры
// (с записанными клипами, когда у браузера нет такого голоса).
import { GameSound } from '@ig/sdk/audio';
import { tr } from '../i18n';

export class Sound extends GameSound {
  constructor(muted: boolean) {
    super({ muted, lang: () => tr().speech, rate: 0.85, prefer: tr().voiceHint });
  }

  /** AudioContext создаётся по первому касанию: иначе браузер его не запустит. */
  private tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', gain = 0.2, slideTo?: number) {
    if (this.isMuted) return;
    this.unlock();
    this.play([{ freq, at, dur, type, gain, slideTo }]);
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

  /** Буквы и слоги читаем строчными: так голос не произносит их как аббревиатуру. */
  override say(text: string, rate?: number) {
    return super.say(text.toLowerCase(), rate === undefined ? undefined : { rate });
  }
}
