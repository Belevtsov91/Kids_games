import { describe, expect, it } from 'vitest';
import { floodFill, lineMask } from '../src/engine/floodFill';

const white = (w: number, h: number) => new Uint8ClampedArray(w * h * 4).fill(255);
const rgb = (pixels: Uint8ClampedArray, index: number) => [...pixels.slice(index * 4, index * 4 + 3)];

describe('заливка раскраски', () => {
  it('красит связанную область и не пересекает чёрную стенку', () => {
    const pixels = white(5, 3);
    const mask = new Uint8Array([0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]);
    expect(floodFill(pixels, mask, 5, 3, 0, 1, [240, 50, 30])).toBe(6);
    expect(rgb(pixels, 5)).toEqual([240, 50, 30]);
    expect(rgb(pixels, 7)).toEqual([255, 255, 255]);
    expect(rgb(pixels, 8)).toEqual([255, 255, 255]);
  });
  it('не соединяет области через диагональное касание', () => {
    const pixels = white(2, 2);
    expect(floodFill(pixels, new Uint8Array([0, 1, 1, 0]), 2, 2, 0, 0, [10, 20, 30])).toBe(1);
    expect(rgb(pixels, 3)).toEqual([255, 255, 255]);
  });
  it('повтор тем же цветом и касание линии ничего не меняют', () => {
    const pixels = white(3, 1), mask = new Uint8Array([0, 1, 0]);
    expect(floodFill(pixels, mask, 3, 1, 1, 0, [1, 2, 3])).toBe(0);
    expect(floodFill(pixels, mask, 3, 1, 0, 0, [255, 255, 255])).toBe(0);
    expect([...pixels]).toEqual([...white(3, 1)]);
  });
  it('не переносит заливку с конца строки на начало следующей', () => {
    const pixels = white(3, 2), mask = new Uint8Array([1, 1, 0, 0, 1, 1]);
    expect(floodFill(pixels, mask, 3, 2, 2, 0, [1, 2, 3])).toBe(1);
    expect(rgb(pixels, 3)).toEqual([255, 255, 255]);
  });
  it('игнорирует координаты вне листа', () => {
    const pixels = white(2, 2), mask = new Uint8Array(4);
    for (const [x, y] of [[-1, 0], [2, 0], [0, -1], [0, 2]]) expect(floodFill(pixels, mask, 2, 2, x, y, [1, 2, 3])).toBe(0);
  });
  it('маска защищает тёмные контуры, белое и прозрачное остаются доступными', () => {
    expect([...lineMask(new Uint8ClampedArray([0, 0, 0, 255, 180, 180, 180, 255, 255, 255, 255, 255, 0, 0, 0, 0]))]).toEqual([1, 1, 0, 0]);
  });
});
