// Картинки по силуэту: от трёх фигур (домик) до восьми (замок). Координаты — 0…100.
import type { Piece } from './shapes';

export interface Picture {
  id: string;
  pieces: Piece[];
}

const RED = '#ff6b6b';
const BLUE = '#4d96ff';
const YELLOW = '#ffd93d';
const GREEN = '#6bcb77';
const PURPLE = '#c77dff';
const ORANGE = '#ff9f45';
const BROWN = '#b07d52';
const GREY = '#8d99ae';

export const PICTURES: readonly Picture[] = [
  { id: 'house', pieces: [
    { type: 'square', x: 28, y: 46, w: 44, h: 44, color: YELLOW },
    { type: 'triangle', x: 20, y: 14, w: 60, h: 32, color: RED },
    { type: 'rect', x: 43, y: 64, w: 14, h: 26, color: BROWN },
  ] },
  { id: 'tree', pieces: [
    { type: 'rect', x: 43, y: 62, w: 14, h: 30, color: BROWN },
    { type: 'triangle', x: 18, y: 14, w: 64, h: 50, color: GREEN },
    { type: 'circle', x: 74, y: 4, w: 20, h: 20, color: YELLOW },
  ] },
  { id: 'snowman', pieces: [
    { type: 'circle', x: 30, y: 54, w: 40, h: 40, color: '#e9f2ff' },
    { type: 'circle', x: 34, y: 24, w: 32, h: 32, color: '#e9f2ff' },
    { type: 'triangle', x: 38, y: 2, w: 24, h: 26, color: BLUE },
    { type: 'star', x: 76, y: 6, w: 18, h: 18, color: YELLOW },
  ] },
  { id: 'fish', pieces: [
    { type: 'oval', x: 26, y: 30, w: 50, h: 36, color: ORANGE },
    { type: 'triangle', x: 4, y: 34, w: 28, h: 28, rot: 90, color: ORANGE },
    { type: 'circle', x: 60, y: 40, w: 8, h: 8, color: '#2b2d42' },
    { type: 'semicircle', x: 40, y: 20, w: 22, h: 12, color: RED },
  ] },
  { id: 'rocket', pieces: [
    { type: 'rect', x: 39, y: 26, w: 22, h: 44, color: '#e9ecf5' },
    { type: 'triangle', x: 39, y: 6, w: 22, h: 20, color: RED },
    { type: 'triangle', x: 25, y: 52, w: 14, h: 20, color: BLUE },
    { type: 'triangle', x: 61, y: 52, w: 14, h: 20, color: BLUE },
    { type: 'circle', x: 43, y: 34, w: 14, h: 14, color: '#7fd3ff' },
    { type: 'triangle', x: 42, y: 72, w: 16, h: 20, rot: 180, color: ORANGE },
  ] },
  { id: 'car', pieces: [
    { type: 'rect', x: 10, y: 48, w: 80, h: 24, color: RED },
    { type: 'semicircle', x: 26, y: 24, w: 46, h: 24, color: RED },
    { type: 'square', x: 41, y: 31, w: 14, h: 14, color: '#7fd3ff' },
    { type: 'circle', x: 18, y: 62, w: 20, h: 20, color: '#2b2d42' },
    { type: 'circle', x: 62, y: 62, w: 20, h: 20, color: '#2b2d42' },
  ] },
  { id: 'boat', pieces: [
    { type: 'semicircle', x: 12, y: 60, w: 76, h: 26, rot: 180, color: BROWN },
    { type: 'rect', x: 47, y: 14, w: 6, h: 48, color: GREY },
    { type: 'triangle', x: 53, y: 16, w: 30, h: 40, color: '#ffffff' },
    { type: 'triangle', x: 20, y: 26, w: 26, h: 30, color: YELLOW },
    { type: 'star', x: 6, y: 4, w: 16, h: 16, color: YELLOW },
  ] },
  { id: 'cat', pieces: [
    { type: 'oval', x: 30, y: 52, w: 44, h: 40, color: PURPLE },
    { type: 'circle', x: 31, y: 18, w: 38, h: 38, color: PURPLE },
    { type: 'triangle', x: 30, y: 6, w: 14, h: 18, color: PURPLE },
    { type: 'triangle', x: 56, y: 6, w: 14, h: 18, color: PURPLE },
    { type: 'rect', x: 74, y: 56, w: 8, h: 32, rot: 20, color: PURPLE },
    { type: 'circle', x: 40, y: 30, w: 6, h: 6, color: '#2b2d42' },
    { type: 'circle', x: 54, y: 30, w: 6, h: 6, color: '#2b2d42' },
  ] },
  { id: 'robot', pieces: [
    { type: 'rect', x: 30, y: 40, w: 40, h: 34, color: GREY },
    { type: 'square', x: 36, y: 10, w: 28, h: 28, color: '#c3cad8' },
    { type: 'circle', x: 41, y: 18, w: 7, h: 7, color: BLUE },
    { type: 'circle', x: 52, y: 18, w: 7, h: 7, color: BLUE },
    { type: 'rect', x: 34, y: 74, w: 10, h: 20, color: '#5c6178' },
    { type: 'rect', x: 56, y: 74, w: 10, h: 20, color: '#5c6178' },
    { type: 'star', x: 43, y: 48, w: 14, h: 14, color: YELLOW },
  ] },
  { id: 'castle', pieces: [
    { type: 'rect', x: 22, y: 50, w: 56, h: 42, color: '#d8c3a5' },
    { type: 'rect', x: 8, y: 40, w: 20, h: 52, color: '#c9b08d' },
    { type: 'rect', x: 72, y: 40, w: 20, h: 52, color: '#c9b08d' },
    { type: 'triangle', x: 6, y: 18, w: 24, h: 22, color: BLUE },
    { type: 'triangle', x: 70, y: 18, w: 24, h: 22, color: BLUE },
    { type: 'semicircle', x: 40, y: 66, w: 20, h: 14, color: BROWN },
    { type: 'rect', x: 40, y: 80, w: 20, h: 12, color: BROWN },
    { type: 'star', x: 42, y: 26, w: 16, h: 16, color: YELLOW },
  ] },
];
