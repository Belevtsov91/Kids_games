// Эффекты игры синтезирует Web Audio, фразы читает общий голос SDK (с записанными клипами,
// когда у браузера нет голоса на языке игры). Всё молчит, когда в оболочке выключен звук.
import { GameSound } from '@ig/sdk/audio';
import { tr } from '../i18n';

/** Вечерняя мелодия в конце дня. */
export const LULLABY = [392, 440, 523, 440, 392, 330, 392];

export class Sound extends GameSound {
  constructor(muted: boolean, volume: { effects: number; music: number }) {
    super({ muted, lang: () => tr().speech, rate: 0.9, volume });
  }

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
    this.play(Array.from({ length: n }, (_, i) => ({ freq: 523, at: i * 0.5, dur: 0.9, type: 'sine' as const, gain: 0.2 })), this.music);
  }

  /** Мелодия конца дня. */
  lullaby() {
    this.play(LULLABY.map((freq, i) => ({ freq, at: i * 0.45, dur: 0.7, gain: 0.16 })), this.music);
  }
}
