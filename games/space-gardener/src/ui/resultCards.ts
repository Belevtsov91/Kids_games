import type { Stars } from '../game/scoring';

// Карточки после попытки: победа со звёздами или «не хватило воды».

const PRAISE = ['Цветок расцвёл!', 'Отлично!', 'Супер-садовник!'];

export function winCardHtml(stars: Stars, lastLevel: boolean) {
  const praise = PRAISE[stars - 1];
  return `
    <div class="sg-card" role="dialog" aria-label="${praise}">
      <div class="sg-card-emoji">🌸</div>
      <h2>${praise}</h2>
      <div class="sg-stars" aria-label="Звёзд: ${stars} из 3"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <p>${stars < 3 ? 'Потрать меньше лианы, чтобы получить больше звёзд.' : 'Лианы ушло совсем чуть-чуть, супер!'}</p>
      <div class="sg-actions">
        <button class="sg-btn" data-act="retry">🔄 Ещё раз</button>
        <button class="sg-btn" data-act="levels">🪐 Уровни</button>
        ${lastLevel ? '<button class="sg-btn sg-green" data-act="levels">🏆 Готово</button>' : '<button class="sg-btn sg-green" data-act="next">Дальше ➜</button>'}
      </div>
    </div>`;
}

export function loseCardHtml(collected: number, need: number) {
  return `
    <div class="sg-card" role="dialog" aria-label="Попробуй ещё">
      <div class="sg-card-emoji">🥀</div>
      <h2>Цветку не хватило воды</h2>
      <p>Собрано ${collected} из ${need} капель. Поправь лианы и попробуй ещё раз! Если трудно, нажми 💡.</p>
      <div class="sg-actions">
        <button class="sg-btn" data-act="levels">🪐 Уровни</button>
        <button class="sg-btn sg-green" data-act="retry">🔄 Ещё раз</button>
      </div>
    </div>`;
}

/** Зажигает звёзды по одной; `onStar` — звук для каждой. */
export function lightUpStars(card: HTMLElement, stars: number, onStar: (index: number) => void) {
  const spans = card.querySelectorAll('.sg-stars span');
  for (let i = 0; i < stars; i++) {
    window.setTimeout(() => {
      spans[i]?.classList.add('on');
      onStar(i);
    }, 250 + i * 300);
  }
}
