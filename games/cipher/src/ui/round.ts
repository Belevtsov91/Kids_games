// Общий договор между мешком писем и экраном одного письма.
import type { Sound } from '../audio/Sound';
import type { Rng } from '../game/rounds';
import type { Pack } from '../packs';

export interface RoundContext {
  pack: Pack;
  sound: Sound;
  rng: Rng;
  /** Номер мешка в этом режиме: от него зависит трудность. */
  tier: number;
  reduceMotion: boolean;
  /** Тёпа говорит реплику в облачке над письмом. */
  say(text: string, mood?: 'hint' | 'oops' | 'yay'): void;
  /** Ошибка — минус к звёздам мешка. */
  mistake(): void;
  /** Письмо прочитано. */
  solved(): void;
}

export interface RoundView {
  el: HTMLElement;
  dispose(): void;
}
