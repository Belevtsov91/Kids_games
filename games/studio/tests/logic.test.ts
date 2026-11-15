import { describe, expect, it } from 'vitest';
import { PAD_LIST, padByKey } from '../src/game/kit';
import {
  clampBpm, emptyPattern, fromSteps, hasStep, isPattern, noteCount, padsAt, rowsUsed,
  sanitizeGroove, setStep, toggleStep, toSteps, BPM_DEFAULT, MAX_MASK,
} from '../src/game/pattern';
import { PRESET_IDS, preset } from '../src/game/presets';
import { playStickers } from '../src/game/stickers';
import { barSeconds, quantize, stepSeconds, swingOffset } from '../src/game/timing';

describe('ритм', () => {
  it('включает и выключает шаги, не трогая другие пэды', () => {
    let p = toggleStep(emptyPattern(), 3, 15);
    expect(hasStep(p, 3, 15)).toBe(true);
    expect(p[3]).toBe(1 << 15);
    p = setStep(p, 0, 0, true);
    expect(padsAt(p, 0)).toEqual([0]);
    expect(padsAt(p, 15)).toEqual([3]);
    p = toggleStep(p, 3, 15);
    expect(hasStep(p, 3, 15)).toBe(false);
    expect(noteCount(p)).toBe(1);
  });

  it('строки шагов и маски переводятся туда и обратно', () => {
    const s = 'x...x...x.x.x..x';
    expect(toSteps(fromSteps(s))).toBe(s);
    expect(fromSteps('x'.repeat(16))).toBe(MAX_MASK);
  });

  it('считает задействованные ряды', () => {
    let p = setStep(emptyPattern(), 0, 0, true);
    p = setStep(p, 5, 0, true);
    expect(rowsUsed(p)).toBe(2);
    p = setStep(setStep(p, 9, 2, true), 14, 4, true);
    expect(rowsUsed(p)).toBe(4);
  });

  it('проверяет форму ритма и чинит битые черновики', () => {
    expect(isPattern(emptyPattern())).toBe(true);
    expect(isPattern([1, 2])).toBe(false);
    expect(isPattern(Array(16).fill(MAX_MASK + 1))).toBe(false);
    expect(sanitizeGroove({ bpm: 999, swing: -1, pattern: 'x' })).toEqual({ bpm: 180, swing: 0, pattern: emptyPattern() });
    expect(sanitizeGroove(null).bpm).toBe(BPM_DEFAULT);
    expect(clampBpm(10)).toBe(60);
  });
});

describe('время', () => {
  it('шаг — шестнадцатая: при 120 BPM такт длится 2 секунды', () => {
    expect(stepSeconds(120)).toBeCloseTo(0.125);
    expect(barSeconds(120)).toBeCloseTo(2);
  });

  it('свинг сдвигает только нечётные шаги', () => {
    expect(swingOffset(0, 120, 0.5)).toBe(0);
    expect(swingOffset(1, 120, 0.5)).toBeCloseTo(0.0625);
  });

  it('запись с пэда попадает в ближайший шаг', () => {
    expect(quantize(4, 0.02, 120)).toBe(4);
    expect(quantize(4, 0.1, 120)).toBe(5);
    expect(quantize(15, 0.1, 120)).toBe(0);
  });
});

describe('пульт и заготовки', () => {
  it('16 пэдов, 4 ряда по 4, у каждого своя клавиша', () => {
    expect(PAD_LIST).toHaveLength(16);
    expect(new Set(PAD_LIST.map((p) => p.key)).size).toBe(16);
    expect(PAD_LIST.filter((p) => p.row === 'bass')).toHaveLength(4);
    expect(padByKey('Q')?.index).toBe(4);
  });

  it.each(PRESET_IDS)('заготовка %s корректна и звучит', (id) => {
    const g = preset(id);
    expect(isPattern(g.pattern)).toBe(true);
    expect(clampBpm(g.bpm)).toBe(g.bpm);
    expect(noteCount(g.pattern)).toBeGreaterThan(8);
  });

  it('наклейки за игру', () => {
    expect(playStickers({ bpm: 100, swing: 0, pattern: emptyPattern() })).toEqual([]);
    expect(playStickers(preset('basic'))).toEqual(['first-beat']);
    const full = setStep(setStep(preset('basic').pattern, 9, 0, true), 13, 0, true);
    expect(playStickers({ bpm: 150, swing: 0, pattern: full })).toEqual(['first-beat', 'full-band', 'speedy']);
  });
});
