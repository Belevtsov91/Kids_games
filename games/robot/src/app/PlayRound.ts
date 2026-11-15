// Один уровень: ребёнок собирает программу, робот выполняет её по шагу. После двух неудач появляется подсказка.
import type { Sound } from '../audio/Sound';
import { hintFor } from '../game/hint';
import { introduces, type Level } from '../game/levels';
import * as P from '../game/program';
import { run, type Outcome, type Step } from '../game/run';
import { tr } from '../i18n';
import { Board } from '../ui/board';
import type { Confetti } from '../ui/Confetti';
import { el } from '../ui/dom';
import { ProgramView } from '../ui/programView';
import type { Timers } from './Timers';

const MOVE_MS = 380;
const CHECK_MS = 180;

export interface RoundDeps {
  stage: HTMLElement;
  sound: Sound;
  confetti: Confetti;
  timers: Timers;
  onWin(attempts: number): void;
}

export class PlayRound {
  private program: P.Cmd[] = [];
  private history: P.Cmd[][] = [];
  private target: P.Path = [];
  private attempts = 0;
  private fails = 0;
  private busy = false;
  private readonly board: Board;
  private readonly view: ProgramView;

  constructor(private readonly level: Level, private readonly d: RoundDeps) {
    this.board = new Board(level.island);
    this.view = new ProgramView(level.slots, level.tools, {
      add: (kind) => this.add(kind),
      remove: (path) => this.edit(() => ((this.program = P.remove(this.program, path)), (this.target = path.slice(0, -1)))),
      target: (path) => this.select(path),
      cycle: (path) => this.cycle(path),
      undo: () => this.history.length && this.edit(() => ((this.program = this.history.pop()!), (this.target = [])), false),
      clear: () => this.edit(() => ((this.program = []), (this.target = []))),
      run: () => this.run(),
      hint: () => this.hint(),
    });
    const layout = el('div', 'rk-play');
    layout.append(this.board.node, this.view.node);
    d.stage.append(layout);
    this.render();
    const intro = introduces(level.n);
    d.sound.say(intro === 'loop' ? tr().sayLoop : intro === 'if' ? tr().sayIf : level.n === 2 ? tr().sayTurn : tr().sayStart);
  }

  dispose() {
    this.busy = true;
  }

  private add(kind: P.Kind) {
    if (this.busy) return;
    if (P.size(this.program) >= this.level.slots) return this.d.sound.say(tr().sayFull);
    const cmd = P.make(kind);
    if (P.isBlock(cmd) && !P.canNestBlock(this.target)) return this.d.sound.say(tr().sayNoNest);
    this.d.sound.pick();
    this.edit(() => {
      const container = this.target.length ? P.at(this.program, this.target) : null;
      const index = container && P.isBlock(container) ? container.body.length : this.program.length;
      this.program = P.insert(this.program, this.target, cmd);
      if (P.isBlock(cmd)) this.target = [...this.target, index];
    });
  }

  private select(path: P.Path) {
    if (this.busy) return;
    this.d.sound.pick();
    this.target = this.target.join() === path.join() ? path.slice(0, -1) : path;
    this.render();
  }

  private cycle(path: P.Path) {
    const withUntil = this.level.tools.includes('if');
    this.d.sound.pick();
    this.edit(() => {
      this.program = P.update(this.program, path, (c) => {
        if (c.k === 'loop') c.n = P.nextTimes(c.n, withUntil);
        if (c.k === 'if') c.cond = P.flipCond(c.cond);
      });
    });
  }

  /** Любая правка: запоминаем прошлую программу для «↩», робот возвращается на старт. */
  private edit(change: () => void, remember = true) {
    if (this.busy) return;
    if (remember) this.history.push(this.program);
    change();
    this.board.reset();
    this.view.pointTo(null);
    this.render();
  }

  private render(active?: P.Path) {
    this.view.render(this.program, { target: this.target, active, busy: this.busy }, P.size(this.program));
  }

  private hint() {
    if (this.busy) return;
    const h = hintFor(this.level.sample, this.program);
    this.edit(() => ((this.program = h.program), (this.target = h.container)));
    this.view.pointTo(h.next);
    if (h.next) this.d.sound.say(tr().sayHint(tr().cmd[h.next]));
  }

  private run() {
    if (this.busy || !this.program.length) return;
    this.busy = true;
    this.attempts++;
    this.board.reset();
    this.view.pointTo(null);
    const result = run(this.level.island, this.program);
    let t = 0;
    for (const step of result.steps) {
      t += step.kind === 'check' ? CHECK_MS : MOVE_MS;
      this.d.timers.later(() => this.show(step), t);
    }
    this.d.timers.later(() => this.finish(result.outcome), t + MOVE_MS + 200);
  }

  private show(step: Step) {
    this.render(step.path);
    if (step.kind === 'bump') return this.board.bump();
    if (step.kind === 'turn') return this.board.face(step.heading);
    if (step.kind === 'check') return;
    this.board.moveRobot(step.to);
    this.d.sound.drop();
    if (step.picked) this.board.pick(step.to);
    if (step.delivered !== null) {
      this.board.deliver(step.delivered);
      this.d.sound.correct();
      this.d.sound.say(tr().sayDelivered(tr().friends[this.level.island.friends[step.delivered].id]));
    }
  }

  private finish(outcome: Outcome) {
    this.busy = false;
    this.render();
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
    this.d.sound.say(outcome === 'bump' ? tr().sayBump : outcome === 'too-long' ? tr().sayTooLong : tr().sayUndelivered);
    if (this.fails >= 2) this.view.pointTo(hintFor(this.level.sample, this.program).next);
  }
}
