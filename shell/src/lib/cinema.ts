/** «Киношная» картинка для 3D-сцен: размытие дальнего и ближнего плана (эффект миниатюры),
 *  виньетка, чуть больше цвета и контраста, лёгкое зерно. Включается только на компьютерах,
 *  которые тянут; на телефонах и слабых машинах сцена рисуется как раньше, напрямую. */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export interface CinemaOptions {
  /** Где резко: высота полосы фокуса на экране, 0 — низ, 1 — верх. */
  focus?: number;
  /** Сколько пикселей размытия у краёв кадра. */
  blur?: number;
}

export interface Cinema {
  render: () => void;
  setSize: (w: number, h: number) => void;
  dispose: () => void;
}

const FINISH = {
  uniforms: { tDiffuse: { value: null }, px: { value: new THREE.Vector2(1, 1) }, focus: { value: 0.5 }, blur: { value: 3 }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 px; uniform float focus; uniform float blur; uniform float time; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  // миниатюра: чем дальше от полосы фокуса, тем сильнее размытие (8 выборок по кругу)
  float r = smoothstep(0.16, 0.62, abs(vUv.y - focus)) * blur;
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  if (r > 0.25) {
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982 + 0.4;
      c += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * px * r * (i % 2 == 0 ? 1.0 : 0.55)).rgb;
    }
    c /= 9.0;
  }
  // цвет чуть плотнее, мягкая виньетка, зерно против полос на градиентах
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, 1.14);
  c = (c - 0.5) * 1.05 + 0.5;
  vec2 d = vUv - 0.5;
  c *= 1.0 - dot(d, d) * 0.42;
  c += (hash(vUv * 811.0 + time) - 0.5) * 0.018;
  gl_FragColor = vec4(c, 1.0);
}`,
};

/** Решение «включать ли эффекты»: ?fx=1 / ?fx=0 в адресе — принудительно (для проверки). */
function wanted(renderer: THREE.WebGLRenderer) {
  const forced = new URLSearchParams(location.search).get('fx');
  if (forced) return forced === '1';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(pointer: coarse)').matches) return false;
  return renderer.capabilities.isWebGL2 && (navigator.hardwareConcurrency ?? 4) >= 4 && innerWidth >= 900;
}

export function createCinema(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, opts: CinemaOptions = {}): Cinema {
  const plain: Cinema = { render: () => renderer.render(scene, camera), setSize: () => undefined, dispose: () => undefined };
  if (!wanted(renderer)) return plain;
  let composer: EffectComposer | null;
  let finish: ShaderPass;
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());
    finish = new ShaderPass(FINISH);
    finish.uniforms.focus.value = opts.focus ?? 0.5;
    finish.uniforms.blur.value = (opts.blur ?? 3) * renderer.getPixelRatio();
    composer.addPass(finish);
  } catch {
    return plain;
  }
  const forced = new URLSearchParams(location.search).has('fx');
  let frames = 0, slow = 0, last = performance.now();
  return {
    render: () => {
      if (!composer) return renderer.render(scene, camera);
      const now = performance.now();
      // сторож: если первые секунды кадры идут медленнее ~30 в секунду — эффекты выключаются насовсем
      if (!forced && ++frames > 20 && frames <= 140 && now - last > 34 && ++slow > 45) {
        composer.dispose();
        composer = null;
        return renderer.render(scene, camera);
      }
      last = now;
      finish.uniforms.time.value = (now % 1000) / 1000;
      composer.render();
    },
    setSize: (w, h) => {
      if (!composer) return;
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      finish.uniforms.px.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
    },
    dispose: () => {
      composer?.dispose();
      composer = null;
    },
  };
}
