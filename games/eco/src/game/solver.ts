// Перебор: самый дешёвый набор построек, при котором свет не гаснет. Нужен для звёзд и подсказки Тёпы.
import { COST, type Layout, type Level, type Tool } from './types';
import { buildable, parseMap, simulate } from './sim';

export interface Plan {
  layout: Layout;
  cost: number;
  counts: Record<Tool, number>;
}

/** Расставляет набор по лучшим клеткам: ветряки на холмы, панели мимо рощ, батареи куда осталось. */
export function arrange(level: Level, want: { sunFull: number; sunShade: number; windHill: number; windPlain: number; battery: number }): Layout | null {
  const cells = parseMap(level.map);
  const free = (terrain: string) => cells.map((c, i) => (buildable(c) && c.terrain === terrain ? i : -1)).filter((i) => i >= 0);
  const pools = { grass: free('grass'), hill: free('hill'), grove: free('grove') };
  const layout: Layout = {};
  const take = (tool: Tool, n: number, order: (keyof typeof pools)[]) => {
    for (let k = 0; k < n; k++) {
      const pool = order.find((name) => pools[name].length > 0);
      if (!pool) return false;
      layout[pools[pool].shift()!] = tool;
    }
    return true;
  };
  const ok =
    take('wind', want.windHill, ['hill']) &&
    take('solar', want.sunShade, ['grove']) &&
    take('solar', want.sunFull, ['grass', 'hill']) &&
    take('wind', want.windPlain, ['grass', 'grove']) &&
    take('battery', want.battery, ['grove', 'grass', 'hill']);
  return ok ? layout : null;
}

const count = (layout: Layout): Record<Tool, number> => {
  const counts: Record<Tool, number> = { solar: 0, wind: 0, battery: 0 };
  for (const tool of Object.values(layout)) counts[tool]++;
  return counts;
};

/** Самый дешёвый рабочий план в пределах бюджета уровня (или заданного предела). null — решения нет. */
export function cheapest(level: Level, limit = level.budget): Plan | null {
  const has = (t: Tool) => level.tools.includes(t);
  const max = (t: Tool) => (has(t) ? Math.floor(limit / COST[t]) : 0);
  let best: Plan | null = null;
  for (let sunFull = 0; sunFull <= max('solar'); sunFull++)
    for (let sunShade = 0; sunFull + sunShade <= max('solar'); sunShade++)
      for (let windHill = 0; windHill <= max('wind'); windHill++)
        for (let windPlain = 0; windHill + windPlain <= max('wind'); windPlain++) {
          const base = (sunFull + sunShade) * COST.solar + (windHill + windPlain) * COST.wind;
          if (base > limit || (best && base >= best.cost)) continue;
          for (let battery = 0; battery <= max('battery'); battery++) {
            const cost = base + battery * COST.battery;
            if (cost > limit || (best && cost >= best.cost)) break;
            const layout = arrange(level, { sunFull, sunShade, windHill, windPlain, battery });
            if (!layout) break;
            if (simulate(level, layout).ok) {
              best = { layout, cost, counts: count(layout) };
              break;
            }
          }
        }
  return best;
}

const parCache = new Map<number, number>();
/** Цена лучшего решения уровня: столько стоит стройка на три звезды. */
export function par(level: Level): number {
  if (!parCache.has(level.id)) parCache.set(level.id, cheapest(level)?.cost ?? level.budget);
  return parCache.get(level.id)!;
}

/** Звёзды за решённый уровень: 3 — не дороже лучшего решения, 2 — чуть дороже, 1 — свет горит. */
export function starsFor(level: Level, cost: number): 1 | 2 | 3 {
  const best = par(level);
  if (cost <= best) return 3;
  if (cost <= best + COST.wind) return 2;
  return 1;
}
