// Сборка картинки по силуэту: фигуры из лотка перетаскивают (или касание «фигура → место») на свои места.
import type { Picture } from '../game/pictures';
import { center, findSlot, nearestSlot, type Piece } from '../game/shapes';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import { makeDraggable, toBoard } from '../input/drag';
import type { Confetti } from '../ui/Confetti';
import { el } from '../ui/dom';
import { pieceIcon, pieceNode, svgEl } from '../ui/svg';
import type { Timers } from './Timers';

export interface BuildDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onShape(ok: boolean): void;
  onDone(): void;
}

export class BuildRound {
  private readonly board = svgEl('svg', { viewBox: '0 0 100 100', class: 'sw-board', role: 'img' });
  private readonly tray = el('div', 'sw-tray');
  private readonly filled = new Set<number>();
  private readonly slotNodes: SVGPathElement[] = [];
  private readonly offs: (() => void)[] = [];
  private selected: { piece: Piece; btn: HTMLElement } | null = null;

  constructor(private readonly pic: Picture, private readonly d: BuildDeps) {
    pic.pieces.forEach((p, i) => {
      const slot = pieceNode(p, 'sw-slot');
      slot.addEventListener('click', () => this.tapSlot(i));
      this.slotNodes.push(slot);
      this.board.append(slot);
    });
    const order = pic.pieces.map((p, i) => ({ p, k: (i * 7919) % 13 })).sort((a, b) => a.k - b.k);
    for (const { p } of order) this.addToTray(p);
    const layout = el('div', 'sw-build');
    layout.append(this.board, this.tray);
    d.stage.append(layout);
    d.sound.say(tr().sayStart);
  }

  dispose() {
    this.offs.forEach((off) => off());
  }

  private addToTray(piece: Piece) {
    const btn = el('button', 'sw-tray-piece');
    btn.append(pieceIcon(piece));
    btn.setAttribute('aria-label', tr().shapes[piece.type]);
    this.offs.push(
      makeDraggable(btn, {
        ghost: () => {
          const g = el('div', 'sw-ghost-wrap');
          g.append(pieceIcon(piece));
          g.style.width = `${(Math.max(piece.w, piece.h) / 100) * this.board.getBoundingClientRect().width + 16}px`;
          return g;
        },
        start: () => this.select(null),
        tap: () => this.select({ piece, btn }),
        drop: (x, y) => {
          const pt = toBoard(this.board, x, y);
          if (pt.inside) this.tryPlace(piece, btn, pt);
        },
      }),
    );
    this.tray.append(btn);
  }

  private select(sel: { piece: Piece; btn: HTMLElement } | null) {
    this.selected?.btn.classList.remove('is-selected');
    this.selected = sel;
    sel?.btn.classList.add('is-selected');
    if (sel) {
      this.d.sound.pick();
      this.d.sound.say(tr().shapes[sel.piece.type]);
    }
  }

  private tapSlot(i: number) {
    if (!this.selected || this.filled.has(i)) return;
    const { piece, btn } = this.selected;
    this.tryPlace(piece, btn, center(this.pic.pieces[i]));
  }

  private tryPlace(piece: Piece, btn: HTMLElement, pt: { x: number; y: number }) {
    const i = findSlot(this.pic.pieces, this.filled, piece.type, pt);
    if (i === null) {
      const near = nearestSlot(this.pic.pieces, this.filled, pt);
      this.d.sound.wrong();
      this.d.onShape(false);
      this.d.timers.replayClass(btn, 'is-shake');
      if (near !== null) this.d.sound.say(tr().sayNeed(tr().shapes[this.pic.pieces[near].type], tr().shapes[piece.type]));
      return;
    }
    this.filled.add(i);
    this.select(null);
    btn.remove();
    const placed = pieceNode(this.pic.pieces[i], 'sw-piece sw-placed');
    this.slotNodes[i].replaceWith(placed);
    this.d.sound.correct();
    this.d.onShape(true);
    this.d.sound.say(tr().sayPlaced(tr().shapes[piece.type]));
    const r = this.board.getBoundingClientRect();
    const c = center(this.pic.pieces[i]);
    const o = this.d.confetti.canvas.getBoundingClientRect();
    this.d.confetti.sparkle(r.left + (c.x / 100) * r.width - o.left, r.top + (c.y / 100) * r.height - o.top, 12);
    if (this.filled.size === this.pic.pieces.length) {
      this.board.classList.add('is-done');
      this.d.timers.later(() => this.d.onDone(), 600);
    }
  }
}
