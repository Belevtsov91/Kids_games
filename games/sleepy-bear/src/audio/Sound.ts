// Эффекты игры синтезирует Web Audio, фразы читает общий голос SDK (с записанными клипами,
// когда у браузера нет голоса на языке игры). Всё молчит, когда в оболочке выключен звук.
import { GameSound } from '@ig/sdk/audio';
import { tr } from '../i18n';

/** Колыбельная из пяти нот: каждая звезда в окне — следующая нота. */
export const LULLABY = [392, 440, 523, 440, 392, 330, 392];

export class Sound extends GameSound {
  constructor(muted: boolean, volume: { effects: number; music: number }) {
    super({ muted, lang: () => tr().speech, rate: 0.9, volume });
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
    this.play([{ freq, at: 0, dur: 0.9, type: 'sine', gain: 0.2 }], this.music);
  }

  lullaby() {
    this.play(LULLABY.map((freq, i) => ({ freq, at: i * 0.55, dur: 0.8, gain: 0.16 })), this.music);
  }
}
