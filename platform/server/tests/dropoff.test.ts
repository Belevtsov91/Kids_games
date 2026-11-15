import { describe, expect, it } from 'vitest';
import { buildDropoff, byGame } from '../src/modules/admin/dropoff';

const today = '2026-11-15';
const level = (child_id: string, name: string, day: string, time = '10:00') => ({ child_id, name, created_at: `${day}T${time}:00Z` });

describe('где дети бросают игру', () => {
  it('пусто — нет ни игроков, ни худшего уровня', () => {
    expect(buildDropoff([], [], today)).toEqual({ players: 0, active: 0, quitBeforeFirst: 0, levels: [], worst: null });
  });

  it('воронка по уровням и последний уровень бросивших', () => {
    const plays = [
      { child_id: 'a', day: '2026-11-01' },
      { child_id: 'b', day: '2026-11-02' },
      { child_id: 'c', day: '2026-11-03' },
      { child_id: 'd', day: '2026-11-04' }, // ни одного уровня и давно не заходит
      { child_id: 'e', day: '2026-11-14' }, // ещё играет
    ];
    const levels = [
      level('a', '1', '2026-11-01'), level('a', '2', '2026-11-01', '10:05'), level('a', '10', '2026-11-01', '10:09'),
      level('b', '1', '2026-11-02'), level('b', '2', '2026-11-02', '10:05'),
      level('c', '1', '2026-11-03'),
      level('e', '1', '2026-11-14'),
    ];
    const r = buildDropoff(plays, levels, today);
    expect(r.players).toBe(5);
    expect(r.active).toBe(1);
    expect(r.quitBeforeFirst).toBe(1);
    expect(r.levels).toEqual([
      { name: '1', reached: 4, quit: 1 },
      { name: '2', reached: 2, quit: 1 },
      { name: '10', reached: 1, quit: 1 },
    ]);
    expect(r.worst).toEqual({ level: '', quit: 1, share: 20 });
  });

  it('худший уровень — где бросили больше всего; при равных уровни идут по-человечески', () => {
    const levels = [level('a', 'b-2', '2026-11-01'), level('b', 'b-2', '2026-11-01'), level('c', 'b-10', '2026-11-01'), level('c', 'b-2', '2026-11-01', '09:00')];
    const r = buildDropoff([], levels, today);
    expect(r.levels.map((l) => l.name)).toEqual(['b-2', 'b-10']);
    expect(r.worst).toEqual({ level: 'b-2', quit: 2, share: 67 });
  });

  it('кто заходил в последние три дня — ещё играет, а не бросил', () => {
    const r = buildDropoff([{ child_id: 'a', day: '2026-11-13' }], [level('a', '1', '2026-11-01')], today);
    expect(r.active).toBe(1);
    expect(r.levels[0].quit).toBe(0);
    expect(r.worst).toBeNull();
  });

  it('раскладывает строки по играм', () => {
    const rows = [{ game_id: 'x', n: 1 }, { game_id: 'y', n: 2 }, { game_id: 'x', n: 3 }];
    expect(byGame(rows).get('x')).toEqual([{ game_id: 'x', n: 1 }, { game_id: 'x', n: 3 }]);
  });
});
