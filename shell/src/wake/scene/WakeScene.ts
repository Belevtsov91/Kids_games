/** 3D-сцена «Мишка просыпается»: рендер, камера и ход пробуждения по состоянию сервера. */
import * as THREE from 'three';
import type { WakeState } from '../serverStatus';
import { phase, stepProgress } from '../progress';
import { buildSleepyBear } from './bear';
import { buildBed } from './bed';
import { applyPose } from './pose';
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
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private look = new THREE.Vector3(0.35, 0.8, 0);
  private world = buildWorld(this.scene);
  private bed = buildBed();
  private bear = buildSleepyBear();
  private zzz = buildZzz();
  private headPos = new THREE.Vector3();
  private reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private start = performance.now();
  private last = performance.now();
  private raf = 0;
  private p = 0;
  private stood = 0;
  private done = false;

  private host: HTMLElement;
  private opts: WakeSceneOptions;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, opts: WakeSceneOptions) {
    this.host = host;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.world.island.add(this.bed.group, this.bear.root);
    this.scene.add(this.zzz.group);
    this.resize();
    addEventListener('resize', this.resize);
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Sprite) o.geometry.dispose();
    });
    this.renderer.dispose();
  }

  private resize = () => {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
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
    applyPose(this.bear, this.p, motion, this.stood);
    this.bed.update(this.p, morning);
    this.world.update(motion, morning);
    this.bear.head.getWorldPosition(this.headPos);
    this.zzz.update(t, this.headPos, 1 - phase(this.p, 0.14, 0.3));
    this.renderer.render(this.scene, this.camera);
  };
}
