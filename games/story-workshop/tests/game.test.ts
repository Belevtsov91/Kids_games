import { describe, expect, it } from 'vitest';
import { addTale, allHeroes, emptyProgress, readProgress, SHELF } from '../src/game/progress';
import { HEROES, ITEMS, panelsOf, PLACES, randomTale, readTale, TWISTS, type Tale } from '../src/game/story';
import { nameOf, tell } from '../src/game/tell';
import { en } from '../src/i18n/en';
import { ro } from '../src/i18n/ro';
import { ru } from '../src/i18n/ru';
import { uk } from '../src/i18n/uk';

const tale: Tale = { hero: 'bunny', place: 'forest', twist: 'dark', item: 'lamp', at: 1 };

describe('сказка', () => {
  it('три подписи на каждом языке и для каждого кубика', () => {
    for (const t of [ru, uk, ro, en]) {
      for (const hero of HEROES) for (const place of PLACES) for (const twist of TWISTS) for (const item of ITEMS) {
        const lines = tell({ hero, place, twist, item, at: 1 }, t.words);
        expect(lines.every((l) => l.length > 10 && !l.includes('undefined'))).toBe(true);
      }
    }
    expect(tell(tale, ru.words)[0]).toBe('Жил-был зайчик. Однажды он отправился в волшебный лес.');
    expect(nameOf(tale, ru.words, ru.and)).toBe('Зайчик и фонарик');
  });

  it('комикс из трёх картинок, герой на каждой', () => {
    const panels = panelsOf(tale);
    expect(panels).toHaveLength(3);
    expect(panels.every((p) => p.actors[0] === '🐰')).toBe(true);
  });

  it('случайная сказка всегда допустима', () => {
    for (const r of [0, 0.5, 0.9999]) expect(readTale(randomTale(() => r, 5))).not.toBeNull();
    expect(readTale({ hero: 'wolf', place: 'forest', twist: 'dark', item: 'lamp' })).toBeNull();
  });
});

describe('полка', () => {
  it('хранит последние сказки и героев', () => {
    let p = emptyProgress();
    for (let i = 0; i < SHELF + 3; i++) p = addTale(p, { ...tale, hero: HEROES[i % HEROES.length]!, at: i + 1 });
    expect(p.tales).toHaveLength(SHELF);
    expect(p.tales[0]!.at).toBe(SHELF + 3);
    expect(p.made).toBe(SHELF + 3);
    expect(allHeroes(p)).toBe(true);
  });

  it('чинит испорченное сохранение', () => {
    expect(readProgress(null)).toEqual(emptyProgress());
    const p = readProgress({ tales: [tale, { hero: 'x' }], made: -2, heroes: ['bunny', 'cow'] });
    expect(p.tales).toHaveLength(1);
    expect(p.made).toBe(1);
    expect(p.heroes).toEqual(['bunny']);
  });
});
