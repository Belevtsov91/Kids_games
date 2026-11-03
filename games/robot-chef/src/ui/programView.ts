// Программа робота: ряд стрелок, которые выложил ребёнок, и палитра для новых стрелок.
import { DIRS, type Dir } from '../game/grid';
import type { Command } from '../game/program';
import { tr } from '../i18n';
import { ARROW } from './art';
import { button, el } from './dom';

export interface ProgramHandlers {
  add(dir: Dir): void;
  tapCommand(index: number): void;
  undo(): void;
  clear(): void;
  run(): void;
  hint(): void;
}

export class ProgramView {
  readonly node = el('section', 'rc-program');
  private readonly row = el('div', 'rc-commands');
  private readonly counter = el('span', 'rc-counter');
  private readonly palette = el('div', 'rc-palette');
  private readonly runBtn: HTMLButtonElement;

  constructor(private readonly slots: number, repeat: boolean, private readonly h: ProgramHandlers) {
    this.row.setAttribute('role', 'list');
    for (const dir of DIRS) {
      const b = button('rc-arrow', ARROW[dir], () => h.add(dir));
      b.setAttribute('aria-label', tr().arrows[dir]);
      this.palette.append(b);
    }
    this.runBtn = button('rc-btn rc-btn-play', tr().run, () => h.run());
    const tools = el('div', 'rc-tools');
    tools.append(
      button('rc-btn rc-btn-soft rc-btn-icon', tr().undo, () => h.undo()),
      button('rc-btn rc-btn-soft rc-btn-icon', tr().clear, () => h.clear()),
      button('rc-btn rc-btn-soft rc-btn-icon', tr().hint, () => h.hint()),
      this.runBtn,
    );
    const head = el('div', 'rc-program-head');
    head.append(this.counter);
    if (repeat) head.append(el('small', 'rc-tip', tr().repeatTip));
    this.node.append(head, this.row, this.palette, tools);
  }

  /** Подсветить стрелку в палитре — подсказка, какую положить следующей. */
  pointTo(dir: Dir | null) {
    [...this.palette.children].forEach((b, i) => b.classList.toggle('is-hint', DIRS[i] === dir));
  }

  /** Перерисовать стрелки; `active` — команда, которую робот выполняет сейчас, `hint` — куда смотреть. */
  render(program: readonly Command[], opts: { active?: number; hint?: number; busy?: boolean } = {}) {
    this.row.replaceChildren();
    program.forEach((c, i) => {
      const chip = button(`rc-chip${i === opts.active ? ' is-active' : ''}${i === opts.hint ? ' is-hint' : ''}`, ARROW[c.dir], () => this.h.tapCommand(i));
      chip.setAttribute('role', 'listitem');
      chip.setAttribute('aria-label', `${tr().arrows[c.dir]}${c.times > 1 ? ` ×${c.times}` : ''}`);
      if (c.times > 1) chip.append(el('b', 'rc-times', `×${c.times}`));
      this.row.append(chip);
    });
    for (let i = program.length; i < this.slots; i++) {
      this.row.append(el('span', `rc-slot${i === opts.hint ? ' is-hint' : ''}`));
    }
    this.counter.textContent = tr().slots(program.length, this.slots);
    this.node.classList.toggle('is-busy', Boolean(opts.busy));
    this.runBtn.disabled = Boolean(opts.busy) || program.length === 0;
  }
}
