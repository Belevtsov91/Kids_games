// Экран района: стройка на острове, прогноз, запуск суток и итог.
import type { GameSdk } from '@ig/sdk';
import type { Sfx } from '../audio/Sfx';
import { simulate, spent, type DayResult } from '../game/sim';
import { cheapest, starsFor } from '../game/solver';
import { COST, TOOLS, WIND, type Layout, type Level, type Tool } from '../game/types';
import { tr } from '../i18n';
import { bearSvg, COIN } from '../ui/art';
import { chartSvg } from '../ui/chart';
import { Dock } from '../ui/dock';
import { button, el, esc } from '../ui/dom';
import { Meter, Sky } from '../ui/hud';
import { Island } from '../ui/island';
import { renderResult } from '../ui/result';
import { Playback } from './playback';

export interface LevelEvents {
  onWin: (stars: number, cost: number, result: DayResult) => void;
  onFail: () => void;
  onNext: () => void;
  onMenu: () => void;
  hasNext: boolean;
}

export class LevelScreen {
  readonly root = el('div', 'eco-screen eco-play');
  private layout: Layout = {};
  private tool: Tool | null;
  private readonly island: Island;
  private readonly sky = new Sky();
  private readonly meter = new Meter();
  private readonly dock: Dock;
  private readonly chart = el('div', 'eco-chart-box');
  private readonly bubble = el('p', 'eco-bubble');
  private readonly bear = el('div', 'eco-bear');
  private readonly coins = el('span', 'eco-coins');
  private result: DayResult;
  private playback: Playback | null = null;
  private revealed = false;

  constructor(
    private readonly level: Level,
    private readonly sdk: GameSdk,
    private readonly sfx: Sfx,
    private readonly events: LevelEvents,
  ) {
    const t = tr();
    this.tool = level.tools[0] ?? null;
    this.island = new Island(level, (i) => this.tap(i));
    this.dock = new Dock(level.tools, {
      onTool: (tool) => this.select(tool),
      onHint: () => this.hint(),
      onClear: () => this.change({}),
      onRun: () => (this.playback?.isRunning ? this.playback.hurry() : this.run()),
    });
    this.result = simulate(level, this.layout);

    const text = t.levels[level.key];
    const bar = el('header', 'eco-bar');
    const chips = `<span class="eco-chip">☀️ ${esc(level.sun >= 1 ? t.sky.sunny : t.sky.cloudy)}</span><span class="eco-chip">🌬️ ${esc(t.winds[level.wind])}</span>`;
    bar.append(button('eco-btn eco-btn-ghost', `← ${t.back}`, () => this.events.onMenu()), el('h2', 'eco-level-title', `${level.id}. ${esc(text?.name ?? level.key)}`), el('div', 'eco-chips', chips), this.coins);

    const world = el('div', 'eco-world');
    world.append(this.sky.root, this.island.root);
    const talk = el('div', 'eco-talk');
    talk.append(this.bear, this.bubble);
    const side = el('aside', 'eco-side');
    side.append(talk, this.meter.root, this.chart);
    const main = el('div', 'eco-main');
    main.append(world, side);
    this.root.append(bar, main, this.dock.root);

    this.say(`${text?.goal ?? ''} ${t.bear.pickTool}`);
    this.select(this.tool);
    this.change({});
  }

  private get left() {
    return this.level.budget - spent(this.layout, COST);
  }

  private say(text: string, mood: 'happy' | 'worry' = 'happy') {
    this.bubble.textContent = text;
    this.bear.innerHTML = bearSvg(mood);
  }

  private select(tool: Tool | null) {
    this.tool = tool;
    this.dock.select(tool);
  }

  private tap(index: number) {
    if (this.playback?.isRunning) return;
    this.sfx.unlock();
    const t = tr();
    if (!this.island.canBuild(index)) return this.refuse(index, t.bear.cantBuild);
    if (this.layout[index]) {
      const next = { ...this.layout };
      delete next[index];
      this.sfx.remove();
      return this.change(next);
    }
    if (!this.tool) return this.refuse(index, t.bear.noTool);
    if (COST[this.tool] > this.left) return this.refuse(index, t.bear.noCoins);
    this.sfx.place();
    this.change({ ...this.layout, [index]: this.tool });
  }

  private refuse(index: number, text: string) {
    this.sfx.nope();
    this.island.flash(index);
    this.say(text);
  }

  /** Новая расстановка: пересчитать прогноз, монетки, сбросить показ суток. */
  private change(layout: Layout) {
    this.layout = layout;
    this.revealed = false;
    this.result = simulate(this.level, layout);
    this.island.render(layout);
    this.island.show(null, this.result.capacity, 0);
    this.sky.show(12, false);
    this.meter.show(null, this.result.capacity);
    this.coins.innerHTML = `${COIN} <b>${this.left}</b> / ${this.level.budget}`;
    this.dock.afford(this.left);
    this.drawChart(-1);
  }

  private drawChart(cursor: number) {
    const t = tr();
    const legend = `<div class="eco-legend"><i class="sun"></i>${esc(t.legend.sun)}<i class="wind"></i>${esc(t.legend.wind)}<i class="demand"></i>${esc(t.legend.demand)}${this.revealed && this.result.capacity ? `<i class="charge"></i>${esc(t.legend.charge)}` : ''}</div>`;
    this.chart.innerHTML = `<div class="eco-chart-title">${esc(t.forecast)}</div>${chartSvg({ result: this.result, cursor, revealed: this.revealed }, t)}${legend}`;
  }

  private hint() {
    const t = tr();
    const plan = cheapest(this.level);
    if (!plan) return this.say(t.bear.hintNone);
    const parts = TOOLS.filter((tool) => plan.counts[tool] > 0).map((tool) => t.count(plan.counts[tool], tool));
    this.say(t.bear.hint(parts.join(', ')));
  }

  private run() {
    this.sfx.unlock();
    this.revealed = true;
    this.dock.running(true);
    const step = this.sdk.comfort.reduceMotion ? 260 : 420;
    this.playback = new Playback(this.result.hours.length, step, (i) => this.showHour(i), () => this.finish());
    this.playback.start();
  }

  private showHour(i: number) {
    const hour = this.result.hours[i];
    const wind = WIND[this.level.wind][hour.clock];
    this.sky.show(hour.clock, true);
    this.island.show(hour, this.result.capacity, this.sdk.comfort.reduceMotion ? 0 : wind);
    this.meter.show(hour, this.result.capacity);
    this.drawChart(i);
    this.sfx.tick(hour.missing > 0);
  }

  private finish() {
    const t = tr();
    this.dock.running(false);
    this.island.show(null, this.result.capacity, 0);
    this.sky.show(12, false);
    this.drawChart(-1);
    if (!this.result.ok) {
      const first = this.result.hours.find((h) => h.missing > 0)!;
      this.sfx.fail();
      this.say(t.bear.blackout(t.hour(first.clock)), 'worry');
      return this.events.onFail();
    }
    const cost = spent(this.layout, COST);
    const stars = starsFor(this.level, cost);
    this.sfx.win();
    this.say(this.result.hours.some((h) => h.wasted > 0) && stars < 3 ? t.bear.wasted : t.bear.win);
    this.events.onWin(stars, cost, this.result);
    const { onNext, onMenu, hasNext } = this.events;
    const overlay = renderResult({ stars, cost, budget: this.level.budget, hasNext, onAgain: () => overlay.remove(), onNext, onMenu });
    this.root.appendChild(overlay);
  }

  /** Время на исходе: Тёпа предупреждает, сутки досматриваются до конца. */
  ending() {
    this.say(tr().bear.ending);
  }

  pause = () => this.playback?.pause();
  resume = () => this.playback?.resume();

  dispose() {
    this.playback?.stop();
    this.root.remove();
  }
}
