import { createContext, useContext } from 'react';
import type { FxState } from '../scene/state';

/** Что формы могут попросить у 3D-сцены и карточки. Без WebGL всё это просто ничего не делает. */
export interface AuthFx {
  set(patch: Partial<FxState>): void;
  /** Ошибка: тряска карточки, тучка над дверью, мишка мотает головой. */
  wrong(): void;
  /** Успех: ключ, открытая дверь, конфетти. */
  win(): void;
  letter(ch: string): void;
  setName(name: string): void;
  /** Реплика мишки в облачке. */
  say(text: string, ms?: number): void;
}

export const AuthFxContext = createContext<AuthFx | null>(null);

export function useAuthFx(): AuthFx {
  const fx = useContext(AuthFxContext);
  if (!fx) throw new Error('useAuthFx вне AuthLayout');
  return fx;
}
