// Эффекты игры синтезирует Web Audio, фразы читает общий голос SDK (с записанными клипами,
// когда у браузера нет голоса на языке игры). Всё молчит, когда в оболочке выключен звук.
import { GameSound } from '@ig/sdk/audio';
import { tr } from '../i18n';

export class Sound extends GameSound {
  constructor(muted: boolean) {
    super({ muted, lang: () => tr().speech, rate: 0.95 });
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
}
