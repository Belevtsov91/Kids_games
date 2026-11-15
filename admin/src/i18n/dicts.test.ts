import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ro } from './ro';
import { ru } from './ru';
import { uk } from './uk';

// Все словари совпадают по ключам, без пустых строк, а слова подтверждения одинаковы (их проверяет сервер).
describe('словари', () => {
  const keys = Object.keys(ru).sort();
  for (const [lang, dict] of Object.entries({ uk, ro, en })) {
    it(`${lang}: те же ключи и нет пустых`, () => {
      expect(Object.keys(dict).sort()).toEqual(keys);
      expect(Object.entries(dict).filter(([, v]) => !v.trim())).toEqual([]);
    });
    it(`${lang}: слова подтверждения как в ru`, () => {
      for (const k of keys.filter((x) => x.startsWith('word.'))) expect(dict[k as keyof typeof ru]).toBe(ru[k as keyof typeof ru]);
    });
    it(`${lang}: те же {подстановки}`, () => {
      const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      for (const k of keys) expect([k, vars(dict[k as keyof typeof ru])]).toEqual([k, vars(ru[k as keyof typeof ru])]);
    });
  }
});
