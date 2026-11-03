// Ветер для травы, цветов и крон: смещение вершин в шейдере, ниже — меньше, у макушки — больше.
// Трава ещё и приминается под героем.

import { type Material, MeshStandardMaterial, Vector2 } from 'three';

/** Общие для всех материалов значения: время и позиция героя (обновляет WindClock). */
export const windUniforms = {
  uWindTime: { value: 0 },
  uHero: { value: new Vector2(0, 0) },
};

export interface WindOptions {
  /** Высота (в метрах мира), на которой качание максимальное. */
  height: number;
  /** Амплитуда качания в метрах у макушки. */
  amount: number;
  /** Приминать под героем. */
  push?: boolean;
}

const cache = new Map<string, Material>();

/** Копия материала с ветром. Одинаковые материалы и настройки — одна копия. */
export function windMaterial(material: Material, options: WindOptions): Material {
  if (!(material instanceof MeshStandardMaterial)) return material;
  const key = `${material.uuid}|${options.height}|${options.amount}|${options.push ? 1 : 0}`;
  const ready = cache.get(key);
  if (ready) return ready;
  const copy = material.clone();
  patchWind(copy, options);
  cache.set(key, copy);
  return copy;
}

export function patchWind(material: MeshStandardMaterial, { height, amount, push = false }: WindOptions) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniforms.uWindTime;
    shader.uniforms.uHero = windUniforms.uHero;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;\nuniform vec2 uHero;')
      .replace(
        '#include <project_vertex>',
        /* glsl */ `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelMatrix * mvPosition;
        float windH = clamp( mvPosition.y / ${height.toFixed(3)}, 0.0, 1.0 );
        windH *= windH;
        vec2 wp = mvPosition.xz;
        float gust = 0.6 + 0.4 * sin( uWindTime * 0.35 + wp.x * 0.05 );
        float wave = sin( uWindTime * 1.6 + wp.x * 0.32 + wp.y * 0.21 ) * 0.65
                   + sin( uWindTime * 2.7 + wp.x * 0.83 - wp.y * 0.47 ) * 0.35;
        mvPosition.x += wave * gust * ${amount.toFixed(3)} * windH;
        mvPosition.z += wave * gust * ${(amount * 0.45).toFixed(3)} * windH;
        ${
          push
            ? `vec2 away = wp - uHero;
        float dist = length( away );
        float pressed = ( 1.0 - smoothstep( 0.2, 1.2, dist ) ) * windH;
        mvPosition.xz += away / max( dist, 0.001 ) * pressed * 0.35;
        mvPosition.y -= pressed * ${(height * 0.45).toFixed(3)};`
            : ''
        }
        mvPosition = viewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        `,
      );
  };
  material.customProgramCacheKey = () => `wind-${height}-${amount}-${push ? 1 : 0}`;
}
