import { describe, expect, it } from 'vitest';
import { decode, fitsAlphabet } from '../src/game/caesar';
import { fitsTable } from '../src/game/morse';
import {
  BAG_SIZE,
  letterOptions,
  lighthouseLevel,
  makeLighthouseRounds,
  makeRiddleRounds,
  makeWheelRounds,
  shuffle,
  starsFor,
  wheelLevel,
} from '../src/game/rounds';
import { earnedStickers, emptySave, finishBag, readSave } from '../src/game/save';
import { PACKS } from '../src/packs';
import manifest from '../manifest';

/** Детерминированный генератор, чтобы тесты не зависели от случайности. */
function seeded(seed = 42) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('языковые наборы', () => {
  for (const [locale, pack] of Object.entries(PACKS)) {
    it(`${locale}: слова влезают в алфавит и таблицу Морзе, у загадок 4 разных ответа`, () => {
      expect(new Set(Array.from(pack.alphabet)).size).toBe(Array.from(pack.alphabet).length);
      expect(pack.words.length).toBeGreaterThanOrEqual(12);
      for (const { word, emoji } of pack.words) {
        expect(fitsAlphabet(word, pack.alphabet)).toBe(true);
        expect(fitsTable(word, pack.morse)).toBe(true);
        expect(emoji).not.toBe('');
      }
      expect(pack.riddles.length).toBeGreaterThanOrEqual(BAG_SIZE);
      for (const riddle of pack.riddles) expect(new Set(riddle.choices.map((c) => c.text)).size).toBe(4);
    });
  }

  it('во всех языках одинаковое число слов и загадок', () => {
    const sizes = Object.values(PACKS).map((p) => `${p.words.length}/${p.riddles.length}`);
    expect(new Set(sizes).size).toBe(1);
  });
});

describe('раунды', () => {
  it('колесо: шифровка расшифровывается своим ключом, трудность растёт', () => {
    for (const tier of [0, 1, 2, 5]) {
      const level = wheelLevel(tier, PACKS.ru.alphabet);
      const rounds = makeWheelRounds(PACKS.ru, tier, seeded(tier + 1));
      expect(rounds).toHaveLength(BAG_SIZE);
      for (const r of rounds) {
        expect(decode(r.cipher, r.key, PACKS.ru.alphabet)).toBe(r.word);
        expect(r.key).toBeGreaterThanOrEqual(1);
        expect(r.key).toBeLessThanOrEqual(level.maxKey);
        expect(r.cipher).not.toBe(r.word);
        expect(r.keyKnown).toBe(level.keyKnown);
      }
    }
    expect(wheelLevel(0, PACKS.en.alphabet).keyKnown).toBe(true);
    expect(wheelLevel(2, PACKS.en.alphabet)).toMatchObject({ keyKnown: false, maxKey: 25 });
  });

  it('маяк: слова нужной длины, варианты без повторов и с верной буквой', () => {
    const rng = seeded(7);
    for (const tier of [0, 1, 2]) {
      const level = lighthouseLevel(tier);
      for (const { word } of makeLighthouseRounds(PACKS.uk, tier, rng)) {
        const len = Array.from(word).length;
        expect(len).toBeGreaterThanOrEqual(level.minLen);
        expect(len).toBeLessThanOrEqual(level.maxLen);
      }
    }
    const options = letterOptions('К', PACKS.ru.morse, 4, rng);
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options).toContain('К');
  });

  it('загадки: верный ответ отмечен после перемешивания', () => {
    for (const round of makeRiddleRounds(PACKS.en, seeded(3))) {
      const source = PACKS.en.riddles.find((r) => r.question === round.question)!;
      expect(round.choices[round.answer]).toBe(source.choices[0]);
    }
  });

  it('перемешивание не теряет элементы, звёзды по ошибкам', () => {
    expect(shuffle([1, 2, 3, 4], seeded()).sort()).toEqual([1, 2, 3, 4]);
    expect([0, 1, 2, 3, 4, 9].map(starsFor)).toEqual([3, 3, 2, 2, 1, 1]);
  });
});

describe('сохранение и наклейки', () => {
  it('битое сохранение превращается в пустое', () => {
    expect(readSave(null)).toEqual(emptySave());
    expect(readSave({ bags: { wheel: -2, lighthouse: 'x' }, best: { riddle: 9 }, letters: 4.7 })).toEqual({
      bags: { wheel: 0, lighthouse: 0, riddle: 0 },
      best: { wheel: 0, lighthouse: 0, riddle: 3 },
      letters: 4,
    });
  });

  it('мешки открывают наклейки, и все наклейки есть в манифесте', () => {
    let save = emptySave();
    expect(earnedStickers(save)).toEqual([]);
    save = finishBag(save, 'riddle', 3, 5);
    expect(earnedStickers(save)).toEqual(['first-letter', 'riddle-solver']);
    for (let i = 0; i < 3; i++) save = finishBag(finishBag(save, 'wheel', 2, 5), 'lighthouse', 1, 5);
    save = finishBag(save, 'riddle', 1, 5);
    const all = earnedStickers(save);
    expect(all).toEqual(['first-letter', 'wheel-master', 'lighthouse-keeper', 'riddle-solver', 'postmaster']);
    expect(save.best.riddle).toBe(3);
    const ids = manifest.stickers?.map((s) => s.id);
    for (const id of all) expect(ids).toContain(id);
  });
});
