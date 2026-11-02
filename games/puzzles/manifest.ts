import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'puzzles',
  title: 'Пазлы',
  emoji: '🧩',
  kind: '2d',
  ages: { min: 3, max: 12 },
});
