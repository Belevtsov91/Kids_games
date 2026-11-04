import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'emotion-house',
  title: 'Домик эмоций',
  titles: { uk: 'Будиночок емоцій', ro: 'Căsuța emoțiilor', en: 'House of Feelings' },
  emoji: '🏠',
  kind: '2d',
  ages: { min: 3, max: 7 },
  stickers: [
    { id: 'first-room', emoji: '🏠', title: 'Первая комната', titles: { uk: 'Перша кімната', ro: 'Prima cameră', en: 'First room' } },
    { id: 'all-rooms', emoji: '🌈', title: 'Весь домик светится', titles: { uk: 'Увесь будиночок світиться', ro: 'Toată căsuța luminează', en: 'Whole house lit' } },
    { id: 'feelings', emoji: '💬', title: 'Рассказал о чувствах', titles: { uk: 'Розповів про почуття', ro: 'Și-a spus emoțiile', en: 'Shared my feelings' } },
  ],
  about: 'Эмоциональный интеллект: узнавать чувства по лицу и ситуации и выбирать, что поможет справиться.',
  abouts: {
    uk: 'Емоційний інтелект: розпізнавати почуття за обличчям і ситуацією та обирати, що допоможе впоратися.',
    ro: 'Inteligență emoțională: recunoașterea emoțiilor după față și situație și alegerea a ceea ce ajută.',
    en: 'Emotional literacy: recognising feelings from faces and stories and choosing what helps.',
  },
  together: 'Вспомните похожий случай из жизни: «А когда ты так себя чувствовал?» Назовите и свои чувства.',
  togethers: {
    uk: 'Пригадайте схожий випадок із життя: «А коли ти так почувався?» Назвіть і свої почуття.',
    ro: 'Amintiți-vă o situație asemănătoare: „Când te-ai simțit așa?” Numiți și propriile emoții.',
    en: 'Recall a similar moment from real life: “When did you feel like that?” Name your own feelings too.',
  },
});
