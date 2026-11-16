// Эффекты игры синтезирует Web Audio, фразы читает общий голос SDK (с записанными клипами,
// когда у браузера нет голоса на языке игры). Всё молчит, когда в оболочке выключен звук.
import { GameSound } from '@ig/sdk/audio';
import { tr } from '../i18n';

export class Sound extends GameSound {
  constructor(muted: boolean) {
    super({ muted, lang: () => tr().speech, rate: 0.95 });
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
}
