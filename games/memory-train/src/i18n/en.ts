import type { Texts } from './ru';

export const en: Texts = {
  speech: 'en',
  title: 'Memory Train',
  lead: (name?: string) => (name ? `${name}, remember who rides the train!` : 'Remember who rides the train!'),
  play: '▶ All aboard',
  level: (n: number) => `Carriages: ${n}`,
  best: (n: number) => `Best: ${n} carriages`,
  watch: 'Watch carefully!',
  tunnel: 'The train is in the tunnel…',
  askWhich: (n: number) => `Who rode in carriage number ${n}?`,
  askMissing: 'Who got off the train?',
  askOrder: 'Tap the animals in order: who rode first, who rode second…',
  next: 'Next ▶',
  home: '🏠 Station',
  sayRight: 'Correct! Well done!',
  sayWrong: 'Not quite. Look who was there!',
  sayOrderWrong: "No, that one wasn't here. Think again.",
  sayLevelUp: "Great! Let's add another carriage!",
  sayEnding: "It's almost rest time. Let's finish calmly.",
};
