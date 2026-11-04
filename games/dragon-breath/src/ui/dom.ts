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

/** Удобство, которое выбрал взрослый: меньше движения и крупные кнопки — классы на корне игры. */
export const applyComfort = (root: HTMLElement, prefix: string, comfort: { reduceMotion: boolean; bigButtons: boolean }) => {
  root.classList.toggle(`${prefix}-calm`, comfort.reduceMotion);
  root.classList.toggle(`${prefix}-big`, comfort.bigButtons);
};
