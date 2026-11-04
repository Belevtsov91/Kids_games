// Правила «Тёпы» без DOM: порядок сцен, задания на цвета, фигуры и размеры, наклейки. Их проверяют тесты.

export type SceneId = 'dinner' | 'bath' | 'teeth' | 'pajama' | 'night';
export const SCENES: SceneId[] = ['dinner', 'bath', 'teeth', 'pajama', 'night'];

export type Rng = () => number;

export const COLORS = ['red', 'yellow', 'green', 'orange', 'purple', 'blue'] as const;
export type Color = (typeof COLORS)[number];

/** Еда для ужина: у каждого цвета своя, чтобы ответ был однозначным. */
export const FOODS: Record<Color, string> = {
  red: 'apple',
  yellow: 'banana',
  green: 'cucumber',
  orange: 'carrot',
  purple: 'plum',
  blue: 'blueberry',
};

export const SHAPES = ['circle', 'star', 'triangle', 'square', 'heart'] as const;
export type Shape = (typeof SHAPES)[number];

export const PAJAMAS = ['stars', 'dots', 'stripes', 'hearts', 'moons'] as const;
export type Pajama = (typeof PAJAMAS)[number];

export const TOYS = ['ball', 'duck', 'cube', 'car'] as const;

export function shuffle<T>(list: readonly T[], rng: Rng): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ужин: три раунда. В каждом цель и 4 блюда разных цветов, среди них ровно одно нужное. */
export function dinnerRounds(rng: Rng, rounds = 3) {
  const targets = shuffle(COLORS, rng).slice(0, rounds);
  return targets.map((target) => {
    const others = shuffle(COLORS.filter((c) => c !== target), rng).slice(0, 3);
    return { target, options: shuffle([target, ...others], rng) };
  });
}

/** Пижама: три места-силуэта и четыре фигурки (одна лишняя). */
export function pajamaRound(rng: Rng) {
  const all = shuffle(SHAPES, rng);
  const slots = all.slice(0, 3);
  return { slots, tray: shuffle([...slots, all[3]], rng) };
}

/** Игрушки: четыре по очереди, большие и маленькие вперемешку, но обоих размеров поровну. */
export function toysRound(rng: Rng) {
  const toys = shuffle(TOYS, rng);
  const sizes = shuffle([true, true, false, false], rng);
  return toys.map((toy, i) => ({ toy, big: sizes[i] }));
}

/** Пижама этой ночи: по кругу, чтобы за пять ночей собрать все. */
export const pajamaOf = (nights: number): Pajama => PAJAMAS[nights % PAJAMAS.length];

/** Наклейки за законченную ночь. nights — сколько ночей было ДО этой. */
export function stickersFor(nights: number, cleanPaws: boolean): string[] {
  const out = [`pajama-${pajamaOf(nights)}`];
  if (nights === 0) out.push('first-night');
  if (cleanPaws) out.push('clean-paws');
  if (nights + 1 === 7) out.push('seven-nights');
  return out;
}

/** Сколько минут осталось до конца времени, при котором сразу идём спать. */
export const HURRY_MINUTES = 2;

/** Какая сцена следующая. Если время кончается — сразу ночь. */
export function nextScene(current: SceneId | null, hurry: boolean): SceneId | null {
  if (current === 'night') return null;
  if (hurry) return 'night';
  return current === null ? SCENES[0] : SCENES[SCENES.indexOf(current) + 1];
}
