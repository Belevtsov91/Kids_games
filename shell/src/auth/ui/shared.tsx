import { useMemo } from 'react';
import type { FocusKind } from '../scene/state';
import { useAuthText } from '../text';
import { useAuthFx } from './fxContext';

/** Сообщает сцене, какое поле в фокусе: мишка смотрит на почту и закрывает глаза на пароле. */
export function useFocusFx() {
  const fx = useAuthFx();
  const text = useAuthText();
  return useMemo(
    () => ({
      on(kind: Exclude<FocusKind, null>, len: number) {
        fx.set({ focus: kind, typeLen: len, peek: false });
        if (kind === 'pass') fx.say(text.say.noPeek, 1800);
      },
      blur() {
        // фокус может перейти на соседнее поле: проверяем на следующем кадре
        requestAnimationFrame(() => {
          if (!(document.activeElement instanceof HTMLInputElement)) fx.set({ focus: null });
        });
      },
      peek(show: boolean) {
        fx.set({ peek: show });
        fx.say(show ? text.say.peek : text.say.noPeek, 1800);
      },
    }),
    [fx, text],
  );
}

/** «Может быть, mama@gmail.com?» — кнопка подставляет исправленный адрес. */
export function EmailHint({ hint, onPick }: { hint: string; onPick(v: string): void }) {
  const text = useAuthText();
  const fx = useAuthFx();
  return (
    <>
      {text.maybe}{' '}
      <button
        type="button"
        className="au-link"
        onClick={() => {
          onPick(hint);
          fx.say(text.say.fixed, 2000);
        }}
      >
        {hint}
      </button>
      ?
    </>
  );
}
