import { defineManifest } from '@ig/sdk';
export default defineManifest({
  id: 'counting',
  title: 'Считай и играй',
  titles: { uk: 'Лічи та грай', ro: 'Numără și joacă', en: 'Count & play' },
  emoji: '🔢',
  kind: '2d',
  ages: { min: 3, max: 8 },
});
