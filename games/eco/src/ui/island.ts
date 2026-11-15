// Остров-сетка: клетки с рельефом, домами и постройками игрока. Во время суток — свет в окнах и лопасти.
import { buildable, mapSize, parseMap, type Hour } from '../game/sim';
import type { Cell, Layout, Level } from '../game/types';
import { tr } from '../i18n';
import { houseSvg, toolSvg } from './art';
import { el } from './dom';

const TREE = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="46" y="60" width="8" height="24" rx="3" fill="#8a5a3c"/><circle cx="50" cy="46" r="22" fill="#5cbf5a"/><circle cx="36" cy="58" r="14" fill="#4fae4f"/><circle cx="64" cy="58" r="14" fill="#68c965"/></svg>`;

export class Island {
  readonly root = el('div', 'eco-island');
  private readonly tiles: HTMLButtonElement[] = [];
  private readonly cells: Cell[];

  constructor(
    level: Level,
    onTap: (index: number) => void,
  ) {
    this.cells = parseMap(level.map);
    const { cols } = mapSize(level.map);
    this.root.style.setProperty('--cols', String(cols));
    const t = tr();
    this.cells.forEach((cell, i) => {
      const tile = el('button', `eco-tile eco-t-${cell.terrain}`);
      tile.type = 'button';
      if (cell.house) {
        tile.classList.add('eco-has-house');
        tile.innerHTML = `<span class="eco-thing">${houseSvg(cell.house, i)}</span>`;
        tile.setAttribute('aria-label', t.houses[cell.house]);
      } else if (cell.terrain === 'grove') {
        tile.innerHTML = `<span class="eco-deco">${TREE}</span>`;
      }
      if (cell.terrain !== 'grass') tile.title = t.terrain[cell.terrain as 'hill' | 'grove' | 'water'] ?? '';
      tile.addEventListener('click', () => onTap(i));
      this.tiles.push(tile);
      this.root.appendChild(tile);
    });
  }

  cell(index: number) {
    return this.cells[index];
  }

  canBuild(index: number) {
    return buildable(this.cells[index]);
  }

  /** Перерисовать постройки игрока. */
  render(layout: Layout) {
    const t = tr();
    this.tiles.forEach((tile, i) => {
      if (!this.canBuild(i)) return;
      tile.querySelector('.eco-thing')?.remove();
      const tool = layout[i];
      tile.classList.toggle('eco-built', !!tool);
      tile.dataset.tool = tool ?? '';
      if (tool) {
        tile.insertAdjacentHTML('beforeend', `<span class="eco-thing eco-${tool}">${toolSvg(tool)}</span>`);
        tile.setAttribute('aria-label', t.tools[tool].name);
      } else {
        tile.removeAttribute('aria-label');
      }
    });
  }

  /** Состояние часа: окна горят или погасли, лопасти крутятся по ветру, батареи показывают заряд. */
  show(hour: Hour | null, capacity: number, windSpeed: number) {
    const night = hour ? hour.clock < 7 || hour.clock >= 18 : false;
    this.root.classList.toggle('eco-night', night);
    this.root.classList.toggle('eco-blackout', !!hour && hour.missing > 0);
    this.root.style.setProperty('--spin', windSpeed > 0 ? `${(2.4 / windSpeed).toFixed(2)}s` : '0s');
    this.root.classList.toggle('eco-calm', windSpeed <= 0);
    const level = !hour ? 1 : capacity > 0 ? hour.charge / capacity : 0;
    this.root.style.setProperty('--charge', level.toFixed(2));
  }

  flash(index: number) {
    const tile = this.tiles[index];
    tile.classList.remove('eco-nope');
    void tile.offsetWidth;
    tile.classList.add('eco-nope');
  }
}
