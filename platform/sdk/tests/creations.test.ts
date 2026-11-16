import { describe, expect, it } from 'vitest';
import { mergeCreations, type Creation } from '../src/creations';

const c = (id: string, createdAt: string, title = id): Creation => ({ id, title, createdAt, kind: 'picture' });

describe('mergeCreations', () => {
  it('сливает ленты игр, новые сверху', () => {
    const merged = mergeCreations([[c('a', '2026-11-01T10:00:00Z'), c('b', '2026-10-01T10:00:00Z')], [c('m', '2026-11-10T10:00:00Z')]]);
    expect(merged.map((x) => x.id)).toEqual(['m', 'a', 'b']);
  });

  it('при равной дате — по названию, пустые ленты не мешают', () => {
    const at = '2026-11-01T10:00:00Z';
    expect(mergeCreations([[], [c('2', at, 'Бит')], [c('1', at, 'Арбуз')]]).map((x) => x.id)).toEqual(['1', '2']);
  });
});
