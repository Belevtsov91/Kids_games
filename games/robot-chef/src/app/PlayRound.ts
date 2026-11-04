// Один уровень: ребёнок выкладывает стрелки, робот выполняет их по шагу. После двух неудач появляется подсказка.
import type { Level } from '../game/levels';
import { expand, nextTimes, type Command } from '../game/program';
import { simulate } from '../game/simulate';
import { hintFor, solve } from '../game/solver';
import type { Dir } from '../game/grid';
import type { Sound } from '../audio/Sound';
import { tr } from '../i18n';
import { Board } from '../ui/board';
import type { Confetti } from '../ui/Confetti';
import { el } from '../ui/dom';
import { ProgramView } from '../ui/programView';
import type { Timers } from './Timers';

const STEP_MS = 420;

export interface RoundDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onWin(attempts: number): void;
}

export class PlayRound {
  private program: Command[] = [];
  private attempts = 0;
  private fails = 0;
  private busy = false;
  private readonly board: Board;
  private readonly view: ProgramView;
  private readonly solution: Dir[];

  constructor(private readonly level: Level, private readonly d: RoundDeps) {
    this.solution = solve(level.kitchen) ?? [];
    this.board = new Board(level.kitchen);
    this.view = new ProgramView(level.slots, level.repeat, {
      add: (dir) => this.add(dir),
      tapCommand: (i) => this.tapCommand(i),
      undo: () => this.edit(() => this.program.pop()),
      clear: () => this.edit(() => (this.program = [])),
      run: () => this.run(),
      hint: () => this.hint(),
    });
    const layout = el('div', 'rc-play');
    layout.append(this.board.node, this.view.node);
    d.stage.append(layout);
    this.view.render(this.program);
    d.sound.say(level.n === 7 ? tr().sayRepeat : tr().sayStart);
  }

  dispose() {
    this.busy = true;
  }

  private add(dir: Dir) {
    if (this.busy) return;
    if (this.program.length >= this.level.slots) return this.d.sound.say(tr().sayFull);
    this.d.sound.pick();
    this.edit(() => this.program.push({ dir, times: 1 }));
  }

  private tapCommand(i: number) {
    if (this.busy) return;
    const c = this.program[i];
    if (!c) return;
    if (!this.level.repeat) return this.edit(() => this.program.splice(i, 1));
    this.d.sound.pick();
    this.edit(() => (c.times = nextTimes(c.times)));
  }

  private edit(change: () => void) {
    if (this.busy) return;
    change();
    this.board.reset();
    this.view.pointTo(null);
    this.view.render(this.program);
  }

  private hint() {
    if (this.busy) return;
    const { keep, next } = hintFor(this.solution, this.program);
    this.program = this.program.slice(0, keep);
    this.board.reset();
    this.view.render(this.program, { hint: keep });
    this.view.pointTo(next);
    if (next) this.d.sound.say(tr().sayHint(tr().arrows[next]));
  }

  private run() {
    if (this.busy || !this.program.length) return;
    this.busy = true;
    this.attempts++;
    this.board.reset();
    this.view.pointTo(null);
    const steps = expand(this.program);
    const owner = this.program.flatMap((c, i) => Array<number>(c.times).fill(i));
    const result = simulate(this.level.kitchen, steps);
    result.events.forEach((ev, n) => {
      this.d.timers.later(() => {
        this.view.render(this.program, { active: owner[n], busy: true });
        if (ev.kind === 'bump') return this.board.bump();
        this.board.moveRobot(ev.to);
        this.d.sound.drop();
        if (ev.picked) {
          this.board.pick(ev.to);
          this.d.sound.correct();
        }
      }, (n + 1) * STEP_MS);
    });
    this.d.timers.later(() => this.finish(result.outcome), (result.events.length + 1) * STEP_MS + 200);
  }

  private finish(outcome: ReturnType<typeof simulate>['outcome']) {
    this.busy = false;
    this.view.render(this.program);
    if (outcome === 'win') {
      this.busy = true;
      this.board.celebrate();
      const c = this.board.robotCenter();
      const r = this.d.confetti.canvas.getBoundingClientRect();
      this.d.confetti.sparkle(c.x - r.left, c.y - r.top);
      return this.d.onWin(this.attempts);
    }
    this.fails++;
    this.d.sound.wrong();
    this.d.sound.say(outcome === 'bump' ? tr().sayBump : outcome === 'missing-food' ? tr().sayMissing : tr().sayNotPot);
    if (this.fails >= 2) this.view.pointTo(hintFor(this.solution, this.program).next);
  }
}
