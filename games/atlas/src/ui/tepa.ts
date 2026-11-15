// Мишка Тёпа в шарфике и облачко с его репликой.
import { el } from './dom';

const BEAR =
  '<svg viewBox="0 0 60 60" aria-hidden="true">' +
  '<circle cx="14" cy="14" r="9" fill="#b9773f"/><circle cx="46" cy="14" r="9" fill="#b9773f"/>' +
  '<circle cx="14" cy="14" r="4.5" fill="#f2c28f"/><circle cx="46" cy="14" r="4.5" fill="#f2c28f"/>' +
  '<circle cx="30" cy="31" r="21" fill="#c4834a"/>' +
  '<ellipse cx="30" cy="38" rx="10" ry="8" fill="#f2c28f"/>' +
  '<circle cx="22" cy="28" r="2.6" fill="#2b2d42"/><circle cx="38" cy="28" r="2.6" fill="#2b2d42"/>' +
  '<circle cx="23" cy="27" r="0.9" fill="#fff"/><circle cx="39" cy="27" r="0.9" fill="#fff"/>' +
  '<ellipse cx="30" cy="34.5" rx="3.6" ry="2.6" fill="#2b2d42"/>' +
  '<path d="M26 39 q4 3.5 8 0" stroke="#2b2d42" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
  '<circle cx="15" cy="36" r="3.4" fill="#ff9aa2" opacity="0.7"/><circle cx="45" cy="36" r="3.4" fill="#ff9aa2" opacity="0.7"/>' +
  '<path d="M12 50 q18 8 36 0 l-2 6 q-16 5 -32 0z" fill="#ff7eb6"/>' +
  '</svg>';

/** Тёпа с облачком; say() меняет реплику. */
export const tepa = (text: string) => {
  const node = el('div', 'at-tepa');
  const face = el('div', 'at-tepa-face');
  face.innerHTML = BEAR;
  const bubble = el('p', 'at-tepa-bubble', text);
  bubble.setAttribute('aria-live', 'polite');
  node.append(face, bubble);
  return {
    node,
    say(line: string, mood: 'happy' | 'calm' = 'calm') {
      bubble.textContent = line;
      node.classList.toggle('is-happy', mood === 'happy');
      // Перезапуск анимации «подпрыгнул».
      node.classList.remove('is-hop');
      void node.offsetWidth;
      if (mood === 'happy') node.classList.add('is-hop');
    },
  };
};
