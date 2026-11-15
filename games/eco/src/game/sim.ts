// Симуляция суток: каждый час постройки дают энергию, дома её тратят, батареи сглаживают разницу.
import { BATTERY_CAPACITY, DEMAND, GROVE_SUN, HILL_WIND, HOURS, SUN, WIND, WIND_POWER, type Cell, type Layout, type Level, type Terrain, type Tool } from './types';

export interface Hour {
  /** Час на часах, 0–23. */
  clock: number;
  solar: number;
  wind: number;
  demand: number;
  /** Заряд всех батарей в конце часа. */
  charge: number;
  /** Сколько энергии не хватило (0 — свет горит). */
  missing: number;
  /** Сколько лишней энергии пропало: батареи полны. */
  wasted: number;
}

export interface DayResult {
  hours: Hour[];
  capacity: number;
  /** Часы без света. */
  blackouts: number;
  ok: boolean;
}

const PARSE: Record<string, Cell> = {
  '.': { terrain: 'grass' },
  '^': { terrain: 'hill' },
  t: { terrain: 'grove' },
  '~': { terrain: 'water' },
  h: { terrain: 'grass', house: 'house' },
  H: { terrain: 'grass', house: 'tower' },
  s: { terrain: 'grass', house: 'school' },
};

export const parseMap = (map: readonly string[]): Cell[] => map.flatMap((row) => [...row].map((ch) => PARSE[ch] ?? PARSE['.']));
export const mapSize = (map: readonly string[]) => ({ cols: map[0]?.length ?? 0, rows: map.length });

/** Можно ли строить на клетке. */
export const buildable = (cell: Cell | undefined) => !!cell && !cell.house && cell.terrain !== 'water';

/** Сколько даёт одна постройка в этот час. */
export function output(tool: Tool, terrain: Terrain, clock: number, level: Pick<Level, 'sun' | 'wind'>): number {
  if (tool === 'solar') return SUN[clock] * level.sun * (terrain === 'grove' ? GROVE_SUN : 1);
  if (tool === 'wind') return WIND[level.wind][clock] * WIND_POWER * (terrain === 'hill' ? HILL_WIND : 1);
  return 0;
}

export function spent(layout: Layout, cost: Record<Tool, number>) {
  return Object.values(layout).reduce((sum, tool) => sum + cost[tool], 0);
}

/** Общий расход и выработка по часам — то, что показывает график-прогноз. */
export function forecast(level: Level, layout: Layout) {
  const cells = parseMap(level.map);
  const placed = Object.entries(layout).map(([i, tool]) => ({ tool, terrain: cells[Number(i)]?.terrain ?? 'grass' }));
  return HOURS.map((clock) => {
    let solar = 0;
    let wind = 0;
    for (const p of placed) {
      if (p.tool === 'solar') solar += output('solar', p.terrain, clock, level);
      if (p.tool === 'wind') wind += output('wind', p.terrain, clock, level);
    }
    const demand = cells.reduce((sum, c) => sum + (c.house ? DEMAND[c.house][clock] : 0), 0);
    return { clock, solar, wind, demand };
  });
}

const EPS = 1e-6;

function pass(plan: ReturnType<typeof forecast>, capacity: number, start: number) {
  let charge = start;
  const hours: Hour[] = [];
  for (const h of plan) {
    const balance = h.solar + h.wind - h.demand;
    let missing = 0;
    let wasted = 0;
    if (balance >= 0) {
      const room = capacity - charge;
      wasted = Math.max(0, balance - room);
      charge = Math.min(capacity, charge + balance);
    } else {
      const need = -balance;
      missing = Math.max(0, need - charge);
      charge = Math.max(0, charge - need);
    }
    hours.push({ ...h, charge, missing: missing > EPS ? missing : 0, wasted });
  }
  return hours;
}

/**
 * Сутки с рассвета до рассвета. Утром в батареях то, что осталось с прошлой ночи:
 * день прокручивается несколько раз, пока заряд на рассвете не перестанет меняться.
 */
export function simulate(level: Level, layout: Layout): DayResult {
  const plan = forecast(level, layout);
  const capacity = Object.values(layout).filter((t) => t === 'battery').length * BATTERY_CAPACITY;
  let start = 0;
  let hours = pass(plan, capacity, start);
  for (let i = 0; i < 6; i++) {
    const end = hours[hours.length - 1].charge;
    if (Math.abs(end - start) < EPS) break;
    start = end;
    hours = pass(plan, capacity, start);
  }
  const blackouts = hours.filter((h) => h.missing > 0).length;
  return { hours, capacity, blackouts, ok: blackouts === 0 };
}
