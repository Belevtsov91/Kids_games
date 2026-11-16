// Остров на экране: клетки травы, деревья, вода, посылки, друзья и робот,
// который плавно ездит по клеткам и показывает стрелкой, куда смотрит.
import { key, type Heading, type Island, type Pos } from '../game/map';
import { FRIEND_ART, HEART, PARCEL, ROBOT, TREE, WAVE } from './art';
import { el } from './dom';

const ANGLE: Record<Heading, number> = { n: 0, e: 90, s: 180, w: 270 };

export class Board {
  readonly node = el('div', 'rk-board');
  private readonly robot = el('div', 'rk-robot');
  private readonly facing = el('span', 'rk-facing');
  private readonly bag = el('b', 'rk-bag');
  private readonly parcels = new Map<string, HTMLElement>();
  private readonly friends: HTMLElement[] = [];
  private carry = 0;
  private turns = 0;

  constructor(private readonly island: Island) {
    this.node.style.setProperty('--rk-cols', String(island.width));
    this.node.style.setProperty('--rk-rows', String(island.height));
    this.node.setAttribute('aria-hidden', 'true');
    for (let y = 0; y < island.height; y++) {
      for (let x = 0; x < island.width; x++) {
        const k = key({ x, y });
        const water = island.water.has(k);
        const cell = el('div', `rk-cell${water ? ' is-water' : (x + y) % 2 ? ' is-alt' : ''}`);
        if (water) cell.append(el('span', 'rk-wave', WAVE));
        if (island.trees.has(k)) cell.append(el('span', 'rk-tree', TREE));
        this.node.append(cell);
      }
    }
    for (const p of island.parcels) {
      const parcel = el('span', 'rk-item rk-parcel', PARCEL);
      this.place(parcel, p);
      this.parcels.set(key(p), parcel);
      this.node.append(parcel);
    }
    for (const f of island.friends) {
      const friend = el('span', 'rk-item rk-friend', FRIEND_ART[f.id] ?? '🙂');
      friend.append(el('i', 'rk-heart', HEART));
      this.place(friend, f.pos);
      this.friends.push(friend);
      this.node.append(friend);
    }
    this.facing.append(el('i', 'rk-pointer'));
    this.robot.append(this.facing, el('span', 'rk-robot-face', ROBOT), this.bag);
    this.node.append(this.robot);
    this.reset();
  }

  /** Всё на старт: робот у почты, посылки на местах, друзья ждут. */
  reset() {
    this.robot.classList.remove('is-bump', 'is-happy');
    this.place(this.robot, this.island.start);
    this.turns = ANGLE[this.island.heading] / 90;
    this.facing.style.rotate = `${this.turns * 90}deg`;
    this.parcels.forEach((p) => p.classList.remove('is-picked'));
    this.friends.forEach((f) => f.classList.remove('is-served'));
    this.setCarry(0);
  }

  moveRobot(to: Pos) {
    this.place(this.robot, to);
  }

  /** Поворот всегда по короткой дуге: стрелка не крутится через полкруга. */
  face(h: Heading) {
    const target = ANGLE[h] / 90;
    let diff = (target - (this.turns % 4) + 4) % 4;
    if (diff === 3) diff = -1;
    this.turns += diff;
    this.facing.style.rotate = `${this.turns * 90}deg`;
  }

  pick(at: Pos) {
    this.parcels.get(key(at))?.classList.add('is-picked');
    this.setCarry(this.carry + 1);
  }

  deliver(friend: number) {
    this.friends[friend]?.classList.add('is-served');
    this.setCarry(this.carry - 1);
  }

  bump() {
    this.robot.classList.remove('is-bump');
    void this.robot.offsetWidth;
    this.robot.classList.add('is-bump');
  }

  celebrate() {
    this.robot.classList.add('is-happy');
  }

  /** Центр робота в координатах экрана — для искорок. */
  robotCenter() {
    const r = this.robot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  private setCarry(n: number) {
    this.carry = Math.max(0, n);
    this.bag.textContent = this.carry ? `${PARCEL}${this.carry > 1 ? this.carry : ''}` : '';
  }

  private place(node: HTMLElement, p: Pos) {
    node.style.setProperty('--rk-x', String(p.x));
    node.style.setProperty('--rk-y', String(p.y));
  }
}
