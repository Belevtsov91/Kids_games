import { useEffect, useState } from 'react';
import R from '@dimforge/rapier3d-compat';
import type { Rapier } from '../sim/world';

let ready: Promise<Rapier> | null = null;

/** Rapier грузит свой wasm один раз; до готовности возвращает null. */
export function useRapier(): Rapier | null {
  const [rapier, setRapier] = useState<Rapier | null>(null);
  useEffect(() => {
    let alive = true;
    ready ??= R.init().then(() => R);
    void ready.then((r) => alive && setRapier(r));
    return () => void (alive = false);
  }, []);
  return rapier;
}
