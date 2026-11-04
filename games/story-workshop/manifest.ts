import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'story-workshop',
  title: 'Мастерская сказок',
  titles: { uk: 'Майстерня казок', ro: 'Atelierul de povești', en: 'Story Workshop' },
  emoji: '📖',
  kind: '2d',
  ages: { min: 4, max: 8 },
  skills: ['creativity', 'reading'],
  stickers: [
    { id: 'first-tale', emoji: '📖', title: 'Первая сказка', titles: { uk: 'Перша казка', ro: 'Prima poveste', en: 'First story' } },
    { id: 'storyteller', emoji: '🪶', title: 'Сказочник', titles: { uk: 'Казкар', ro: 'Povestitor', en: 'Storyteller' } },
    { id: 'all-heroes', emoji: '🎭', title: 'Все герои', titles: { uk: 'Усі герої', ro: 'Toți eroii', en: 'All heroes' } },
  ],
  about: 'Связная речь и воображение: ребёнок выбирает героя, место и поворот сюжета и рассказывает сказку вслух по трём картинкам.',
  abouts: {
    uk: 'Зв’язне мовлення й уява: дитина обирає героя, місце й поворот сюжету та розповідає казку вголос за трьома картинками.',
    ro: 'Vorbire coerentă și imaginație: copilul alege eroul, locul și întâmplarea și spune povestea cu voce tare după trei imagini.',
    en: 'Storytelling and imagination: the child picks a hero, a place and a twist, then tells the story aloud from three pictures.',
  },
});
