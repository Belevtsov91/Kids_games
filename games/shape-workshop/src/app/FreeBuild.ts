// Свободная мастерская: фигуры из палитры ставятся на холст, двигаются, меняют цвет и убираются за край.
import { FREE_MAX } from '../game/progress';
import { SHAPES, center, type Piece, type ShapeType } from '../game/shapes';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import { toBoard } from '../input/drag';
import { button, el } from '../ui/dom';
import { pieceIcon, pieceNode, svgEl } from '../ui/svg';

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f45', '#b07d52', '#2b2d42'];
const SIZE: Record<ShapeType, [number, number]> = {
  circle: [22, 22], oval: [30, 20], square: [22, 22], rect: [32, 16], triangle: [26, 24], semicircle: [28, 14], star: [24, 24],
};

export class FreeBuild {
  private readonly board = svgEl('svg', { viewBox: '0 0 100 100', class: 'sw-board sw-free' });
  private pieces: Piece[];

  constructor(stage: HTMLElement, saved: Piece[], private readonly sound: Sound, private readonly onChange: (pieces: Piece[]) => void) {
    this.pieces = saved.map((p) => ({ ...p }));
    const palette = el('div', 'sw-tray sw-palette');
    SHAPES.forEach((type, i) => {
      const [w, h] = SIZE[type];
      const sample: Piece = { type, x: 0, y: 0, w, h, color: COLORS[i % COLORS.length] };
      const b = button('sw-tray-piece', '', () => this.add(sample));
      b.append(pieceIcon(sample));
      b.setAttribute('aria-label', tr().shapes[type]);
      palette.append(b);
    });
    const clear = button('sw-btn sw-btn-soft sw-btn-small', tr().clear, () => this.update([]));
    const layout = el('div', 'sw-build');
    layout.append(this.board, palette, el('p', 'sw-tip', tr().freeTip), clear);
    stage.append(layout);
    this.draw();
  }

  private add(sample: Piece) {
    if (this.pieces.length >= FREE_MAX) return;
    this.sound.pick();
    this.sound.say(tr().shapes[sample.type]);
    const n = this.pieces.length % 5;
    this.update([...this.pieces, { ...sample, x: 50 - sample.w / 2 + n * 4, y: 50 - sample.h / 2 + n * 4 }]);
  }

  private update(pieces: Piece[]) {
    this.pieces = pieces;
    this.onChange(pieces);
    this.draw();
  }

  private draw() {
    this.board.replaceChildren();
    this.pieces.forEach((p, i) => {
      const node = pieceNode(p, 'sw-piece sw-movable');
      node.addEventListener('pointerdown', (e) => this.drag(e, i));
      this.board.append(node);
    });
  }

  /** Тащим фигуру; без движения — смена цвета; за краем холста — удаление. */
  private drag(e: PointerEvent, i: number) {
    e.preventDefault();
    const start = toBoard(this.board, e.clientX, e.clientY);
    const p0 = { ...this.pieces[i] };
    let moved = false;
    const node = e.currentTarget as SVGPathElement;
    const move = (ev: PointerEvent) => {
      const pt = toBoard(this.board, ev.clientX, ev.clientY);
      const dx = pt.x - start.x;
      const dy = pt.y - start.y;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      moved = true;
      const c = center(p0);
      node.setAttribute('transform', `translate(${dx} ${dy})${p0.rot ? ` rotate(${p0.rot} ${c.x} ${c.y})` : ''}`);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const pt = toBoard(this.board, ev.clientX, ev.clientY);
      const next = [...this.pieces];
      if (!moved) {
        next[i] = { ...p0, color: COLORS[(COLORS.indexOf(p0.color) + 1) % COLORS.length] };
        this.sound.pick();
      } else if (!pt.inside) {
        next.splice(i, 1);
        this.sound.drop();
      } else {
        next[i] = { ...p0, x: p0.x + pt.x - start.x, y: p0.y + pt.y - start.y };
      }
      this.update(next);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
}
