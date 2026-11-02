// Без DOM: этот файл импортирует и сервер игры (список допустимых зверей).

export type Instrument = 'drum' | 'tuba' | 'marimba' | 'piano' | 'violin' | 'trumpet' | 'flute';
export type Voice = 'growl' | 'moo' | 'croak' | 'woof' | 'meow' | 'trumpet' | 'tweet';

export interface Animal {
  id: string;
  name: string;
  emoji: string;
  /** Цвет прожектора и нот. */
  color: string;
  instrument: Instrument;
  instrumentEmoji: string;
  voice: Voice;
  /** Частота ноты, Гц. Пентатоника до мажор: любые сочетания звучат красиво. */
  freq: number;
  /** Клавиша на клавиатуре. */
  key: string;
}

// Слева направо — от низких звуков к высоким, как на пианино.
export const ANIMALS: readonly Animal[] = [
  { id: 'bear', name: 'Мишка', emoji: '🐻', color: '#c47a3d', instrument: 'drum', instrumentEmoji: '🥁', voice: 'growl', freq: 130.81, key: '1' },
  { id: 'cow', name: 'Коровка', emoji: '🐮', color: '#e05d8c', instrument: 'tuba', instrumentEmoji: '📯', voice: 'moo', freq: 196.0, key: '2' },
  { id: 'frog', name: 'Лягушка', emoji: '🐸', color: '#3fae4a', instrument: 'marimba', instrumentEmoji: '🪘', voice: 'croak', freq: 293.66, key: '3' },
  { id: 'dog', name: 'Пёсик', emoji: '🐶', color: '#e89b2c', instrument: 'piano', instrumentEmoji: '🎹', voice: 'woof', freq: 329.63, key: '4' },
  { id: 'cat', name: 'Котик', emoji: '🐱', color: '#8e6ad8', instrument: 'violin', instrumentEmoji: '🎻', voice: 'meow', freq: 392.0, key: '5' },
  { id: 'elephant', name: 'Слоник', emoji: '🐘', color: '#4f8fe0', instrument: 'trumpet', instrumentEmoji: '🎺', voice: 'trumpet', freq: 440.0, key: '6' },
  { id: 'bird', name: 'Птичка', emoji: '🐦', color: '#1fb5b0', instrument: 'flute', instrumentEmoji: '🪈', voice: 'tweet', freq: 523.25, key: '7' },
];

export const ANIMAL_IDS = ANIMALS.map((a) => a.id);

export const animalById = (id: string) => ANIMALS.find((a) => a.id === id);
