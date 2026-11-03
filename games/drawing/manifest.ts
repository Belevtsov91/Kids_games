import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'drawing',
  title: 'Рисовалка',
  titles: { uk: 'Малювалка', ro: 'Desenăm', en: 'Drawing' },
  emoji: '🖍️',
  kind: '2d',
  ages: { min: 3, max: 15 },
});
