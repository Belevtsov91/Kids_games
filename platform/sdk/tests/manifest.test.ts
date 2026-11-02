import { describe, expect, it } from 'vitest';
import { buildCatalog, validateManifest, type GameManifest } from '../src';

const valid: GameManifest = { id: 'drawing', title: 'Рисовалка', emoji: '🖍️', kind: '2d', ages: { min: 3, max: 15 } };

describe('validateManifest', () => {
  it('принимает корректный манифест', () => {
    expect(validateManifest(valid, 'drawing')).toEqual([]);
  });

  it('требует, чтобы id совпадал с папкой', () => {
    expect(validateManifest(valid, 'other')).toEqual([expect.stringContaining('не совпадает')]);
  });

  it('ловит неверный возраст и kind', () => {
    const errors = validateManifest({ ...valid, kind: '4d', ages: { min: 9, max: 3 } }, 'drawing');
    expect(errors).toHaveLength(2);
  });

  it('не падает на мусоре', () => {
    expect(validateManifest(undefined, 'x')).toHaveLength(1);
  });
});

describe('buildCatalog', () => {
  it('пропускает битые манифесты и сортирует по названию', () => {
    const errors: string[] = [];
    const catalog = buildCatalog(
      [
        ['drawing', valid],
        ['broken', { id: 'broken' }],
        ['abc', { ...valid, id: 'abc', title: 'Азбука' }],
      ],
      (e) => errors.push(e),
    );
    expect(catalog.map((g) => g.id)).toEqual(['abc', 'drawing']);
    expect(errors.length).toBeGreaterThan(0);
  });
});
