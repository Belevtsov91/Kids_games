import type { GameManifest, Skill } from '@ig/sdk';

// Предметы для фильтра в меню. Собираются из навыков в манифестах (skills): оболочка не знает игры по именам.
// Семнадцать навыков — слишком много кнопок для ребёнка, поэтому они сведены в пять понятных предметов.

export const SUBJECTS = ['math', 'reading', 'logic', 'creative', 'world'] as const;
export type Subject = (typeof SUBJECTS)[number];

const SUBJECT_OF: Record<Skill, Subject> = {
  count: 'math', numbers: 'math', sizes: 'math', shapes: 'math',
  letters: 'reading', reading: 'reading',
  logic: 'logic', memory: 'logic', space: 'logic',
  creativity: 'creative', music: 'creative', colors: 'creative', motor: 'creative',
  nature: 'world', animals: 'world', emotions: 'world', routine: 'world',
};

/** Предметы игры по её навыкам, без повторов. Игра без навыков не попадает ни в один предмет. */
export const subjectsOf = (game: GameManifest): Subject[] => [...new Set((game.skills ?? []).map((s) => SUBJECT_OF[s]))];

/** Предметы, в которых есть хотя бы одна игра из списка, в порядке SUBJECTS: пустых кнопок в меню не бывает. */
export const subjectsIn = (list: GameManifest[]): Subject[] => {
  const seen = new Set(list.flatMap(subjectsOf));
  return SUBJECTS.filter((s) => seen.has(s));
};

/** Сколько дней игра считается новой после addedAt. */
export const NEW_DAYS = 30;

/** Новая ли игра: прошло меньше NEW_DAYS дней с addedAt. */
export const isNewGame = (game: GameManifest, now = new Date()) => {
  if (!game.addedAt) return false;
  const days = (now.getTime() - Date.parse(`${game.addedAt}T00:00:00Z`)) / 86_400_000;
  return days >= 0 && days < NEW_DAYS;
};

/** Фильтр меню: все игры, только новые, только 3D-миры или один предмет. */
export type MenuFilter = 'all' | 'new' | '3d' | Subject;

export function matchesFilter(game: GameManifest, filter: MenuFilter, now = new Date()) {
  if (filter === 'all') return true;
  if (filter === 'new') return isNewGame(game, now);
  if (filter === '3d') return game.kind === '3d';
  return subjectsOf(game).includes(filter);
}
