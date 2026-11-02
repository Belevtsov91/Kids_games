/** Элемент с классом и текстом. */
export const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/** Кнопка с действием по нажатию. */
export const button = (className: string, text: string, onClick: () => void) => {
  const node = el('button', className, text);
  node.addEventListener('click', onClick);
  return node;
};
