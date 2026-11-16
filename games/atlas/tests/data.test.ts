import { describe, expect, it } from 'vitest';
import { COUNTRIES, COUNTRY_IDS, LOOKALIKES, distance, country, inRegion } from '../src/game/countries';
import { FLAGS } from '../src/game/flags';
import { en } from '../src/dict/en';
import { ro } from '../src/dict/ro';
import { ru } from '../src/dict/ru';
import { uk } from '../src/dict/uk';
import { flagSvg, starPoints } from '../src/ui/flagSvg';

describe('страны и флаги', () => {
  it('каждая страна описана один раз, у каждой есть флаг', () => {
    expect(COUNTRIES.map((c) => c.id).sort()).toEqual([...COUNTRY_IDS].sort());
    for (const id of COUNTRY_IDS) expect(FLAGS[id].stripes.length).toBeGreaterThan(0);
  });

  it('дом — это Молдова, Украина и Румыния', () => {
    expect(inRegion('home').map((c) => c.id)).toEqual(['md', 'ua', 'ro']);
  });

  it('у каждой страны есть название и столица на всех языках', () => {
    for (const places of [ru, uk, ro, en]) {
      for (const id of COUNTRY_IDS) {
        const [name, capital] = places.countries[id];
        expect(name.trim()).not.toBe('');
        expect(capital.trim()).not.toBe('');
      }
    }
  });

  it('похожие флаги ссылаются на другие существующие страны', () => {
    for (const [id, list] of Object.entries(LOOKALIKES)) {
      for (const other of list!) {
        expect(other).not.toBe(id);
        expect(COUNTRY_IDS).toContain(other);
      }
    }
  });

  it('флаги Молдовы и Румынии различаются гербом', () => {
    expect(FLAGS.md.vertical && FLAGS.ro.vertical).toBe(true);
    expect(FLAGS.md.stripes).toHaveLength(FLAGS.ro.stripes.length);
    expect(FLAGS.md.extras?.length).toBeGreaterThan(0);
    expect(FLAGS.ro.extras).toBeUndefined();
  });

  it('SVG флага собирается для всех стран', () => {
    for (const id of COUNTRY_IDS) {
      const svg = flagSvg(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('undefined');
    }
  });

  it('звезда — десять вершин', () => {
    expect(starPoints(5, 5, 2).split(' ')).toHaveLength(10);
  });

  it('расстояние между столицами разумное', () => {
    expect(distance(country('md'), country('md'))).toBeCloseTo(0);
    const kyivChisinau = distance(country('ua'), country('md'));
    expect(kyivChisinau).toBeGreaterThan(2);
    expect(kyivChisinau).toBeLessThan(6);
    expect(distance(country('nz'), country('pt'))).toBeGreaterThan(150);
  });
});
