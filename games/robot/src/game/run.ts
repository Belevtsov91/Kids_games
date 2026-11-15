// Исполнитель программы: проходит команды, двигает робота по острову и записывает каждый шаг,
// чтобы экран потом проиграл их по очереди. Без DOM — покрыто тестами.
import { ahead, isFree, key, turn, type Heading, type Island, type Pos } from './map';
import { UNTIL_DONE, type Cmd, type Path } from './program';

export type Step =
  | { kind: 'move'; path: Path; to: Pos; picked: boolean; delivered: number | null }
  | { kind: 'turn'; path: Path; heading: Heading }
  | { kind: 'check'; path: Path; ok: boolean }
  | { kind: 'bump'; path: Path };

/** win — всё доставлено; bump — упёрся; undelivered — команды кончились раньше; too-long — бесконечный круг. */
export type Outcome = 'win' | 'bump' | 'undelivered' | 'too-long';

export interface RunResult {
  steps: Step[];
  outcome: Outcome;
}

/** Предел действий за один запуск: «повторяй, пока не доставлю» без выхода не повесит игру. */
export const MAX_TICKS = 400;

class Runner {
  readonly steps: Step[] = [];
  outcome: Outcome | null = null;
  private pos: Pos;
  private heading: Heading;
  private carry = 0;
  private ticks = 0;
  private readonly picked = new Set<string>();
  private readonly served = new Set<number>();

  constructor(private readonly map: Island) {
    this.pos = map.start;
    this.heading = map.heading;
  }

  exec(list: readonly Cmd[], prefix: Path) {
    for (let i = 0; i < list.length && !this.outcome; i++) {
      const cmd = list[i];
      const path = [...prefix, i];
      if (!this.tick()) return;
      if (cmd.k === 'fwd') this.forward(path);
      else if (cmd.k === 'left' || cmd.k === 'right') {
        this.heading = turn(this.heading, cmd.k);
        this.steps.push({ kind: 'turn', path, heading: this.heading });
      } else if (cmd.k === 'if') {
        const ok = this.wallAhead() === (cmd.cond === 'wall');
        this.steps.push({ kind: 'check', path, ok });
        if (ok) this.exec(cmd.body, path);
      } else {
        for (let n = 0; (cmd.n === UNTIL_DONE || n < cmd.n) && !this.outcome; n++) {
          this.exec(cmd.body, path);
          if (!this.tick()) return;
        }
      }
    }
  }

  private tick() {
    if (++this.ticks > MAX_TICKS) this.outcome = 'too-long';
    return !this.outcome;
  }

  private wallAhead() {
    return !isFree(this.map, ahead(this.pos, this.heading));
  }

  private forward(path: Path) {
    const to = ahead(this.pos, this.heading);
    if (!isFree(this.map, to)) {
      this.steps.push({ kind: 'bump', path });
      this.outcome = 'bump';
      return;
    }
    this.pos = to;
    const k = key(to);
    const picked = this.map.parcels.some((p) => key(p) === k) && !this.picked.has(k);
    if (picked) {
      this.picked.add(k);
      this.carry++;
    }
    const friend = this.map.friends.findIndex((f, i) => key(f.pos) === k && !this.served.has(i));
    const delivered = friend >= 0 && this.carry > 0 ? friend : null;
    if (delivered !== null) {
      this.served.add(delivered);
      this.carry--;
    }
    this.steps.push({ kind: 'move', path, to, picked, delivered });
    if (this.served.size === this.map.friends.length) this.outcome = 'win';
  }
}

export function run(map: Island, program: readonly Cmd[]): RunResult {
  const r = new Runner(map);
  r.exec(program, []);
  return { steps: r.steps, outcome: r.outcome ?? 'undelivered' };
}
