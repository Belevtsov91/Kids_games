// Настройки оболочки, общие для всех игр. Пока только звук; хранится в localStorage.
const MUTED_KEY = 'ig:muted';
const listeners = new Set<(muted: boolean) => void>();

export const settings = {
  get muted() {
    return localStorage.getItem(MUTED_KEY) === '1';
  },
  setMuted(muted: boolean) {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
    listeners.forEach((listener) => listener(muted));
  },
  onMuteChange(listener: (muted: boolean) => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
};
