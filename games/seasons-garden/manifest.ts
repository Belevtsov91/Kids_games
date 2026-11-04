import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'seasons-garden',
  title: 'Сад сезонов',
  titles: { uk: 'Сад сезонів', ro: 'Grădina anotimpurilor', en: 'Seasons Garden' },
  emoji: '🌳',
  kind: '2d',
  ages: { min: 4, max: 7 },
  skills: ['nature', 'logic'],
  stickers: [
    { id: 'four-seasons', emoji: '🍁', title: 'Четыре сезона', titles: { uk: 'Чотири сезони', ro: 'Patru anotimpuri', en: 'Four seasons' } },
    { id: 'gardener', emoji: '🌷', title: 'Юный садовник', titles: { uk: 'Юний садівник', ro: 'Micul grădinar', en: 'Young gardener' } },
    { id: 'nature-expert', emoji: '🦉', title: 'Знаток природы', titles: { uk: 'Знавець природи', ro: 'Expert în natură', en: 'Nature expert' } },
  ],
  about: 'Окружающий мир: как меняются деревья, погода и жизнь зверей по сезонам, плюс загадки «что бывает зимой» и «что наступит потом».',
  abouts: {
    uk: 'Довкілля: як змінюються дерева, погода й життя звірів за сезонами, плюс загадки «що буває взимку» і «що настане потім».',
    ro: 'Lumea din jur: cum se schimbă copacii, vremea și viața animalelor pe anotimpuri, plus ghicitori „ce e iarna” și „ce urmează”.',
    en: 'The world around us: how trees, weather and animal life change with the seasons, plus riddles like “what belongs to winter” and “what comes next”.',
  },
  together: 'Посмотрите в окно и сравните с садом в игре: какое сейчас время года, где сейчас медведь и птицы?',
  togethers: {
    uk: 'Подивіться у вікно й порівняйте із садом у грі: яка зараз пора року, де зараз ведмідь і птахи?',
    ro: 'Uitați-vă pe geam și comparați cu grădina din joc: ce anotimp e acum, unde sunt ursul și păsările?',
    en: 'Look out of the window and compare it with the garden in the game: what season is it, where are the bear and the birds now?',
  },
  tagline: 'Сажай, поливай и смотри, как сад меняется по сезонам.',
  taglines: { uk: 'Сади, поливай і дивись, як сад змінюється за сезонами.', ro: 'Plantează, udă și privește grădina schimbându-se cu anotimpurile.', en: 'Plant, water and watch the garden change with the seasons.' },
  color: '#a6e07a',
});
