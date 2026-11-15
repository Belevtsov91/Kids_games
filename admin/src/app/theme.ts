// Тема: «как в системе» (ничего не задано) или выбранная вручную. Хранится в браузере.

export type Theme = 'system' | 'light' | 'dark';
const STORE = 'console.theme';

export function savedTheme(): Theme {
  try {
    const value = localStorage.getItem(STORE);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORE, theme);
  } catch {
    /* тема останется до перезагрузки */
  }
}
