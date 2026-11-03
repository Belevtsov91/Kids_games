// Профиль качества графики: на телефонах и планшетах — облегчённый, на компьютере — полный.

export interface Quality {
  /** Полный набор эффектов (мягкие тени в стыках, больше травы, тени 2048). */
  high: boolean;
  dpr: [number, number];
  shadowMap: number;
  grass: number;
  /** Мягкое затенение в стыках предметов (GTAO). Дорого для телефонов. */
  ao: boolean;
}

function isLowEnd() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || small || cores <= 2;
}

export function detectQuality(): Quality {
  if (isLowEnd()) return { high: false, dpr: [1, 1.25], shadowMap: 1024, grass: 7000, ao: false };
  return { high: true, dpr: [1, 1.6], shadowMap: 2048, grass: 22000, ao: true };
}
