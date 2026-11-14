/** 3D-сцена «Мишка просыпается»: рендер, камера и ход пробуждения по состоянию сервера. */
import * as THREE from 'three';
import { createCinema, type Cinema } from '@/lib/cinema';
import { disposeThree } from '@/lib/disposeThree';
import { applyLook } from '@/lib/threeLook';
import type { WakeState } from '../serverStatus';
import { phase, stepProgress } from '../progress';
import { BEAR_SCALE } from './bear';
import { applyPose } from './pose';
import { buildPlainSet, loadModelSet, type WakeSet } from './set';
import { buildWorld } from './world';
import { buildZzz } from './zzz';

export interface WakeSceneOptions {
  getState: () => WakeState;
  /** Мишка встал и помахал: можно убирать экран. */
  onDone: () => void;
}

/** Сколько секунд мишка машет, прежде чем экран уйдёт. */
const WAVE_S = 1.4;

export class WakeScene {
  private renderer: THREE.WebGLRenderer;
  private cinema!: Cinema;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private look = new THREE.Vector3(0.35, 0.8, 0);
  private world = buildWorld(this.scene);
  /** Мишка, кровать и остров: появляются, когда загрузилась модель (или запасной набор, если не вышло). */
  private set: WakeSet | null = null;
  private setAt = 0;
  private fallback = 0;
  private zzz = buildZzz();
  private headPos = new THREE.Vector3();
  private reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private start = performance.now();
  private last = performance.now();
  private raf = 0;
  private p = 0;
  private stood = 0;
  private done = false;
  private disposed = false;
  /** Когда последний раз потрогали мишку (секунды сцены): он смешно ворочается. */
  private pokedAt = -99;
  private canvas: HTMLCanvasElement;

  private host: HTMLElement;
  private opts: WakeSceneOptions;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, opts: WakeSceneOptions) {
    this.host = host;
    this.opts = opts;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    applyLook(this.renderer, this.scene, 0.45);
    // Модель весит меньше мегабайта; если за 4 секунды не пришла или сломалась — показываем мишку из простых фигур.
    loadModelSet().then(this.use, () => this.use(buildPlainSet()));
    this.fallback = window.setTimeout(() => this.use(buildPlainSet()), 4000);
    this.scene.add(this.zzz.group);
    this.cinema = createCinema(this.renderer, this.scene, this.camera, { focus: 0.45, blur: 2.6 });
    this.resize();
    addEventListener('resize', this.resize);
    // пока ждём, можно тыкать в мишку: ожидание превращается в маленькую игру
    canvas.addEventListener('pointerdown', this.poke);
    canvas.style.cursor = 'pointer';
    this.raf = requestAnimationFrame(this.tick);
  }

  private use = (set: WakeSet) => {
    clearTimeout(this.fallback);
    if (this.set || this.disposed) return;
    this.set = set;
    this.setAt = performance.now();
    this.world.island.add(set.group);
  };

  dispose() {
    this.disposed = true;
    clearTimeout(this.fallback);
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.poke);
    this.cinema.dispose();
    disposeThree(this.scene, this.renderer);
  }

  private poke = () => {
    this.pokedAt = (performance.now() - this.start) / 1000;
    navigator.vibrate?.(20);
  };

  private resize = () => {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.cinema?.setSize(w, h);
    const aspect = w / h;
    // На узком экране отъезжаем дальше и опускаем сцену под текст сверху.
    const far = aspect < 0.8 ? 1.9 : aspect < 1.2 ? 1.45 : 1.15;
    this.camera.aspect = aspect;
    this.camera.position.set(5.4 * far, 1.5 + far * 0.75, 3.4 * far);
    this.look.set(0.3, aspect < 0.8 ? 2.2 : aspect < 1.2 ? 1.6 : 1.25, -0.1);
    this.camera.lookAt(this.look);
    this.camera.updateProjectionMatrix();
  };

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();
    // Подъём идёт по настоящему времени (до 0,25 с за кадр), чтобы на медленном устройстве мишка не отставал.
    const dt = Math.min((now - this.last) / 1000, 0.25);
    this.last = now;
    const t = (now - this.start) / 1000;
    const state = this.opts.getState();
    const awake = state.phase === 'awake' || state.phase === 'up';
    const elapsed = (now - state.since) / 1000;
    this.p = this.reduce && awake ? 1 : stepProgress(this.p, dt, elapsed, awake);
    if (this.p >= 1) this.stood += dt;
    if (!this.done && this.stood > (this.reduce ? 0.4 : WAVE_S)) {
      this.done = true;
      this.opts.onDone();
    }

    const motion = this.reduce ? 0 : t;
    const morning = phase(this.p, 0.75, 1);
    const set = this.set;
    if (set) {
      applyPose(set.bear, this.p, motion, this.stood);
      const poke = this.reduce ? 0 : Math.max(0, 1 - (t - this.pokedAt) / 0.9);
      if (poke > 0) {
        const wob = Math.sin((t - this.pokedAt) * 22) * poke;
        set.bear.root.scale.set(BEAR_SCALE * (1 + wob * 0.06), BEAR_SCALE * (1 - wob * 0.08), BEAR_SCALE * (1 + wob * 0.06));
        set.bear.head.rotation.y += wob * 0.35;
      } else set.bear.root.scale.setScalar(BEAR_SCALE);
      set.update(this.p, morning);
      // остров мягко «вырастает» при появлении
      const k = this.reduce ? 1 : Math.min(1, (now - this.setAt) / 700);
      set.group.scale.setScalar(1 - (1 - k) ** 3 * 0.25);
      set.bear.head.getWorldPosition(this.headPos);
    }
    this.world.update(motion, morning);
    this.zzz.update(t, this.headPos, set ? 1 - phase(this.p, 0.14, 0.3) : 0);
    this.cinema.render();
  };
}
