import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'island-builder',
  title: 'Остров-конструктор',
  titles: { uk: 'Острів-конструктор', ro: 'Insula-constructor', en: 'Island Builder' },
  emoji: '🏝️',
  kind: '3d',
  ages: { min: 10, max: 15 },
  skills: ['creativity', 'space'],
  stickers: [
    { id: 'first-quest', emoji: '🧱', title: 'Первое задание', titles: { uk: 'Перше завдання', ro: 'Prima misiune', en: 'First quest' } },
    { id: 'lantern-keeper', emoji: '🏮', title: 'Хранитель фонарей', titles: { uk: 'Охоронець ліхтарів', ro: 'Paznicul felinarelor', en: 'Lantern keeper' } },
    { id: 'island-master', emoji: '🏝️', title: 'Мастер острова', titles: { uk: 'Майстер острова', ro: 'Maestrul insulei', en: 'Island master' } },
  ],
  about: 'Творчество и пространственное мышление: ребёнок строит в 3D, планирует постройку и выполняет задания.',
  abouts: {
    uk: 'Творчість і просторове мислення: дитина будує в 3D, планує споруду й виконує завдання.',
    ro: 'Creativitate și gândire spațială: copilul construiește în 3D, își planifică construcția și îndeplinește misiuni.',
    en: 'Creativity and spatial thinking: the child builds in 3D, plans the build and completes quests.',
  },
  together: 'Попросите ребёнка провести экскурсию по острову: что где стоит и зачем. Предложите вместе построить что-то по описанию.',
  togethers: {
    uk: 'Попросіть дитину провести екскурсію островом: що де стоїть і навіщо. Запропонуйте разом збудувати щось за описом.',
    ro: 'Rugați copilul să vă facă un tur al insulei: ce e unde și de ce. Propuneți să construiți împreună ceva după o descriere.',
    en: 'Ask your child for a tour of the island: what is where and why. Suggest building something together from a description.',
  },
  tagline: 'Блоки, деревья, лодки и фонари. Построй свой остров.',
  taglines: { uk: 'Блоки, дерева, човни й ліхтарі. Збудуй свій острів.', ro: 'Blocuri, copaci, bărci și felinare. Construiește-ți insula.', en: 'Blocks, trees, boats and lanterns. Build your own island.' },
  color: '#7ee7ff',
});
