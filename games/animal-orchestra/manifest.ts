import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'animal-orchestra',
  title: 'Звериный оркестр',
  titles: { uk: 'Звірячий оркестр', ro: 'Orchestra animalelor', en: 'Animal Orchestra' },
  emoji: '🎵',
  kind: '2d',
  ages: { min: 3, max: 6 },
  skills: ['music', 'memory', 'creativity'],
  stickers: [
    { id: 'first-concert', emoji: '🎺', title: 'Первый концерт', titles: { uk: 'Перший концерт', ro: 'Primul concert', en: 'First concert' } },
    { id: 'first-phrase', emoji: '👂', title: 'Повторил мелодию', titles: { uk: 'Повторив мелодію', ro: 'Melodie repetată', en: 'Tune repeated' } },
    { id: 'five-stars', emoji: '⭐', title: 'Пять звёзд', titles: { uk: 'П’ять зірок', ro: 'Cinci stele', en: 'Five stars' } },
    { id: 'long-phrase', emoji: '🎼', title: 'Длинная мелодия', titles: { uk: 'Довга мелодія', ro: 'Melodie lungă', en: 'Long tune' } },
    { id: 'my-melody', emoji: '💾', title: 'Моя мелодия', titles: { uk: 'Моя мелодія', ro: 'Melodia mea', en: 'My tune' } },
  ],
});
