import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'studio',
  title: 'Бит-студия',
  titles: { uk: 'Біт-студія', ro: 'Studioul de ritm', en: 'Beat Studio' },
  emoji: '🎛️',
  kind: '2d',
  ages: { min: 9, max: 15 },
  skills: ['music', 'creativity', 'logic'],
  stickers: [
    { id: 'first-beat', emoji: '🥁', title: 'Первый бит', titles: { uk: 'Перший біт', ro: 'Primul ritm', en: 'First beat' } },
    { id: 'full-band', emoji: '🎹', title: 'Вся группа', titles: { uk: 'Увесь гурт', ro: 'Toată trupa', en: 'Full band' } },
    { id: 'speedy', emoji: '⚡', title: '150 BPM', titles: { uk: '150 BPM', ro: '150 BPM', en: '150 BPM' } },
    { id: 'my-beat', emoji: '💾', title: 'Мой бит', titles: { uk: 'Мій біт', ro: 'Ritmul meu', en: 'My beat' } },
    { id: 'for-parents', emoji: '👪', title: 'Для родителей', titles: { uk: 'Для батьків', ro: 'Pentru părinți', en: 'For my parents' } },
  ],
  about: 'Ритм, счёт долей и музыкальная форма: ребёнок собирает бит из барабанов, баса и аккордов на 16-шаговом секвенсоре.',
  abouts: {
    uk: 'Ритм, рахунок долей і музична форма: дитина складає біт із барабанів, басу й акордів на 16-кроковому секвенсорі.',
    ro: 'Ritm, numărarea timpilor și forma muzicală: copilul compune un ritm din tobe, bas și acorduri pe un secvențiator cu 16 pași.',
    en: 'Rhythm, counting beats and musical form: the child builds a beat from drums, bass and chords on a 16-step sequencer.',
  },
  together: 'Попросите ребёнка «показать вам» бит: он появится в вашем кабинете. Послушайте вместе и предложите добавить свинг.',
  togethers: {
    uk: 'Попросіть дитину «показати вам» біт: він з’явиться у вашому кабінеті. Послухайте разом і запропонуйте додати свінг.',
    ro: 'Rugați copilul să vă „arate” ritmul: va apărea în cabinetul dvs. Ascultați împreună și propuneți să adauge swing.',
    en: 'Ask your child to “show you” a beat: it will appear in your parent area. Listen together and suggest adding swing.',
  },
  tagline: 'Тёпа за пультом: собери свой бит из 16 пэдов.',
  taglines: { uk: 'Тьопа за пультом: збери свій біт із 16 педів.', ro: 'Tiopa la pupitru: compune-ți ritmul din 16 paduri.', en: 'Tyopa at the decks: build your beat from 16 pads.' },
  color: '#ff5c9a',
});
