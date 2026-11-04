import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'who-lives-where',
  title: 'Кто где живёт',
  titles: { uk: 'Хто де живе', ro: 'Cine unde locuiește', en: 'Who Lives Where' },
  emoji: '🏡',
  kind: '2d',
  ages: { min: 3, max: 6 },
  skills: ['animals', 'nature'],
  stickers: [
    { id: 'first-home', emoji: '🏡', title: 'Первый зверёк дома', titles: { uk: 'Перше звірятко вдома', ro: 'Primul animal acasă', en: 'First animal home' } },
    { id: 'no-mistakes', emoji: '🎯', title: 'Без ошибок', titles: { uk: 'Без помилок', ro: 'Fără greșeli', en: 'No mistakes' } },
    { id: 'half-album', emoji: '📗', title: 'Полальбома', titles: { uk: 'Пів альбому', ro: 'Jumătate de album', en: 'Half the album' } },
    { id: 'full-album', emoji: '🦁', title: 'Все зверята', titles: { uk: 'Усі звірята', ro: 'Toate animalele', en: 'Every animal' } },
  ],
  tagline: 'Помоги лисёнку, черепахе и птичке найти свои домики.',
  taglines: { uk: 'Допоможи лисеняті, черепасі й пташці знайти свої хатки.', ro: 'Ajută vulpița, broasca țestoasă și păsărica să-și găsească casa.', en: 'Help the fox, the tortoise and the bird find their homes.' },
  color: '#ffc86b',
});
