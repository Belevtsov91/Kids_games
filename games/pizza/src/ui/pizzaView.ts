// Пицца в SVG: k равных секторов, на каждом — цвет начинки и эмодзи. Касание или проведение пальцем кладёт начинку.
import { TOPPING_ART, type Topping } from '../game/toppings';

const NS = 'http://www.w3.org/2000/svg';
const R = 100;
const C = 110;

const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const point = (angle: number, r: number) => [C + Math.cos(angle) * r, C + Math.sin(angle) * r];

/** Контур сектора i из k; при k = 1 — целый круг. */
export function sectorPath(i: number, k: number, r = R) {
  if (k === 1) return `M${C - r},${C} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  const a0 = -Math.PI / 2 + (2 * Math.PI * i) / k;
  const a1 = a0 + (2 * Math.PI) / k;
  const [x0, y0] = point(a0, r);
  const [x1, y1] = point(a1, r);
  return `M${C},${C} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} Z`;
}

/** Где на секторе рисовать эмодзи: 1–3 точки, чтобы крупные куски не выглядели пустыми. */
export function toppingSpots(i: number, k: number): [number, number][] {
  const mid = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / k;
  if (k === 1) return [[C, C], [C - 45, C - 30], [C + 45, C + 30]];
  if (k <= 4) return [point(mid, 60), point(mid - Math.PI / (k * 2.4), 78), point(mid + Math.PI / (k * 2.4), 78)] as [number, number][];
  if (k <= 6) return [point(mid, 52), point(mid, 80)] as [number, number][];
  return [point(mid, 68)] as [number, number][];
}

export class PizzaView {
  readonly el = svg('svg', { viewBox: '0 0 220 220', class: 'pz-pizza', role: 'group' });
  private sectors: SVGGElement[] = [];
  private painting = false;
  private last = -1;

  constructor(private readonly onSlice: (i: number, start: boolean) => void, label: string) {
    this.el.setAttribute('aria-label', label);
    this.el.addEventListener('pointerdown', this.down);
    this.el.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
  }

  /** Перерисовка: нарезку строим заново только если сменилось число кусков, иначе меняем начинку на месте. */
  render(slices: (Topping | null)[]) {
    if (slices.length !== this.sectors.length) this.build(slices.length);
    slices.forEach((top, i) => this.paint(this.sectors[i], i, slices.length, top));
  }

  private build(k: number) {
    this.el.replaceChildren(svg('circle', { cx: C, cy: C, r: R + 8, class: 'pz-crust' }));
    this.sectors = Array.from({ length: k }, (_, i) => {
      const g = svg('g', { class: 'pz-slice', 'data-i': i, tabindex: 0, role: 'button' });
      g.append(svg('path', { d: sectorPath(i, k), class: 'pz-slice-base' }));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.onSlice(i, true);
        }
      });
      this.el.append(g);
      return g;
    });
    if (k > 1) for (let i = 0; i < k; i++) this.el.append(svg('path', { d: sectorPath(i, k), class: 'pz-cutline' }));
  }

  private paint(g: SVGGElement, i: number, k: number, top: Topping | null) {
    if (g.dataset.top === (top ?? '')) return;
    g.dataset.top = top ?? '';
    g.classList.toggle('is-topped', !!top);
    g.querySelector('path')?.setAttribute('fill', top ? TOPPING_ART[top].color : '#ffd98a');
    g.querySelectorAll('text').forEach((t) => t.remove());
    if (!top) return;
    for (const [x, y] of toppingSpots(i, k)) {
      const t = svg('text', { x, y, class: 'pz-slice-top', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = TOPPING_ART[top].emoji;
      t.style.fontSize = `${k > 8 ? 18 : 24}px`;
      g.append(t);
    }
  }

  focusSlice(i: number) {
    this.sectors[i]?.focus({ preventScroll: true });
  }

  dispose() {
    window.removeEventListener('pointerup', this.up);
    this.el.remove();
  }

  private sliceAt(x: number, y: number) {
    const hit = document.elementFromPoint(x, y)?.closest('.pz-slice');
    return hit && this.el.contains(hit) ? Number(hit.getAttribute('data-i')) : -1;
  }

  private down = (e: PointerEvent) => {
    const i = this.sliceAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    // Касание пальцем «прилипает» к первому куску; отпускаем, чтобы проводить по соседним.
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    this.painting = true;
    this.last = i;
    this.onSlice(i, true);
  };

  private move = (e: PointerEvent) => {
    if (!this.painting) return;
    const i = this.sliceAt(e.clientX, e.clientY);
    if (i >= 0 && i !== this.last) {
      this.last = i;
      this.onSlice(i, false);
    }
  };

  private up = () => {
    this.painting = false;
    this.last = -1;
  };
}
