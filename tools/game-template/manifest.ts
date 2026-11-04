import { defineManifest } from '@ig/sdk';

// Всё, кроме id, title, emoji, kind и ages, необязательно, но заполненный манифест
// даёт игре портал на дашборде, карточку для родителя и альбом наклеек.
export default defineManifest({
  id: '__GAME_ID__',
  title: '__GAME_TITLE__',
  titles: { uk: '__GAME_TITLE__', ro: '__GAME_TITLE__', en: '__GAME_TITLE__' },
  emoji: '🎈',
  kind: '2d',
  ages: { min: 3, max: 15 },
  /** Навыки из SKILLS (@ig/sdk): по ним родитель видит «Чему научился». */
  skills: ['motor'],
  /** Наклейки выдаёт игра: sdk.progress.sticker('first-tap'). */
  stickers: [{ id: 'first-tap', emoji: '🎈', title: 'Первый шарик', titles: { uk: 'Перша кулька', ro: 'Primul balon', en: 'First balloon' } }],
  about: 'Что развивает игра — одна-две фразы для родителя.',
  together: 'Как поиграть вместе с ребёнком — совет для родителя.',
  tagline: 'Одна короткая фраза для ребёнка под названием.',
  color: '#7cc4ff',
});
