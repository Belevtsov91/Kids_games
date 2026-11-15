// Дроби без плавающей точки: числитель и знаменатель — целые, сравнение крест-накрест.

export interface Frac {
  n: number;
  d: number;
}

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

export const frac = (n: number, d: number): Frac => ({ n, d });

/** Несократимая форма: 4/8 → 1/2. */
export const simplify = (f: Frac): Frac => {
  const g = gcd(f.n, f.d) || 1;
  return { n: f.n / g, d: f.d / g };
};

export const equal = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;
export const less = (a: Frac, b: Frac) => a.n * b.d < b.n * a.d;

export const add = (a: Frac, b: Frac): Frac => simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
export const sub = (a: Frac, b: Frac): Frac => simplify({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });

export const sum = (list: Frac[]) => list.reduce(add, frac(0, 1));

/** Сколько кусков из `slices` равны дроби; null — так не разрезать ровно (1/3 на 8 кусков). */
export const slicesFor = (f: Frac, slices: number): number | null => {
  const whole = f.n * slices;
  return whole % f.d === 0 ? whole / f.d : null;
};

/** Наименьшее число кусков, на которое делятся все знаменатели. */
export const commonCut = (list: Frac[]) => list.reduce((acc, f) => lcm(acc, simplify(f).d), 1);

export const show = (f: Frac) => `${f.n}/${f.d}`;
