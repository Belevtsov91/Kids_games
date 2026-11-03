import { art } from './art';
// Кусочки разметки. Все действия — через data-action/data-value: их ловит один обработчик кликов.

export function button(action: string, label: string, value?: number, className = '') {
  return `<button class="${className}" data-action="${action}" ${value === undefined ? '' : `data-value="${value}"`}>${label}</button>`;
}

/**
 * Ряд предметов для счёта. Если передан `counted`, предметы — кнопки: нажатый получает свой номер.
 */
export function objects(n: number, item: string, counted?: ReadonlySet<number>) {
  const order = counted ? [...counted] : [];
  const cells = Array.from({ length: n }, (_, index) => {
    if (!counted) return `<span class="cg-object" aria-hidden="true">${art(item)}</span>`;
    const on = counted.has(index);
    const badge = on ? `<small>${order.indexOf(index) + 1}</small>` : '';
    return `<button class="cg-object ${on ? 'cg-counted' : ''}" data-action="count" data-value="${index}" aria-label="${index + 1}" aria-pressed="${on}">${art(item)}${badge}</button>`;
  });
  return `<div class="cg-objects">${cells.join('') || '<span class="cg-zero">0</span>'}</div>`;
}

/**
 * Перерисовывает `root` через innerHTML, сохраняя фокус клавиатуры на «той же» кнопке
 * (то же действие и значение) — иначе после каждого нажатия фокус улетал бы в начало страницы.
 */
export function renderKeepingFocus(root: HTMLElement, html: string) {
  const active = document.activeElement as HTMLElement | null;
  const action = active && root.contains(active) ? active.dataset.action : undefined;
  const value = active?.dataset.value;
  root.innerHTML = html;
  if (!action) return;
  const selector = `[data-action="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`;
  (root.querySelector<HTMLButtonElement>(selector) ?? root.querySelector<HTMLButtonElement>('[data-action="next"]'))?.focus({ preventScroll: true });
}
