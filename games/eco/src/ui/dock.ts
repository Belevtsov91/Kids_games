// Нижняя панель: постройки с ценой, подсказка, «убрать всё» и большая кнопка «запустить сутки».
import { COST, type Tool } from '../game/types';
import { tr } from '../i18n';
import { COIN, toolSvg } from './art';
import { button, el, esc } from './dom';

export interface DockHandlers {
  onTool: (tool: Tool) => void;
  onHint: () => void;
  onClear: () => void;
  onRun: () => void;
}

export class Dock {
  readonly root = el('footer', 'eco-dock');
  private readonly toolButtons = new Map<Tool, HTMLButtonElement>();
  private readonly run: HTMLButtonElement;
  private readonly side: HTMLButtonElement[];

  constructor(tools: readonly Tool[], h: DockHandlers) {
    const t = tr();
    const palette = el('div', 'eco-palette');
    for (const tool of tools) {
      const b = el('button', 'eco-tool');
      b.type = 'button';
      b.title = t.tools[tool].about;
      b.innerHTML = `<span class="eco-tool-art">${toolSvg(tool)}</span><span class="eco-tool-name">${esc(t.tools[tool].name)}</span><span class="eco-tool-cost">${COIN} ${COST[tool]}</span>`;
      b.addEventListener('click', () => h.onTool(tool));
      this.toolButtons.set(tool, b);
      palette.appendChild(b);
    }
    const actions = el('div', 'eco-actions');
    this.side = [button('eco-btn eco-btn-ghost', `💡 ${t.hint}`, h.onHint), button('eco-btn eco-btn-ghost', t.clear, h.onClear)];
    this.run = button('eco-btn eco-btn-main eco-run', `▶ ${t.run}`, h.onRun);
    actions.append(...this.side, this.run);
    this.root.append(palette, actions);
  }

  select(tool: Tool | null) {
    for (const [name, b] of this.toolButtons) b.classList.toggle('is-active', name === tool);
  }

  /** Сколько монеток осталось: что не по карману, тускнеет. */
  afford(left: number) {
    for (const [name, b] of this.toolButtons) b.classList.toggle('is-poor', COST[name] > left);
  }

  /** Во время суток стройка закрыта, а кнопка запуска превращается в «быстрее». */
  running(on: boolean) {
    const t = tr();
    for (const b of [...this.toolButtons.values(), ...this.side]) b.disabled = on;
    this.run.textContent = on ? `⏩ ${t.skip}` : `▶ ${t.run}`;
  }
}
