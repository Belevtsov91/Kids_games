/** 3D-сцена страниц входа и регистрации: остров с мишкой-стражем и волшебной дверью. Форма управляет ею через set/wrong/win. */
import * as THREE from 'three';
import { addSky } from '@/welcome/scene/sky';
import { buildAmbient } from './ambient';
import { buildBear } from './bear';
import { buildCelebrate } from './celebrate';
import { buildGate } from './gate';
import { buildGateFx } from './gateFx';
import { buildHouse } from './house';
import { buildIsland } from './island';
import { buildLanterns } from './lanterns';
import { buildMailbox } from './mailbox';
import { buildParticles } from './particles';
import { buildSignTower } from './signTower';
import { buildCamera } from './camera';
import { initialFx, PopIn, type AuthMode, type Frame, type FxState } from './state';

const FIREWORK_COLORS = ['#ffd25a', '#ff7eb6', '#7ee7ff', '#7ef09a', '#c49bff'];

function buildParts(scene: THREE.Scene, world: THREE.Group, island: THREE.Group, pop: PopIn, mode: AuthMode) {
  const sky = addSky(scene);
  scene.fog = new THREE.Fog('#b77bc0', 30, 90);
  island.add(buildIsland(pop));
  const gate = buildGate();
  island.add(pop.add(gate.group, 0.9));
  const bear = buildBear(mode);
  island.add(bear.group);
  const mailbox = buildMailbox(scene, pop);
  island.add(mailbox.group);
  return {
    sky,
    gate,
    bear,
    mailbox,
    gateFx: buildGateFx(gate.group),
    lanterns: buildLanterns(island),
    signTower: buildSignTower(island),
    house: buildHouse(island),
    celebrate: buildCelebrate(scene, island),
    particles: buildParticles(scene),
    ambient: buildAmbient(world, island),
    camera: buildCamera(),
  };
}
type Parts = ReturnType<typeof buildParts>;

export class AuthScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private world = new THREE.Group();
  private island = new THREE.Group();
  private pop = new PopIn();
  private fx: FxState;
  private reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private start = performance.now();
  private last = performance.now();
  private errAt = -99;
  private winAt = -99;
  private won = false;
  private fireIn = 0;
  private pointerX = 0;
  private pointerY = 0;
  private raf = 0;
  private parts: Parts;
  private canvas: HTMLCanvasElement;
  private host: HTMLElement;
  private bubble: () => HTMLElement | null;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, mode: AuthMode, bubble: () => HTMLElement | null) {
    this.canvas = canvas;
    this.host = host;
    this.bubble = bubble;
    this.fx = initialFx(mode);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene.add(this.world);
    this.world.add(this.island);
    this.parts = buildParts(this.scene, this.world, this.island, this.pop, mode);
    this.resize();
    addEventListener('resize', this.resize);
    addEventListener('pointermove', this.onPointer);
    this.raf = requestAnimationFrame(this.tick);
  }

  private get time() {
    return (performance.now() - this.start) / 1000;
  }

  set(next: FxState) {
    this.fx = next;
  }

  /** Неверный ввод: осколки, тучка, мишка мотает головой. */
  wrong() {
    this.errAt = this.time;
    this.parts.particles.shatter(this.parts.gate.lock.getWorldPosition(new THREE.Vector3()));
  }

  /** Успех: ключ летит в замок, дверь открывается, конфетти и салют. */
  win() {
    this.won = true;
    this.winAt = this.time;
    this.fireIn = 1.2;
    const { celebrate, bear, gate } = this.parts;
    celebrate.startKey(bear.paw, gate.lock, this.fx.mode === 'register');
    setTimeout(() => {
      if (!this.won) return;
      const at = gate.group.localToWorld(new THREE.Vector3(0, 1.4, 0));
      this.parts.particles.confetti(at);
      this.parts.particles.firework(gate.lock.getWorldPosition(new THREE.Vector3()), '#ffd25a');
    }, this.reduce ? 0 : 1150);
  }

  reset() {
    this.won = false;
  }

  /** Буква из поля почты летит в почтовый ящик. */
  letter(ch: string) {
    this.parts.mailbox.fly(ch, this.parts.camera.camera);
  }

  setName(name: string) {
    this.parts.signTower.setName(name);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    removeEventListener('resize', this.resize);
    removeEventListener('pointermove', this.onPointer);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose();
    });
    this.renderer.dispose();
  }

  private onPointer = (e: PointerEvent) => {
    this.pointerX = (e.clientX / innerWidth) * 2 - 1;
    this.pointerY = (e.clientY / innerHeight) * 2 - 1;
  };

  private resize = () => {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.parts.camera.resize(w, h);
  };

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const t = this.time;
    const f: Frame = { t, dt, fx: this.fx, sinceErr: t - this.errAt, sinceWin: t - this.winAt, win: this.won, reduce: this.reduce, pointerX: this.pointerX };
    const p = this.parts;

    this.island.position.y = Math.sin(t * 0.8) * 0.12 - (this.reduce ? 0 : (1 - Math.min(1, t / 1.4)) ** 2 * 7);
    this.pop.update(t, this.reduce);
    p.sky.update(t);
    p.ambient(f);
    p.gate.update(f);
    p.gateFx.update(f);
    p.lanterns(f);
    p.mailbox.update(f, this.fx.lit[this.fx.mode === 'login' ? 0 : 1]);
    p.signTower.update(f);
    p.house(f);
    p.bear.update(f);
    p.celebrate.update(f, p.bear.group.position, p.gateFx.frost());
    p.particles.update(t, dt);
    if (this.won && !this.reduce && f.sinceWin < 7 && (this.fireIn -= dt) < 0) {
      this.fireIn = 0.45 + Math.random() * 0.4;
      const at = new THREE.Vector3((Math.random() - 0.5) * 9 + 0.6, 4 + Math.random() * 2.5, -3 - Math.random() * 3);
      p.particles.firework(at, FIREWORK_COLORS[Math.floor(Math.random() * 5)]);
    }
    p.camera.update(f, this.pointerY);
    this.renderer.render(this.scene, p.camera.camera);
    this.placeBubble();
  };

  /** Облачко с репликой мишки висит над его головой. */
  private placeBubble() {
    const el = this.bubble();
    if (!el) return;
    const v = this.parts.bear.head.localToWorld(new THREE.Vector3(0, 0.95, 0)).project(this.parts.camera.camera);
    const r = this.canvas.getBoundingClientRect();
    el.style.left = `${r.left + ((v.x + 1) / 2) * r.width}px`;
    el.style.top = `${r.top + ((1 - v.y) / 2) * r.height}px`;
  }
}
