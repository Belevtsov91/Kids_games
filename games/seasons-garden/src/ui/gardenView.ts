// Сад на экране: небо, осадки, дерево, земля, приметы сезона и звери. Всё меняется классами.
import { ANIMALS, type Animal, type Scene } from '../game/seasons';
import { el } from './dom';

const EMOJI: Record<Animal, string> = { bear: '🐻', bird: '🐦', squirrel: '🐿️', hedgehog: '🦔' };
const BUSY: Record<Animal, string> = { bear: '🍯', bird: '🪺', squirrel: '🌰', hedgehog: '🍂' };
const DROPS = 28;

export class GardenView {
  readonly node = el('div', 'sg-garden');
  private readonly precip = el('div', 'sg-precip');
  private readonly extras = el('div', 'sg-extras');
  private readonly animals = new Map<Animal, { btn: HTMLButtonElement; badge: HTMLElement }>();

  constructor(onAnimal: (a: Animal) => void) {
    const sky = el('div', 'sg-sky');
    sky.append(el('span', 'sg-sun', '☀️'), el('span', 'sg-cloud sg-cloud-1', '☁️'), el('span', 'sg-cloud sg-cloud-2', '☁️'));
    for (let i = 0; i < DROPS; i++) {
      const d = el('i', 'sg-drop');
      d.style.left = `${(i * 37) % 100}%`;
      d.style.animationDelay = `${((i * 13) % 20) / 10}s`;
      this.precip.append(d);
    }
    const tree = el('div', 'sg-tree');
    tree.append(el('div', 'sg-trunk'), el('div', 'sg-crown'), el('div', 'sg-fall'));
    this.node.append(sky, el('div', 'sg-ground'), tree, this.extras, this.precip);
    for (const a of ANIMALS) {
      const btn = el('button', `sg-animal sg-animal-${a}`);
      btn.type = 'button';
      const badge = el('span', 'sg-animal-badge');
      btn.append(el('span', 'sg-animal-emoji', EMOJI[a]), badge);
      btn.addEventListener('click', () => onAnimal(a));
      this.animals.set(a, { btn, badge });
      this.node.append(btn);
    }
  }

  show(scene: Scene) {
    this.node.className = `sg-garden sg-season-${scene.season} sg-weather-${scene.weather} sg-tree-${scene.tree}`;
    this.extras.replaceChildren(...scene.extras.map((e, i) => el('span', `sg-extra sg-extra-${i}`, e)));
    for (const [a, { btn, badge }] of this.animals) {
      const state = scene.animals[a];
      btn.dataset.state = state;
      badge.textContent = state === 'asleep' ? '💤' : state === 'busy' ? BUSY[a] : '';
    }
  }

  wiggle(a: Animal) {
    const btn = this.animals.get(a)?.btn;
    if (!btn) return;
    btn.classList.remove('is-wiggle');
    void btn.offsetWidth;
    btn.classList.add('is-wiggle');
  }
}
