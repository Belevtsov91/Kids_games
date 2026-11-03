// Пост-обработка: мягкие тени в стыках (GTAO), свечение (bloom), цветокоррекция и виньетка.
// Только то, что есть в самом three.js, без новых библиотек.

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { HalfFloatType, type Object3D, Vector2, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { Quality } from './quality';

/** Цветокоррекция уже в sRGB: насыщенность, тёплый сдвиг, мягкая виньетка. */
const GradeShader = {
  name: 'MoonValleyGrade',
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.12 },
    warmth: { value: 0.03 },
    vignette: { value: 0.28 },
    contrast: { value: 1.08 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float warmth;
    uniform float vignette;
    uniform float contrast;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luma), color.rgb, saturation);
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      color.rgb += vec3(warmth, warmth * 0.35, -warmth);
      // Тени слегка сиреневые вместо серо-чёрных.
      color.rgb += vec3(0.05, 0.03, 0.09) * (1.0 - smoothstep(0.0, 0.45, luma)) * 0.6;
      vec2 d = vUv - 0.5;
      color.rgb *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
    }
  `,
};

/**
 * Прозрачные плоскости у самой земли (подсветка цели, вода, пена) не должны попадать в буфер глубины AO:
 * иначе на них появляются артефакты. Помечаем их userData.noAO, и проход их пропускает.
 */
function skipInAO(pass: GTAOPass) {
  const inner = pass as unknown as { _overrideVisibility(): void; _visibilityCache: Object3D[]; scene: Object3D };
  const original = inner._overrideVisibility.bind(pass);
  inner._overrideVisibility = () => {
    original();
    inner.scene.traverse((object) => {
      if (object.userData.noAO && object.visible) {
        object.visible = false;
        inner._visibilityCache.push(object);
      }
    });
  };
}

/**
 * Защита свечения: один «битый» пиксель (NaN/бесконечность) свечение размазывает на весь экран,
 * и кадр становится пустым. Заменяем такие пиксели нулём и ограничиваем яркость.
 */
const SanitizeShader = {
  name: 'MoonValleySanitize',
  uniforms: { tDiffuse: { value: null } },
  vertexShader: GradeShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      if (any(isnan(color)) || any(isinf(color))) color = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = vec4(min(color.rgb, vec3(32.0)), 1.0);
    }
  `,
};

export function Effects({ night, quality }: { night: boolean; quality: Quality }) {
  const gl = useThree((three) => three.gl);
  const scene = useThree((three) => three.scene);
  const camera = useThree((three) => three.camera);
  const size = useThree((three) => three.size);
  const dpr = useThree((three) => three.viewport.dpr);

  const { composer, bloom, grade, ao } = useMemo(() => {
    // Своя цель рендера со сглаживанием (MSAA): иначе после пост-обработки края станут «лесенкой».
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: quality.high ? 4 : 2 });
    const composer = new EffectComposer(gl, target);
    composer.addPass(new RenderPass(scene, camera));
    let ao: GTAOPass | null = null;
    if (quality.ao) {
      ao = new GTAOPass(scene, camera, 1, 1);
      ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 1.2, scale: 1, samples: 12 });
      ao.blendIntensity = 0.85;
      skipInAO(ao);
      composer.addPass(ao);
    }
    composer.addPass(new ShaderPass(SanitizeShader));
    const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.35, 0.55, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return { composer, bloom, grade, ao };
  }, [gl, scene, camera, quality.ao, quality.high]);

  useEffect(() => {
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
    // Свечению хватает половинного разрешения, на телефоне — четверти.
    const k = quality.high ? 0.5 : 0.25;
    bloom.resolution.set(size.width * k, size.height * k);
  }, [composer, bloom, size, dpr, quality.high]);

  useEffect(() => {
    // Днём под ярким солнцем трава и так светлая: светятся только самые яркие вещи (кристаллы, подсветка).
    // Ночью порог ниже, чтобы светились светлячки, окна и жезл.
    bloom.strength = night ? 0.8 : 0.28;
    bloom.threshold = night ? 0.85 : 2.6;
    bloom.radius = night ? 0.65 : 0.4;
    grade.uniforms.saturation.value = night ? 1.08 : 1.3;
    grade.uniforms.contrast.value = night ? 1.04 : 1.1;
    grade.uniforms.warmth.value = night ? -0.01 : 0.025;
    grade.uniforms.vignette.value = night ? 0.4 : 0.26;
    if (ao) ao.blendIntensity = night ? 0.6 : 0.85;
  }, [night, bloom, grade, ao]);

  useEffect(() => () => composer.dispose(), [composer]);

  // Приоритет 1: R3F больше не рисует сам, кадр рисует композер.
  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}
