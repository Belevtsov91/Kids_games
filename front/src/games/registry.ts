import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface GameEntry {
  id: string;
  title: string;
  emoji: string;
  component: LazyExoticComponent<ComponentType>;
}

// Каждая игра грузится отдельным чанком: меню не тянет PixiJS/Three.js.
export const games: GameEntry[] = [
  {
    id: 'drawing',
    title: 'Рисовалка',
    emoji: '🖍️',
    component: lazy(() => import('./drawing/DrawingGame')),
  },
  {
    id: 'playground3d',
    title: '3D песочница',
    emoji: '🧊',
    component: lazy(() => import('./playground3d/Playground3D')),
  },
];

export const findGame = (id: string | undefined) => games.find((g) => g.id === id);
