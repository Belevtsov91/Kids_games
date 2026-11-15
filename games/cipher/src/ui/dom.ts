// Маленький помощник для DOM: h('div', { class: 'x' }, ['текст', child]).

type Props = Record<string, string | number | boolean | EventListener | undefined>;
export type Child = Node | string | number | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, children: Child[] = []): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(name.replace(/^on/, '').toLowerCase(), value);
    else if (name === 'class') el.className = String(value);
    else if (value === true) el.setAttribute(name, '');
    else el.setAttribute(name, String(value));
  }
  append(el, children);
  return el;
}

export function append(el: Node, children: Child[]) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

/** SVG-элемент с атрибутами. */
export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, children: Child[] = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  append(el, children);
  return el;
}

/** Кнопка с текстом и обработчиком. */
export const button = (label: Child, onClick: () => void, cls = 'cp-btn', aria?: string) =>
  h('button', { type: 'button', class: cls, onclick: () => onClick(), 'aria-label': aria }, [label]);

/** Плитки букв слова. */
export const tiles = (word: string, cls = 'cp-tile') => h('div', { class: 'cp-tiles' }, Array.from(word).map((l) => h('span', { class: cls }, [l])));
