// Ситуации: кто из зверят и что с ним случилось. Тексты ситуаций — в i18n по id.
import type { Emotion } from './emotions';

export interface Scenario {
  id: string;
  emotion: Emotion;
  hero: string;
}

export const SCENARIOS: readonly Scenario[] = [
  { id: 'gift', emotion: 'joy', hero: '🐻' },
  { id: 'park', emotion: 'joy', hero: '🐰' },
  { id: 'guest', emotion: 'joy', hero: '🐶' },
  { id: 'icecream', emotion: 'sad', hero: '🐱' },
  { id: 'brokenToy', emotion: 'sad', hero: '🐻' },
  { id: 'friendLeft', emotion: 'sad', hero: '🐼' },
  { id: 'tower', emotion: 'anger', hero: '🦊' },
  { id: 'grabbed', emotion: 'anger', hero: '🐰' },
  { id: 'noMore', emotion: 'anger', hero: '🐶' },
  { id: 'thunder', emotion: 'fear', hero: '🐱' },
  { id: 'dark', emotion: 'fear', hero: '🐼' },
  { id: 'bigDog', emotion: 'fear', hero: '🐰' },
  { id: 'kitten', emotion: 'surprise', hero: '🐻' },
  { id: 'snow', emotion: 'surprise', hero: '🦊' },
  { id: 'magic', emotion: 'surprise', hero: '🐶' },
  { id: 'rain', emotion: 'calm', hero: '🐼' },
  { id: 'clouds', emotion: 'calm', hero: '🐱' },
  { id: 'book', emotion: 'calm', hero: '🦊' },
];
