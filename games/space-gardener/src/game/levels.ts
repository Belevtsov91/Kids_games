import type { Vec } from './ink';

// Мир игры — квадрат 800×800 условных единиц; экран масштабирует его под себя.
// Ось y направлена вниз. Горшок задаётся серединой дна.

export interface Level {
  id: string;
  name: string;
  /** Подсказка, которую показываем при входе на уровень. */
  tip: string;
  emitter: { x: number; y: number };
  /** Сколько капель выпустит комета. */
  drops: number;
  /** Сколько капель нужно цветку. */
  need: number;
  /** Запас лианы (суммарная длина линий). */
  ink: number;
  /** Множитель гравитации: 1 — обычная, меньше — как на Луне. */
  gravity?: number;
  pot: { x: number; y: number; w: number };
  asteroids?: { x: number; y: number; r: number }[];
  /** Металлические балки станции. */
  walls?: { x1: number; y1: number; x2: number; y2: number }[];
  /** Чёрные дыры: притягивают и глотают капли. */
  holes?: { x: number; y: number; r: number }[];
  /** Кристальные доски: их можно двигать пальцем и поворачивать касанием. */
  planks?: { x: number; y: number; len: number; angle: number }[];
  /** Вращающиеся спутники-вертушки, скорость в радианах в секунду. */
  spinners?: { x: number; y: number; len: number; speed: number }[];
  /** Решение для кнопки-подсказки (и для теста, что уровень проходим). */
  solution: { lines: Vec[][]; planks?: { x: number; y: number; angle: number }[] };
}

/** Шаг поворота доски по касанию. */
export const PLANK_TURN = Math.PI / 12;

export const levels: Level[] = [
  {
    id: 'sprout',
    name: 'Первый росток',
    tip: 'Нарисуй пальцем горку от кометы к горшку и нажми «Полить»!',
    emitter: { x: 200, y: 110 },
    drops: 25,
    need: 10,
    ink: 1000,
    pot: { x: 690, y: 760, w: 150 },
    solution: { lines: [[{ x: 140, y: 250 }, { x: 330, y: 360 }, { x: 540, y: 520 }]] },
  },
  {
    id: 'rock',
    name: 'Камушек',
    tip: 'Астероид разбрызгивает воду. Поймай капли лианой!',
    emitter: { x: 540, y: 110 },
    drops: 30,
    need: 12,
    ink: 1100,
    pot: { x: 180, y: 760, w: 140 },
    asteroids: [{ x: 540, y: 330, r: 60 }],
    solution: { lines: [[{ x: 700, y: 430 }, { x: 480, y: 500 }, { x: 260, y: 580 }]] },
  },
  {
    id: 'wall',
    name: 'Через стену',
    tip: 'Стена мешает! Перекинь воду поверху.',
    emitter: { x: 150, y: 110 },
    drops: 30,
    need: 12,
    ink: 1100,
    pot: { x: 570, y: 760, w: 140 },
    walls: [{ x1: 400, y1: 400, x2: 400, y2: 800 }],
    solution: { lines: [[{ x: 90, y: 220 }, { x: 300, y: 290 }, { x: 480, y: 360 }]] },
  },
  {
    id: 'hole',
    name: 'Чёрная дыра',
    tip: 'Чёрная дыра глотает капли. Обведи воду стороной!',
    emitter: { x: 140, y: 110 },
    drops: 30,
    need: 12,
    ink: 1100,
    pot: { x: 620, y: 760, w: 140 },
    holes: [{ x: 400, y: 480, r: 45 }],
    solution: { lines: [[{ x: 90, y: 230 }, { x: 330, y: 300 }, { x: 560, y: 380 }]] },
  },
  {
    id: 'plank',
    name: 'Кристальная доска',
    tip: 'Доску можно тащить пальцем, а касание её поворачивает.',
    emitter: { x: 340, y: 110 },
    drops: 30,
    need: 12,
    ink: 320,
    pot: { x: 660, y: 760, w: 140 },
    planks: [{ x: 160, y: 700, len: 240, angle: 0 }],
    solution: {
      lines: [[{ x: 520, y: 410 }, { x: 590, y: 480 }, { x: 630, y: 570 }]],
      planks: [{ x: 400, y: 320, angle: PLANK_TURN * 2 }],
    },
  },
  {
    id: 'spinner',
    name: 'Вертушка',
    tip: 'Спутник крутится и отбивает капли. Проведи воду мимо!',
    emitter: { x: 400, y: 110 },
    drops: 30,
    need: 12,
    ink: 1000,
    pot: { x: 650, y: 760, w: 140 },
    spinners: [{ x: 400, y: 430, len: 180, speed: 1.6 }],
    solution: { lines: [[{ x: 340, y: 220 }, { x: 450, y: 250 }, { x: 570, y: 300 }]] },
  },
  {
    id: 'moon',
    name: 'Лунный сад',
    tip: 'Здесь слабая гравитация: капли летят медленно и далеко.',
    emitter: { x: 120, y: 110 },
    drops: 30,
    need: 12,
    ink: 1100,
    gravity: 0.45,
    pot: { x: 670, y: 600, w: 130 },
    asteroids: [
      { x: 330, y: 560, r: 50 },
      { x: 520, y: 700, r: 45 },
    ],
    walls: [{ x1: 560, y1: 610, x2: 790, y2: 610 }],
    solution: { lines: [[{ x: 70, y: 240 }, { x: 330, y: 360 }, { x: 590, y: 480 }]] },
  },
  {
    id: 'two-holes',
    name: 'Две дыры',
    tip: 'Проскользни между чёрными дырами!',
    emitter: { x: 150, y: 110 },
    drops: 30,
    need: 12,
    ink: 1200,
    pot: { x: 660, y: 760, w: 140 },
    holes: [
      { x: 290, y: 540, r: 40 },
      { x: 560, y: 330, r: 40 },
    ],
    solution: { lines: [[{ x: 100, y: 240 }, { x: 290, y: 380 }, { x: 480, y: 560 }]] },
  },
  {
    id: 'roof',
    name: 'Сад под крышей',
    tip: 'Над горшком крыша. Как попасть внутрь сбоку?',
    emitter: { x: 200, y: 110 },
    drops: 30,
    need: 12,
    ink: 1200,
    pot: { x: 650, y: 760, w: 140 },
    walls: [{ x1: 540, y1: 560, x2: 790, y2: 560 }],
    solution: { lines: [[{ x: 150, y: 250 }, { x: 350, y: 440 }, { x: 530, y: 630 }]] },
  },
  {
    id: 'final',
    name: 'Звёздный сад',
    tip: 'Всё вместе: астероид, дыра, вертушка и доска. Ты справишься!',
    emitter: { x: 660, y: 110 },
    drops: 34,
    need: 14,
    ink: 760,
    pot: { x: 140, y: 760, w: 140 },
    asteroids: [{ x: 660, y: 290, r: 50 }],
    holes: [{ x: 420, y: 250, r: 42 }],
    spinners: [{ x: 420, y: 650, len: 150, speed: 2 }],
    planks: [{ x: 650, y: 720, len: 200, angle: -Math.PI / 6 }],
    solution: {
      lines: [[{ x: 790, y: 340 }, { x: 620, y: 410 }, { x: 440, y: 480 }]],
      planks: [{ x: 330, y: 545, angle: -Math.PI / 6 }],
    },
  },
];
