// Уровни «Звёздного штурмана». Сцена 1000 × 625; родная планета Тёпы — слева внизу.
// Каждый уровень проверен тестом: перебор курса и мощности находит хотя бы одно решение.
import type { Body, Orbit, Vec } from './physics';

export type Goal = 'land' | 'orbit';

export interface Level {
  id: string;
  goal: Goal;
  bodies: Body[];
  crystals: Vec[];
  /** Сколько секунд будущего пути видно пунктиром. Чем дальше, тем меньше подсказки. */
  preview: number;
  /** Сколько тормозных импульсов можно дать в полёте. */
  burns: number;
  /** Сколько секунд длится полёт, прежде чем ракета считается потерянной. */
  maxTime: number;
}

const HOME: Body = { kind: 'home', x: 110, y: 510, r: 34, mu: 30000, color: '#a59cff' };
const home = (x = HOME.x, y = HOME.y): Body => ({ ...HOME, x, y });
const target = (x: number, y: number, r = 30, mu = 400000, orbit?: Orbit): Body => ({ kind: 'target', x, y, r, mu, color: '#4fc3ff', orbit });
const planet = (x: number, y: number, r: number, mu: number, color: string, ring = false, orbit?: Orbit): Body => ({ kind: 'planet', x, y, r, mu, color, ring, orbit });
const sun = (x: number, y: number, r = 46, mu = 2600000): Body => ({ kind: 'sun', x, y, r, mu, color: '#ffd25a' });
const around = (cx: number, cy: number, r: number, period: number, phase: number): Orbit => ({ cx, cy, r, period, phase });

const level = (id: string, goal: Goal, bodies: Body[], extra: Partial<Level> = {}): Level => ({
  id, goal, bodies, crystals: [], preview: 2.5, burns: 0, maxTime: 10, ...extra,
});

export const LEVELS: readonly Level[] = [
  // 1. Прямой полёт: только родная планета и цель.
  level('first-launch', 'land', [home(), target(820, 180)], { preview: 4 }),
  // 2. Тяжёлая планета посередине искривляет путь.
  level('heavy-planet', 'land', [home(), planet(480, 330, 44, 1400000, '#ff8a5b'), target(860, 200)], { preview: 3 }),
  // 3. Прямую линию закрывает планета — облети её дугой.
  level('detour', 'land', [home(), planet(500, 360, 60, 1800000, '#c38bff', true), target(880, 230)], {
    crystals: [{ x: 592, y: 244 }], preview: 2.5,
  }),
  // 4. Звезда: близко не подлетай — сгоришь, но её притяжение заворачивает ракету.
  level('around-sun', 'land', [home(), sun(480, 470), target(870, 470)], { crystals: [{ x: 616, y: 383 }], preview: 2.5 }),
  // 5. Первая орбита: подлети и вовремя затормози.
  level('first-orbit', 'orbit', [home(), target(700, 280, 34, 1600000)], { preview: 2.5, burns: 1, maxTime: 30 }),
  // 6. Цель за двумя планетами — гравитационный манёвр.
  level('slingshot', 'land', [home(), planet(380, 230, 38, 1200000, '#ff8a5b'), planet(640, 460, 42, 1500000, '#7ee0a0'), target(900, 110, 26)], {
    crystals: [{ x: 624, y: 244 }], preview: 2,
  }),
  // 7. Луна кружит вокруг большой планеты — лови момент.
  level('moving-moon', 'land', [home(), planet(600, 300, 50, 1800000, '#ffcf8a', true), target(0, 0, 22, 200000, around(600, 300, 170, 9, Math.PI))], {
    preview: 2, maxTime: 14,
  }),
  // 8. Две звезды: узкий коридор между ними.
  level('twin-suns', 'land', [home(), sun(420, 180, 40, 1600000), sun(520, 520, 40, 1600000), target(890, 330)], {
    crystals: [{ x: 390, y: 425 }, { x: 615, y: 375 }], preview: 1.8,
  }),
  // 9. Орбита у гиганта, рядом мешает вторая планета.
  level('giant-orbit', 'orbit', [home(), planet(330, 200, 30, 600000, '#ff8a5b'), target(680, 330, 46, 2600000)], {
    crystals: [{ x: 385, y: 359 }], preview: 1.6, burns: 1, maxTime: 30,
  }),
  // 10. Дальний рейс: движущаяся планета-ускоритель и цель в углу.
  level('long-voyage', 'land', [home(), sun(500, 330, 40, 2000000), planet(0, 0, 30, 900000, '#7ee0a0', false, around(500, 330, 200, 12, 0)), target(920, 70, 22)], {
    crystals: [{ x: 364, y: 279 }, { x: 608, y: 152 }], preview: 1.4, maxTime: 14,
  }),
];

export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
