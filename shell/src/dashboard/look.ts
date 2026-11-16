import { useCallback, useState } from 'react';

// Вид дашборда. «Яркий» — закатное небо, плюш и мишка Тёпа, как для малышей.
// «Спокойный» — для 10+: тёмное ровное небо, плоские кнопки, без плюша и парения; Тёпу можно спрятать.
// Это удобство одного устройства, не правило взрослого: храним в localStorage по ребёнку.

export type Look = 'bright' | 'calm';
/** С какого возраста по умолчанию спокойный вид. */
export const CALM_FROM_AGE = 10;

export interface LookPrefs {
  look: Look;
  mascot: boolean;
}

const key = (childId: string) => `ig:look:${childId}`;

/** По умолчанию: до 10 лет — ярко и с Тёпой, с 10 — спокойно, Тёпа на месте (его можно спрятать). */
export const defaultLook = (age: number | undefined): LookPrefs => ({
  look: age !== undefined && age >= CALM_FROM_AGE ? 'calm' : 'bright',
  mascot: true,
});

/** Разбирает сохранённое; мусор и чужие значения — по умолчанию. */
export function parseLook(raw: string | null, age: number | undefined): LookPrefs {
  const base = defaultLook(age);
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<LookPrefs> | null;
    return {
      look: v?.look === 'calm' || v?.look === 'bright' ? v.look : base.look,
      mascot: typeof v?.mascot === 'boolean' ? v.mascot : base.mascot,
    };
  } catch {
    return base;
  }
}

function read(childId: string | undefined, age: number | undefined): LookPrefs {
  if (!childId) return defaultLook(age);
  try {
    return parseLook(localStorage.getItem(key(childId)), age);
  } catch {
    return defaultLook(age);
  }
}

/** Вид дашборда для ребёнка и смена вида. Без профиля — по умолчанию, ничего не сохраняем. */
export function useDashLook(childId: string | undefined, age: number | undefined) {
  const [state, setState] = useState(() => ({ childId, prefs: read(childId, age) }));
  // Сменили профиль — перечитываем его настройки.
  const prefs = state.childId === childId ? state.prefs : read(childId, age);
  if (state.childId !== childId) setState({ childId, prefs });

  const update = useCallback(
    (patch: Partial<LookPrefs>) => {
      const next = { ...prefs, ...patch };
      setState({ childId, prefs: next });
      if (!childId) return;
      try {
        localStorage.setItem(key(childId), JSON.stringify(next));
      } catch {
        // Приватное окно: вид держится до перезагрузки.
      }
    },
    [childId, prefs],
  );
  return { ...prefs, update };
}
