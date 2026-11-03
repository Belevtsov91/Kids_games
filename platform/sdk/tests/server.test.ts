import { describe, expect, it, vi } from 'vitest';
import {
  NO_CHILD_ERROR,
  childIdOf,
  gameTablePrefix,
  playerKeyOf,
  requireChild,
  requirePlayer,
  scopeGameDb,
  sessionOf,
  type GameDb,
} from '../src/server';

const req = (session: unknown) => ({ session });
const reply = () => {
  const send = vi.fn();
  return { code: vi.fn(() => ({ send })), send };
};

describe('@ig/sdk/server', () => {
  it('читает сессию и ребёнка', () => {
    expect(sessionOf(req(null))).toBeNull();
    expect(sessionOf({})).toBeNull();
    expect(childIdOf(req({ parentId: 'p', activeChildId: 'c' }))).toBe('c');
    expect(childIdOf(req({ parentId: 'p', activeChildId: null }))).toBeNull();
  });

  it('ключ игрока: ребёнок, иначе родитель', () => {
    expect(playerKeyOf(req({ parentId: 'p', activeChildId: 'c' }))).toBe('child:c');
    expect(playerKeyOf(req({ parentId: 'p', activeChildId: null }))).toBe('parent:p');
    expect(playerKeyOf(req(null))).toBeNull();
  });

  it('requireChild отвечает 401 без ребёнка и пропускает с ребёнком', async () => {
    const denied = reply();
    await requireChild(req({ parentId: 'p', activeChildId: null }), denied);
    expect(denied.code).toHaveBeenCalledWith(401);
    expect(denied.send).toHaveBeenCalledWith(NO_CHILD_ERROR);

    const allowed = reply();
    await requireChild(req({ parentId: 'p', activeChildId: 'c' }), allowed);
    expect(allowed.code).not.toHaveBeenCalled();
  });

  it('requirePlayer пускает родителя без ребёнка', async () => {
    const allowed = reply();
    await requirePlayer(req({ parentId: 'p', activeChildId: null }), allowed);
    expect(allowed.code).not.toHaveBeenCalled();
    const denied = reply();
    await requirePlayer(req(null), denied);
    expect(denied.code).toHaveBeenCalledWith(401);
  });
});

describe('БД игры', () => {
  it('префикс таблиц из id игры', () => {
    expect(gameTablePrefix('who-lives-where')).toBe('ig_game_who_lives_where_');
  });

  it('пускает только в свои таблицы', () => {
    const from = vi.fn((table: string) => ({ table }));
    const db = scopeGameDb({ from } as unknown as GameDb, 'letter-eater');
    expect(db.from('ig_game_letter_eater_progress')).toEqual({ table: 'ig_game_letter_eater_progress' });
    expect(() => db.from('ig_children')).toThrow();
    expect(() => db.from('ig_game_drawing_drawings')).toThrow();
    expect(() => db.from('ig_game_letter_eater')).toThrow();
    expect(from).toHaveBeenCalledTimes(1);
  });
});
