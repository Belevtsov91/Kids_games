// Тексты игры на четырёх языках. Язык приходит из SDK при запуске (sdk.locale).
import type { Locale } from '@ig/sdk';
import type { ToyKind } from './game/toys';

export interface Texts {
  hint: string;
  toys: string;
  clear: string;
  toy: Record<ToyKind, string>;
}

const TEXTS: Record<Locale, Texts> = {
  ru: {
    hint: 'Нажми на траву — упадёт игрушка. Нажми на игрушку — она подпрыгнет!',
    toys: 'Игрушки',
    clear: 'Убрать',
    toy: { ball: 'Мячик', cube: 'Кубик', ring: 'Бублик', cone: 'Пирамидка' },
  },
  uk: {
    hint: 'Натисни на траву — впаде іграшка. Натисни на іграшку — вона підстрибне!',
    toys: 'Іграшки',
    clear: 'Прибрати',
    toy: { ball: 'М’ячик', cube: 'Кубик', ring: 'Бублик', cone: 'Пірамідка' },
  },
  ro: {
    hint: 'Atinge iarba și cade o jucărie. Atinge jucăria și ea sare!',
    toys: 'Jucării',
    clear: 'Strânge',
    toy: { ball: 'Minge', cube: 'Cub', ring: 'Covrig', cone: 'Piramidă' },
  },
  en: {
    hint: 'Tap the grass and a toy falls. Tap a toy and it jumps!',
    toys: 'Toys',
    clear: 'Clear',
    toy: { ball: 'Ball', cube: 'Cube', ring: 'Ring', cone: 'Pyramid' },
  },
};

export const textsFor = (locale: Locale): Texts => TEXTS[locale] ?? TEXTS.ru;
