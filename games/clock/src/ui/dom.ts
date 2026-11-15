// Мелочи DOM: создать элемент и большую кнопку со значком.

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}

/** Кнопка: значок или короткий текст на экране, подпись — для экранного диктора. */
export function button(cls: string, html: string, label: string, onClick: () => void, once = false) {
  const node = el('button', cls, html);
  node.type = 'button';
  node.setAttribute('aria-label', label);
  node.addEventListener('click', onClick, { once });
  return node;
}
