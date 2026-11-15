import { describe, expect, it } from 'vitest';
import { isAlbumFull } from '../src/api/drawings';

describe('isAlbumFull', () => {
  it('узнаёт ответ сервера «альбом полон» в ошибке оболочки', () => {
    expect(isAlbumFull({ status: 409, data: { code: 'album_full' } })).toBe(true);
  });
  it('другие ошибки — обычная неудача сохранения', () => {
    expect(isAlbumFull({ status: 409, data: { code: 'other' } })).toBe(false);
    expect(isAlbumFull({ status: 500, data: null })).toBe(false);
    expect(isAlbumFull(new Error('offline'))).toBe(false);
    expect(isAlbumFull(null)).toBe(false);
  });
});
