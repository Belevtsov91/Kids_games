import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'who-lives-where',
  title: 'Кто где живёт',
  titles: { uk: 'Хто де живе', ro: 'Cine unde locuiește', en: 'Who Lives Where' },
  emoji: '🏡',
  kind: '2d',
  ages: { min: 3, max: 6 },
});
