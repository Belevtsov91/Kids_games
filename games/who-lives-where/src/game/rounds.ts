// Правила раундов без DOM: что показать на уровне и как сливать прогресс.
import { animalIds, habitats, type Animal, type Habitat } from './data';

export interface Round {
  level: number;
  homes: Habitat[];
  /** Животные в лотке, уже перемешанные. */
  animals: Animal[];
}

export interface Progress {
  /** Уровень, с которого продолжить игру (с 1). */
  level: number;
  /** Животные, которых ребёнок уже хоть раз поселил домой. */
  found: string[];
}

export const MAX_LEVEL = 99;
export const emptyProgress = (): Progress => ({ level: 1, found: [] });

/** Сложность растёт плавно: сначала 2 дома по 2 зверя, потом больше домов и зверей. */
export function levelShape(level: number): { homes: number; perHome: number; maxTier: 1 | 2 | 3 } {
  if (level <= 1) return { homes: 2, perHome: 2, maxTier: 1 };
  if (level === 2) return { homes: 2, perHome: 3, maxTier: 1 };
  if (level === 3) return { homes: 3, perHome: 2, maxTier: 1 };
  if (level === 4) return { homes: 3, perHome: 2, maxTier: 2 };
  if (level <= 6) return { homes: 3, perHome: 3, maxTier: 2 };
  if (level <= 8) return { homes: 4, perHome: 2, maxTier: 3 };
  return { homes: 4, perHome: 3, maxTier: 3 };
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Собирает раунд. Новые для ребёнка звери идут первыми — так альбом заполняется,
 * а не одни и те же корова со свинкой каждый раз.
 */
export function buildRound(level: number, found: readonly string[] = [], random: () => number = Math.random): Round {
  const { homes: homeCount, perHome, maxTier } = levelShape(level);
  const known = new Set(found);
  const unseen = (h: Habitat) => h.animals.filter((a) => !known.has(a.id)).length;

  // Дома: сначала те, где больше неизвестных зверей; при равенстве — случайно.
  const pool = shuffle(habitats.filter((h) => h.tier <= maxTier), random);
  const homes = pool.sort((a, b) => unseen(b) - unseen(a)).slice(0, homeCount);

  const animals = homes.flatMap((home) => {
    const fresh = shuffle(home.animals.filter((a) => !known.has(a.id)), random);
    const old = shuffle(home.animals.filter((a) => known.has(a.id)), random);
    return [...fresh, ...old].slice(0, perHome);
  });

  return { level, homes: shuffle(homes, random), animals: shuffle(animals, random) };
}

/** Сливает прогресс: уровень только растёт, найденные звери только добавляются, чужие id отбрасываются. */
export function mergeProgress(current: Progress, update: Partial<Progress>): Progress {
  const level = Math.min(MAX_LEVEL, Math.max(current.level, Math.floor(update.level ?? 1)));
  const found = [...new Set([...current.found, ...(update.found ?? [])])].filter((id) => animalIds.has(id));
  return { level, found };
}
