// Глобус на SVG: материки, метки-столицы и воздушный шар Тёпы над центром.
// Крутится пальцем, а к стране плавно «долетает» (без анимации в режиме «меньше движения»).
import { densify, lonDelta, project, ringPath, type View } from '../game/globe';
import { LAND, WATER } from '../game/land';

export type Tone = 'idle' | 'home' | 'pick' | 'right' | 'wrong';
export interface Marker {
  id: string;
  lat: number;
  lon: number;
  tone: Tone;
  label?: string;
  title?: string;
}

const NS = 'http://www.w3.org/2000/svg';
const C = 100;
const R = 92;
const RINGS = LAND.map((ring) => densify(ring));
const SEAS = WATER.map((ring) => densify(ring, 1.5));

const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, parent?: Element) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.appendChild(node);
  return node;
};

export class Globe {
  readonly node = svg('svg', { viewBox: '0 0 200 200', class: 'at-globe', role: 'img' });
  private readonly land: SVGPathElement[];
  private readonly seas: SVGPathElement[];
  private readonly marks = svg('g', { class: 'at-marks' });
  private readonly balloon = svg('g', { class: 'at-balloon' });
  private markers: Marker[] = [];
  private view: View = { lat: 30, lon: 20 };
  /** Увеличение: 1 — весь шар, 3 — видно одну область (дом крупно). */
  private zoom = 1;
  private frame = 0;
  private drag: { x: number; y: number; view: View; moved: boolean } | null = null;

  constructor(private readonly calm: boolean, private readonly onPick: (id: string) => void = () => {}) {
    const defs = svg('defs', {}, this.node);
    const sea = svg('radialGradient', { id: 'at-sea', cx: '38%', cy: '32%', r: '75%' }, defs);
    svg('stop', { offset: '0%', 'stop-color': '#8fd3ff' }, sea);
    svg('stop', { offset: '100%', 'stop-color': '#2f7fe0' }, sea);
    svg('circle', { cx: C, cy: C + 4, r: R, fill: 'rgb(20 60 120 / 0.18)' }, this.node);
    svg('circle', { cx: C, cy: C, r: R, fill: 'url(#at-sea)', class: 'at-sea' }, this.node);
    const clip = svg('clipPath', { id: 'at-clip' }, defs);
    svg('circle', { cx: C, cy: C, r: R }, clip);
    const landGroup = svg('g', { class: 'at-land', 'clip-path': 'url(#at-clip)' }, this.node);
    this.land = RINGS.map(() => svg('path', {}, landGroup));
    this.seas = SEAS.map(() => svg('path', { class: 'at-water' }, landGroup));
    svg('ellipse', { cx: C - 30, cy: C - 40, rx: 34, ry: 20, fill: 'rgb(255 255 255 / 0.22)' }, this.node);
    this.node.append(this.marks, this.balloon);
    this.drawBalloon();
    this.node.addEventListener('pointerdown', this.onDown);
    this.node.addEventListener('pointermove', this.onMove);
    this.node.addEventListener('pointerup', this.onUp);
    this.node.addEventListener('pointercancel', this.onUp);
    this.render();
  }

  setMarkers(markers: Marker[]) {
    this.markers = markers;
    this.render();
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(1, Math.min(4, zoom));
    this.render();
  }

  get zoomLevel() {
    return this.zoom;
  }

  showBalloon(show: boolean) {
    this.balloon.toggleAttribute('hidden', !show);
  }

  /** Повернуть глобус к точке: плавно или сразу. */
  flyTo(target: View, ms = 900) {
    cancelAnimationFrame(this.frame);
    const from = { ...this.view };
    const dLon = lonDelta(from.lon, target.lon);
    const to = { lat: Math.max(-60, Math.min(60, target.lat)), lon: from.lon + dLon };
    if (this.calm || ms <= 0) return this.setView(to);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      this.setView({ lat: from.lat + (to.lat - from.lat) * e, lon: from.lon + (to.lon - from.lon) * e });
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.node.remove();
  }

  private setView(view: View) {
    this.view = { lat: Math.max(-70, Math.min(70, view.lat)), lon: ((view.lon + 540) % 360) - 180 };
    this.render();
  }

  private render() {
    RINGS.forEach((ring, i) => {
      const d = ringPath(ring, this.view, C, C, R * this.zoom);
      this.land[i].setAttribute('d', d ?? '');
    });
    SEAS.forEach((ring, i) => this.seas[i].setAttribute('d', ringPath(ring, this.view, C, C, R * this.zoom) ?? ''));
    this.marks.replaceChildren();
    for (const m of this.markers) {
      const p = project(m.lat, m.lon, this.view);
      const x = p.x * R * this.zoom;
      const y = p.y * R * this.zoom;
      if (!p.front || Math.hypot(x, y) > R - 3) continue;
      const g = svg('g', { class: `at-mark is-${m.tone}`, transform: `translate(${(C + x).toFixed(1)} ${(C - y).toFixed(1)})` }, this.marks);
      if (m.title) svg('title', {}, g).textContent = m.title;
      svg('circle', { r: 11, class: 'at-mark-hit' }, g);
      svg('circle', { r: m.label ? 6.5 : 3.6, class: 'at-mark-dot' }, g);
      if (m.label) svg('text', { 'text-anchor': 'middle', dy: '2.6', class: 'at-mark-label' }, g).textContent = m.label;
      g.addEventListener('click', () => !this.drag?.moved && this.onPick(m.id));
    }
  }

  private drawBalloon() {
    const g = svg('g', { transform: `translate(${C} ${C - 30})` }, this.balloon);
    svg('path', { d: 'M-3,14 L-6,4 M3,14 L6,4', stroke: '#6b4a2e', 'stroke-width': 0.9 }, g);
    svg('ellipse', { cx: 0, cy: -4, rx: 10, ry: 11.5, fill: '#ff6f61', stroke: '#fff', 'stroke-width': 1 }, g);
    svg('path', { d: 'M0,-15.5 C-4,-10 -4,2 0,7.5 C4,2 4,-10 0,-15.5Z', fill: '#ffd447' }, g);
    svg('rect', { x: -4, y: 13, width: 8, height: 6, rx: 1.5, fill: '#a8693c' }, g);
    svg('circle', { cx: 0, cy: 11.5, r: 3, fill: '#b9773f' }, g);
    svg('circle', { cx: -2.4, cy: 9.4, r: 1.2, fill: '#b9773f' }, g);
    svg('circle', { cx: 2.4, cy: 9.4, r: 1.2, fill: '#b9773f' }, g);
    svg('path', { d: `M0,19 L0,26`, stroke: 'rgb(0 0 0 / 0.25)', 'stroke-width': 1, 'stroke-dasharray': '1.5 1.5' }, g);
  }

  private onDown = (e: PointerEvent) => {
    this.drag = { x: e.clientX, y: e.clientY, view: { ...this.view }, moved: false };
  };

  private onMove = (e: PointerEvent) => {
    if (!this.drag) return;
    const dx = e.clientX - this.drag.x;
    const dy = e.clientY - this.drag.y;
    if (!this.drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!this.drag.moved) this.node.setPointerCapture?.(e.pointerId);
    this.drag.moved = true;
    cancelAnimationFrame(this.frame);
    const scale = 180 / Math.max(120, this.node.getBoundingClientRect().width) / this.zoom;
    this.setView({ lat: this.drag.view.lat + dy * scale, lon: this.drag.view.lon - dx * scale });
  };

  private onUp = () => {
    // Клик по метке приходит после pointerup: даём ему увидеть, было ли перетаскивание.
    const drag = this.drag;
    setTimeout(() => this.drag === drag && (this.drag = null), 0);
  };
}
