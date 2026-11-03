import { games } from '@/catalog/catalog';
import type { GameManifest } from '@ig/sdk';

// Доступ к играм. Без решения взрослого ребёнок видит все игры: по возрасту — в «Твоих мирах»,
// остальные — «за облаками». Взрослый может закрыть любую игру (false) или поднять игру
// не по возрасту в «Твои миры» (true).

/** Подходит ли игра по возрасту. */
export const fitsAge = (g: GameManifest, age: number) => g.ages.min <= age && age <= g.ages.max;

/** Игры, которые ребёнок видит (не закрытые взрослым). */
export const allowedGames = (child: { access: Record<string, boolean> }) => games.filter((g) => child.access[g.id] !== false);
