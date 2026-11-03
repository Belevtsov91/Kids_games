import { expect, it } from 'vitest';
import { closeLineGaps } from '../src/engine/closeLineGaps';
import { floodFill } from '../src/engine/floodFill';

it('замыкает разрыв в границе: соседний сегмент больше не закрашивается', () => {
  const width = 24, height = 24;
  const mask = new Uint8Array(width * height);
  // Two halves of a framed page, with a four-pixel break in the divider.
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1 || (x === 12 && (y < 10 || y > 13))) mask[y * width + x] = 1;
  }
  const leaky = new Uint8ClampedArray(width * height * 4).fill(255);
  floodFill(leaky, mask, width, height, 5, 12, [240, 30, 20]);
  expect(leaky[(12 * width + 18) * 4]).toBe(240);
  const closed = closeLineGaps(mask, width, height);
  const fixed = new Uint8ClampedArray(width * height * 4).fill(255);
  floodFill(fixed, closed, width, height, 5, 12, [240, 30, 20]);
  expect(fixed[(12 * width + 5) * 4]).toBe(240);
  expect(fixed[(12 * width + 18) * 4]).toBe(255);
});

it('сохраняет целые линии и широкие намеренные проёмы', () => {
  const width = 50, height = 30, mask = new Uint8Array(width * height);
  for (let x = 3; x < 47; x++) if (x < 10 || x > 35) mask[15 * width + x] = 1;
  const result = closeLineGaps(mask, width, height);
  expect(result[15 * width + 25]).toBe(0);
  for (let i = 0; i < mask.length; i++) if (mask[i]) expect(result[i]).toBe(1);
});

it('не утолщает целые контуры и не заполняет маленькие замкнутые детали', () => {
  const width = 24, height = 24, mask = new Uint8Array(width * height);
  for (let y = 4; y <= 18; y++) for (let x = 4; x <= 18; x++) if (x === 4 || x === 18 || y === 4 || y === 18) mask[y * width + x] = 1;
  expect([...closeLineGaps(mask, width, height)]).toEqual([...mask]);
});
