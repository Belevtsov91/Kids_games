// Программа робота на экране: команды и блоки с вложенными командами, палитра и кнопки.
// Блок, куда сейчас кладутся новые команды, подсвечен; нажатие на шапку блока выбирает его.
import { canNestBlock, isBlock, type Cmd, type Kind, type Path } from '../game/program';
import { tr } from '../i18n';
import { CMD_ART, COND_ART, timesArt } from './art';
import { button, el } from './dom';

export interface ProgramHandlers {
  add(kind: Kind): void;
  remove(path: Path): void;
  target(path: Path): void;
  cycle(path: Path): void;
  undo(): void;
  clear(): void;
  run(): void;
  hint(): void;
}

export interface RenderOpts {
  target: Path;
  /** Команда, которую робот выполняет сейчас. */
  active?: Path;
  busy?: boolean;
}

const same = (a: Path | undefined, b: Path) => a !== undefined && a.join() === b.join();
const BLOCKS: readonly Kind[] = ['loop', 'if'];

export class ProgramView {
  readonly node = el('section', 'rk-program');
  private readonly code = el('div', 'rk-code');
  private readonly counter = el('span', 'rk-counter');
  private readonly outBtn: HTMLButtonElement;
  private readonly palette = el('div', 'rk-palette');
  private readonly kinds: Kind[] = [];
  private readonly runBtn: HTMLButtonElement;

  constructor(private readonly slots: number, tools: readonly Kind[], private readonly h: ProgramHandlers) {
    this.code.setAttribute('role', 'list');
    for (const kind of tools) {
      const b = button(`rk-tool is-${kind}`, CMD_ART[kind], () => h.add(kind));
      b.setAttribute('aria-label', tr().cmd[kind]);
      this.palette.append(b);
      this.kinds.push(kind);
    }
    this.palette.style.setProperty('--rk-tools', String(tools.length));
    this.outBtn = button('rk-btn rk-btn-soft rk-btn-small', tr().toRoot, () => h.target([]));
    this.runBtn = button('rk-btn rk-btn-play', tr().run, () => h.run());
    const actions = el('div', 'rk-tools');
    actions.append(
      button('rk-btn rk-btn-soft rk-btn-icon', tr().undo, () => h.undo()),
      button('rk-btn rk-btn-soft rk-btn-icon', tr().clear, () => h.clear()),
      button('rk-btn rk-btn-soft rk-btn-icon', tr().hint, () => h.hint()),
      this.runBtn,
    );
    const head = el('div', 'rk-program-head');
    head.append(this.counter, this.outBtn);
    this.node.append(head);
    if (tools.some((t) => BLOCKS.includes(t))) this.node.append(el('small', 'rk-tip', tr().tipInside));
    this.node.append(this.code, this.palette, actions);
  }

  /** Подсветить команду в палитре — подсказка, какую положить следующей. */
  pointTo(kind: Kind | null) {
    [...this.palette.children].forEach((b, i) => b.classList.toggle('is-hint', this.kinds[i] === kind));
  }

  render(program: readonly Cmd[], opts: RenderOpts, used: number) {
    this.code.replaceChildren(...this.list(program, [], opts));
    this.code.classList.toggle('is-target', opts.target.length === 0);
    for (let i = used; i < this.slots; i++) this.code.append(el('span', 'rk-slot'));
    this.counter.textContent = tr().slots(used, this.slots);
    this.outBtn.hidden = opts.target.length === 0;
    [...this.palette.children].forEach((b, i) => {
      (b as HTMLButtonElement).disabled = BLOCKS.includes(this.kinds[i]) && !canNestBlock(opts.target);
    });
    this.node.classList.toggle('is-busy', Boolean(opts.busy));
    this.runBtn.disabled = Boolean(opts.busy) || program.length === 0;
  }

  private list(cmds: readonly Cmd[], prefix: Path, opts: RenderOpts): HTMLElement[] {
    return cmds.map((c, i) => {
      const path = [...prefix, i];
      const active = same(opts.active, path) ? ' is-active' : '';
      if (!isBlock(c)) {
        const chip = button(`rk-chip${active}`, CMD_ART[c.k], () => this.h.remove(path));
        chip.setAttribute('role', 'listitem');
        chip.setAttribute('aria-label', tr().cmd[c.k]);
        return chip;
      }
      const block = el('div', `rk-block is-${c.k}${active}${same(opts.target, path) ? ' is-target' : ''}`);
      block.setAttribute('role', 'listitem');
      const head = el('div', 'rk-block-head');
      const pick = button('rk-block-icon', CMD_ART[c.k], () => this.h.target(path));
      pick.setAttribute('aria-label', tr().cmd[c.k]);
      const label = c.k === 'loop' ? tr().times(c.n) : tr().cond[c.cond];
      const param = button('rk-block-param', c.k === 'loop' ? timesArt(c.n) : COND_ART[c.cond], () => this.h.cycle(path));
      param.setAttribute('aria-label', label);
      const del = button('rk-block-del', '✕', () => this.h.remove(path));
      del.setAttribute('aria-label', tr().removeBlock);
      head.append(pick, param, del);
      const body = el('div', 'rk-block-body');
      if (c.body.length) body.append(...this.list(c.body, path, opts));
      else body.append(el('small', 'rk-empty', tr().empty));
      block.append(head, body);
      return block;
    });
  }
}
