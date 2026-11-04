// Весы с коромыслом: две чаши, наклон через --ls-tilt (−1…1).
import { el } from './dom';

export class ScaleView {
  readonly node = el('div', 'ls-scale');
  readonly left = el('button', 'ls-pan ls-pan-left');
  readonly right = el('button', 'ls-pan ls-pan-right');
  private readonly beam = el('div', 'ls-beam');

  constructor() {
    this.beam.append(this.left, this.right);
    this.node.append(this.beam, el('div', 'ls-stand'));
  }

  setTilt(t: number) {
    this.node.style.setProperty('--ls-tilt', String(t));
  }
}
