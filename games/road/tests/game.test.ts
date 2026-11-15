import { describe, expect, it } from 'vitest';
import { buildRounds, isRight, lightSequence, starsFor } from '../src/game/play';
import { emptyProgress, isHero, readProgress, recordChapter } from '../src/game/progress';
import { canGo, CHAPTERS, CHOICES, LIGHTS } from '../src/game/rounds';
import { en } from '../src/i18n/en';
import { ro } from '../src/i18n/ro';
import { ru } from '../src/i18n/ru';
import { uk } from '../src/i18n/uk';

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const allChoices = [...CHOICES.crossing, ...CHOICES.lost];

describe('вопросы', () => {
  it.each(allChoices.map((r) => [r.id, r] as const))('%s: есть верный и неверный ответ, id вариантов не повторяются', (_, r) => {
    expect(r.options.some((o) => o.ok)).toBe(true);
    expect(r.options.some((o) => !o.ok)).toBe(true);
    expect(new Set(r.options.map((o) => o.id)).size).toBe(r.options.length);
  });

  it('id вопросов уникальны, в каждой главе хватает вопросов', () => {
    expect(new Set(allChoices.map((r) => r.id)).size).toBe(allChoices.length);
    for (const c of CHAPTERS) if (c.id !== 'light') expect(CHOICES[c.id].length).toBeGreaterThanOrEqual(c.size);
  });

  it.each([['ru', ru], ['uk', uk], ['ro', ro], ['en', en]] as const)('%s: у каждой главы, сигнала, вопроса и варианта есть текст', (_, t) => {
    for (const c of CHAPTERS) expect(t.chapters[c.id] && t.chapterLead[c.id]).toBeTruthy();
    for (const l of LIGHTS) expect(t.lights[l]).toBeTruthy();
    for (const r of allChoices) {
      expect(t.rounds[r.id]?.q && t.rounds[r.id]?.rule).toBeTruthy();
      for (const o of r.options) expect(t.options[o.id], `${r.id}.${o.id}`).toBeTruthy();
    }
  });
});

describe('светофор', () => {
  it('идти можно только на зелёный', () => {
    expect(LIGHTS.filter(canGo)).toEqual(['green', 'walk']);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])('сигналы не повторяются подряд, есть «идём» и «стоим» (seed %i)', (seed) => {
    const seq = lightSequence(6, rng(seed));
    expect(seq).toHaveLength(6);
    expect(seq.some(canGo)).toBe(true);
    expect(seq.some((l) => !canGo(l))).toBe(true);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });

  it('ответ на сигнал', () => {
    expect(isRight({ kind: 'light', id: 'red' }, 'wait')).toBe(true);
    expect(isRight({ kind: 'light', id: 'red' }, 'go')).toBe(false);
    expect(isRight({ kind: 'light', id: 'walk' }, 'go')).toBe(true);
    expect(isRight({ kind: 'light', id: 'yellow' }, 'go')).toBe(false);
  });
});

describe('прохождение главы', () => {
  it('набор вопросов по размеру главы, варианты перемешаны, но те же', () => {
    for (const c of CHAPTERS) {
      const rounds = buildRounds(c.id, rng(3));
      expect(rounds).toHaveLength(c.size);
      expect(new Set(rounds.map((r) => r.id)).size).toBe(c.id === 'light' ? new Set(rounds.map((r) => r.id)).size : c.size);
    }
    const [round] = buildRounds('lost', rng(7));
    if (round.kind !== 'choice') throw new Error('ожидался вопрос с вариантами');
    const source = CHOICES.lost.find((r) => r.id === round.id)!;
    expect([...round.options].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...source.options].sort((a, b) => a.id.localeCompare(b.id)));
  });

  it('проверка варианта и звёзды', () => {
    const helper = CHOICES.lost.find((r) => r.id === 'helper')!;
    expect(isRight(helper, 'police')).toBe(true);
    expect(isRight(helper, 'cashier')).toBe(true);
    expect(isRight(helper, 'stranger')).toBe(false);
    expect(isRight(helper, 'nope')).toBe(false);
    expect([0, 1, 2, 3, 9].map(starsFor)).toEqual([3, 2, 2, 1, 1]);
  });
});

describe('прогресс', () => {
  it('хранит лучшие звёзды и «знатока дороги»', () => {
    let p = recordChapter(emptyProgress(), 'light', 2);
    p = recordChapter(p, 'light', 1);
    expect(p.stars.light).toBe(2);
    expect(isHero(p)).toBe(false);
    for (const c of CHAPTERS) p = recordChapter(p, c.id, 3);
    expect(isHero(p)).toBe(true);
    expect(readProgress({ stars: { light: 3, crossing: 7, lost: '2', nope: 3 } })).toEqual({ stars: { light: 3, lost: 2 } });
    expect(readProgress(null)).toEqual({ stars: {} });
  });
});
