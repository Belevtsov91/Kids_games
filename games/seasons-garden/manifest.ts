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
});
