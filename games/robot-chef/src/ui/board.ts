// Кухня на экране: клетки, столы, продукты, кастрюля и робот, который плавно ездит по клеткам.
import { key, type Kitchen, type Pos } from '../game/grid';
import { CRATE, FOOD_ART, POT, ROBOT } from './art';
import { el } from './dom';

export class Board {
  readonly node = el('div', 'rc-board');
  private readonly robot = el('div', 'rc-robot', ROBOT);
  private readonly foods = new Map<string, HTMLElement>();
  private readonly potCell: HTMLElement;

  constructor(private readonly kitchen: Kitchen) {
    this.node.style.setProperty('--rc-cols', String(kitchen.width));
    this.node.style.setProperty('--rc-rows', String(kitchen.height));
    this.node.setAttribute('aria-hidden', 'true');
    let pot: HTMLElement | null = null;
    for (let y = 0; y < kitchen.height; y++) {
      for (let x = 0; x < kitchen.width; x++) {
        const k = key({ x, y });
        const cell = el('div', `rc-cell${(x + y) % 2 ? ' is-alt' : ''}`);
        if (kitchen.walls.has(k)) cell.append(el('span', 'rc-crate', CRATE));
        if (k === key(kitchen.pot)) {
          cell.append(el('span', 'rc-pot', POT));
          pot = cell;
        }
        this.node.append(cell);
      }
    }
    this.potCell = pot!;
    for (const f of kitchen.food) {
      const food = el('span', 'rc-food', FOOD_ART[f.id] ?? '❓');
      this.place(food, f.pos);
      this.foods.set(key(f.pos), food);
      this.node.append(food);
    }
    this.node.append(this.robot);
    this.reset();
  }

  /** Всё на старт: робот у входа, продукты на местах. */
  reset() {
    this.robot.classList.remove('is-bump', 'is-happy');
    this.place(this.robot, this.kitchen.start);
    this.foods.forEach((f) => f.classList.remove('is-picked'));
    this.potCell.classList.remove('is-done');
  }

  moveRobot(to: Pos) {
    this.place(this.robot, to);
  }

  pick(at: Pos) {
    this.foods.get(key(at))?.classList.add('is-picked');
  }

  bump() {
    this.robot.classList.remove('is-bump');
    void this.robot.offsetWidth;
    this.robot.classList.add('is-bump');
  }

  celebrate() {
    this.robot.classList.add('is-happy');
    this.potCell.classList.add('is-done');
  }

  /** Центр робота в координатах экрана — для искорок. */
  robotCenter() {
    const r = this.robot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  private place(node: HTMLElement, p: Pos) {
    node.style.setProperty('--rc-x', String(p.x));
    node.style.setProperty('--rc-y', String(p.y));
  }
}
