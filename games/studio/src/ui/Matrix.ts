import { PAD_LIST, ROW_COLORS } from '../game/kit';
import { hasStep, STEPS, type Pattern } from '../game/pattern';
import { tr } from '../i18n';
import { el } from './dom';

// Редактор шагов: 16 дорожек × 16 шагов. Каждая клетка — кнопка; столбец, что звучит, подсвечен.

export class Matrix {
  readonly el = el('div', { className: 'st-matrix' });
  private readonly title = el('p', { className: 'st-track' });
  private readonly rows: HTMLElement[] = [];
  private readonly cells: HTMLButtonElement[][] = [];
  private playhead = -1;

  constructor(
    onToggle: (pad: number, step: number) => void,
    private readonly onSelect: (pad: number) => void,
  ) {
    const t = tr();
    const grid = el('div', { className: 'st-grid', attrs: { role: 'grid' } });
    for (const pad of PAD_LIST) {
      const name = t.pads[pad.index]!;
      const label = el('button', { type: 'button', className: 'st-row-label', title: name }, name);
      label.addEventListener('click', () => this.onSelect(pad.index));
      const cells = Array.from({ length: STEPS }, (_, step) => {
        const cell = el('button', {
          type: 'button',
          className: 'st-cell',
          dataset: { beat: String(step % 4 === 0) },
          attrs: { 'aria-label': t.cell(name, step + 1, false), 'aria-pressed': 'false' },
        });
        cell.addEventListener('click', () => onToggle(pad.index, step));
        return cell;
      });
      const row = el('div', { className: 'st-row', attrs: { role: 'row', style: `--pad:${ROW_COLORS[pad.row]}` } }, label, ...cells);
      this.rows.push(row);
      this.cells.push(cells);
      grid.append(row);
    }
    const numbers = el('div', { className: 'st-row st-numbers', attrs: { 'aria-hidden': 'true' } }, el('span'));
    for (let s = 0; s < STEPS; s++) numbers.append(el('span', { dataset: { beat: String(s % 4 === 0) } }, String(s + 1)));
    this.el.append(this.title, numbers, grid);
  }

  render(pattern: Pattern) {
    const t = tr();
    this.cells.forEach((cells, pad) =>
      cells.forEach((cell, step) => {
        const on = hasStep(pattern, pad, step);
        if (cell.classList.contains('is-on') === on) return;
        cell.classList.toggle('is-on', on);
        cell.setAttribute('aria-pressed', String(on));
        cell.setAttribute('aria-label', t.cell(t.pads[pad]!, step + 1, on));
      }),
    );
  }

  select(pad: number) {
    this.rows.forEach((row, i) => row.classList.toggle('is-selected', i === pad));
    this.title.textContent = tr().track(tr().pads[pad]!);
  }

  /** Подсветка шага, который звучит; -1 — секвенсор стоит. */
  setPlayhead(step: number) {
    if (step === this.playhead) return;
    for (const cells of this.cells) {
      cells[this.playhead]?.classList.remove('is-now');
      cells[step]?.classList.add('is-now');
    }
    this.playhead = step;
  }
}
