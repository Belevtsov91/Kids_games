/** Два фонаря у двери на входе: загораются, когда почта и пароль заполнены. */
import * as THREE from 'three';
import { glow, mat, mesh } from '@/welcome/scene/kit';
import { damp, type Frame } from './state';

export function buildLanterns(island: THREE.Group) {
  const items = [[-0.05, 0.35], [1.95, 0.25]].map(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, 0.27, z);
    g.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.75, 5), mat('#5a3a1a'), 0, 0.37, 0));
    const lamp = new THREE.MeshStandardMaterial({ color: '#8a83b8', emissive: '#ffd25a', emissiveIntensity: 0, flatShading: true, roughness: 0.4 });
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.24, 0.2), lamp, 0, 0.86, 0));
    const roof = mesh(new THREE.ConeGeometry(0.17, 0.14, 4), mat('#2f2a6b'), 0, 1.05, 0);
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const light = glow('#ffc95c', 0);
    light.position.y = 0.86;
    g.add(light);
    island.add(g);
    return { g, lamp, light, v: 0 };
  });

  return (f: Frame) =>
    items.forEach((it, i) => {
      it.g.visible = f.fx.mode === 'login';
      it.v = damp(it.v, f.win || f.fx.lit[i] ? 1 : 0, 6, f.dt);
      it.lamp.emissiveIntensity = it.v * 1.8;
      it.light.scale.setScalar(it.v * (1.3 + Math.sin(f.t * 4 + i) * 0.08));
    });
}
