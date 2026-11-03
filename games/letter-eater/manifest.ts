import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'letter-eater',
  title: 'Буквоед',
  titles: { uk: 'Буквоїд', ro: 'Mâncătorul de litere', en: 'Letter Eater' },
  emoji: '🔤',
  kind: '2d',
  ages: { min: 6, max: 10 },
});
