/** 3D-сцена стартовой страницы: рендер, вращение, наведение и клик по островам, подписи. */
import * as THREE from 'three';
import { ALL_IDS, SMALL_IDS, isBig, type BigId, type ShowcaseId } from '../showcase';
import { buildArchipelago, labelHeight } from './archipelago';
import { CameraRig } from './cameraRig';
import { addSky } from './sky';
import { renderThumbnails } from './thumbnails';

export interface WelcomeSceneOptions {
  /** Клик по острову или по пустому месту (null). */
  onPick: (id: ShowcaseId | null) => void;
  onHover: (id: ShowcaseId | null) => void;
  /** Подписи над островами; сцена двигает их каждый кадр. */
  labels: () => Partial<Record<ShowcaseId, HTMLElement | null>>;
  onThumbnails: (thumbs: Partial<Record<BigId, string>>) => void;
}

export class WelcomeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private rig = new CameraRig();
  private arch = buildArchipelago();
  private sky = addSky(this.scene);
  private start = performance.now();
  private last = performance.now();
  private ray = new THREE.Raycaster();
  private reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private observer: IntersectionObserver;
  private raf = 0;
  private frame = 0;
  private visible = true;
  private w = 1;
  private h = 1;
  private spin = 0;
  private userYaw = 0;
  private dragV = 0;
  private drag: { x: number; startX: number; at: number } | null = null;
  private hovered: ShowcaseId | null = null;
  private focused: ShowcaseId | null = null;
  private canvas: HTMLCanvasElement;
  private host: HTMLElement;
  private opts: WelcomeSceneOptions;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, opts: WelcomeSceneOptions) {
    this.canvas = canvas;
    this.host = host;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.add(this.arch.root);
    this.resize();

    addEventListener('resize', this.resize);
    canvas.addEventListener('pointerdown', this.onDown);
    addEventListener('pointerup', this.onUp);
    addEventListener('pointermove', this.onMove);
    this.observer = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.observer.observe(host);
    this.raf = requestAnimationFrame(this.tick);
  }

  setFocus(id: ShowcaseId | null) {
    this.focused = id;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    removeEventListener('pointerup', this.onUp);
    removeEventListener('pointermove', this.onMove);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.renderer.dispose();
  }

  private resize = () => {
    this.w = this.host.clientWidth || 1;
    this.h = this.host.clientHeight || 1;
    this.renderer.setSize(this.w, this.h, false);
    this.rig.resize(this.w, this.h);
  };

  private pick(e: PointerEvent): ShowcaseId | null {
    const r = this.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(p, this.rig.camera);
    let o: THREE.Object3D | null = this.ray.intersectObjects(this.arch.pickables, true)[0]?.object ?? null;
    while (o && !o.userData.id) o = o.parent;
    return (o?.userData.id as ShowcaseId | undefined) ?? null;
  }

  private setHover(id: ShowcaseId | null) {
    if (id === this.hovered) return;
    this.hovered = id;
    this.canvas.style.cursor = id ? 'pointer' : 'grab';
    this.opts.onHover(id);
  }

  private onDown = (e: PointerEvent) => {
    this.drag = { x: e.clientX, startX: e.clientX, at: performance.now() };
    this.dragV = 0;
  };

  private onUp = (e: PointerEvent) => {
    if (!this.drag) return;
    const click = Math.abs(e.clientX - this.drag.startX) < 6 && performance.now() - this.drag.at < 400;
    this.drag = null;
    if (click && e.target === this.canvas) this.opts.onPick(this.pick(e));
  };

  private onMove = (e: PointerEvent) => {
    if (this.drag && !this.focused) {
      const dx = e.clientX - this.drag.x;
      this.drag.x = e.clientX;
      this.userYaw += dx * 0.006;
      this.dragV = dx * 0.006;
    }
    if (!this.drag && e.pointerType === 'mouse') this.setHover(e.target === this.canvas ? this.pick(e) : null);
  };

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    if (!this.visible && this.frame > 2) return;
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const t = this.reduce ? 0 : (now - this.start) / 1000;
    this.frame++;
    if (!this.focused && !this.drag && !this.reduce) {
      this.spin += dt * 0.07;
      this.userYaw += this.dragV;
      this.dragV *= 0.92;
    }
    this.arch.update(t, this.spin + this.userYaw, (id) => id === this.hovered || id === this.focused);
    this.sky.update(t);
    const target = this.focused
      ? { pos: this.arch.worlds[this.focused].getWorldPosition(new THREE.Vector3()), small: (SMALL_IDS as readonly string[]).includes(this.focused) }
      : null;
    this.rig.update(target, this.reduce);
    this.renderer.render(this.scene, this.rig.camera);
    this.placeLabels();
    if (this.frame === 3) this.opts.onThumbnails(renderThumbnails(this.scene, this.arch.worlds, this.sky.clouds));
  };

  private placeLabels() {
    const labels = this.opts.labels();
    const v = new THREE.Vector3();
    for (const id of ALL_IDS) {
      const el = labels[id];
      if (!el) continue;
      this.arch.worlds[id].getWorldPosition(v);
      v.y += labelHeight(id);
      v.project(this.rig.camera);
      const show = v.z <= 1 && (isBig(id) || id === this.hovered);
      el.style.visibility = show ? '' : 'hidden';
      if (!show) continue;
      const half = (el.offsetWidth || 120) / 2 + 8;
      el.style.left = `${Math.min(this.w - half, Math.max(half, ((v.x + 1) / 2) * this.w))}px`;
      el.style.top = `${((1 - v.y) / 2) * this.h}px`;
    }
  }
}
