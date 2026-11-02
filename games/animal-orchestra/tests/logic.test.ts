import { describe, expect, it } from 'vitest';
import { ANIMALS, ANIMAL_IDS } from '../src/game/animals';
import { RepeatGame } from '../src/game/repeat';
import { MAX_NOTES, normalizeSong, SongRecorder, type SongNote } from '../src/game/song';

describe('зверята', () => {
  it('уникальные id и клавиши', () => {
    expect(new Set(ANIMAL_IDS).size).toBe(ANIMALS.length);
    expect(new Set(ANIMALS.map((a) => a.key)).size).toBe(ANIMALS.length);
  });

  it('ноты идут слева направо от низких к высоким', () => {
    const freqs = ANIMALS.map((a) => a.freq);
    expect(freqs).toEqual([...freqs].sort((x, y) => x - y));
  });
});

describe('запись мелодии', () => {
  it('время считается от первой ноты', () => {
    let now = 1000;
    const rec = new SongRecorder(() => now);
    rec.add('bear', 'instrument');
    now = 1250;
    rec.add('cat', 'voice');
    expect(rec.result()).toEqual([
      { a: 'bear', t: 0, m: 'instrument' },
      { a: 'cat', t: 250, m: 'voice' },
    ]);
  });

  it(`не больше ${MAX_NOTES} нот`, () => {
    let now = 0;
    const rec = new SongRecorder(() => (now += 10));
    for (let i = 0; i < MAX_NOTES; i++) expect(rec.add('dog', 'instrument')).toBe(true);
    expect(rec.full).toBe(true);
    expect(rec.add('dog', 'instrument')).toBe(false);
    expect(rec.length).toBe(MAX_NOTES);
  });

  it('длинные паузы сжимаются, порядок восстанавливается', () => {
    const notes: SongNote[] = [
      { a: 'cat', t: 5000, m: 'instrument' },
      { a: 'bear', t: 200, m: 'instrument' },
      { a: 'dog', t: 500, m: 'instrument' },
    ];
    expect(normalizeSong(notes, 1000).map((n) => [n.a, n.t])).toEqual([
      ['bear', 0],
      ['dog', 300],
      ['cat', 1300],
    ]);
  });
});

describe('«Повтори за мной»', () => {
  const sequence = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length];
  };

  it('фраза из 2 нот, сначала только 3 зверя, соседние ноты разные', () => {
    const game = new RepeatGame({ animals: ANIMAL_IDS, random: sequence([0, 0, 0.5]) });
    const phrase = game.newPhrase();
    expect(phrase).toHaveLength(2);
    expect(phrase[0]).not.toBe(phrase[1]);
    expect(phrase.every((a) => ANIMAL_IDS.slice(0, 3).includes(a))).toBe(true);
  });

  it('верный ответ даёт звезду и следующий уровень', () => {
    const game = new RepeatGame({ animals: ANIMAL_IDS });
    const [first, second] = game.newPhrase();
    expect(game.answer(first)).toBe('ok');
    expect(game.answer(second)).toBe('done');
    expect(game.stars).toBe(1);
    expect(game.level).toBe(2);
  });

  it('ошибка не наказывает: та же фраза с начала', () => {
    const game = new RepeatGame({ animals: ANIMAL_IDS });
    const phrase = game.newPhrase();
    const wrong = ANIMAL_IDS.find((a) => a !== phrase[0])!;
    expect(game.answer(wrong)).toBe('miss');
    expect(game.stars).toBe(0);
    expect(game.phrase).toEqual(phrase);
    expect(game.expected).toBe(phrase[0]);
  });

  it('с уровнями растут длина фразы и число зверей', () => {
    const game = new RepeatGame({ animals: ANIMAL_IDS });
    game.level = 9;
    expect(game.length).toBe(6);
    expect(game.poolSize).toBe(7);
    game.level = 100;
    expect(game.length).toBe(8);
  });
});
