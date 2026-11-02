type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

/**
 * Маленький помощник для DOM: текст попадает только в textContent, никакого innerHTML с данными.
 * Атрибут-функция становится обработчиком события, `--имя` — CSS-переменной.
 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: (Node | string | null | false)[]) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(key, value);
    else if (key === 'class') el.className = String(value);
    else if (key.startsWith('--')) el.style.setProperty(key, String(value));
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
}

export const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export const randomItem = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** Перезапускает CSS-анимацию класса. */
export function replayClass(el: HTMLElement, className: string) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

/** Ряд из трёх звёзд; `count` из них горят. */
export const starRow = (count: number, animated = false) =>
  [0, 1, 2].map((s) => h('i', { class: s < count ? 'on' : '', '--i': animated ? s : undefined }, '★'));
