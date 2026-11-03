// Сцена дыхания: ряд целей (шарики, свечки, одуванчики), дракончик, круг-подсказка и большая кнопка.
// Текущая цель получает --db-p — долю выдоха: шарик надувается, пламя гаснет, семена улетают.
import type { Scene } from '../game/progress';
import { tr } from '../i18n';
import { el } from './dom';
import { dragon } from './screens';

const ART: Record<Scene, string> = { balloon: '🎈', candles: '', dandelion: '🌼' };

export class SceneView {
  readonly node = el('section', 'db-session');
  readonly hold = el('button', 'db-hold');
  private readonly circle = el('div', 'db-circle');
  private readonly label = el('p', 'db-phase');
  private readonly targets: HTMLElement[] = [];

  constructor(scene: Scene, goal: number, color: number, follow: boolean) {
    this.node.classList.add(`db-scene-${scene}`);
    const row = el('div', 'db-targets');
    for (let i = 0; i < goal; i++) {
      const t = el('div', 'db-target');
      t.append(el('span', 'db-target-art', ART[scene]), el('span', 'db-target-fx'));
      this.targets.push(t);
      row.append(t);
    }
    const centre = el('div', 'db-centre');
    centre.append(this.circle, dragon(color));
    this.hold.textContent = tr().hold;
    this.hold.hidden = follow;
    this.node.append(row, centre, this.label, this.hold);
  }

  /** Перерисовка кадра: масштаб круга, подпись фазы и состояние целей. */
  render(scale: number, phaseText: string, current: number, exhale: number) {
    this.circle.style.setProperty('--db-scale', String(scale));
    if (this.label.textContent !== phaseText) this.label.textContent = phaseText;
    this.targets.forEach((t, i) => {
      t.classList.toggle('is-done', i < current);
      t.classList.toggle('is-current', i === current);
      t.style.setProperty('--db-p', i === current ? String(exhale) : i < current ? '1' : '0');
    });
  }

  setHolding(on: boolean) {
    this.hold.classList.toggle('is-down', on);
  }
}
