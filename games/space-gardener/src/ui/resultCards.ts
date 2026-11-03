import type { Stars } from '../game/scoring';
import { tr } from '../i18n';

// Карточки после попытки: победа со звёздами или «не хватило воды».

const t = () => tr();

export function winCardHtml(stars: Stars, lastLevel: boolean) {
  const praise = t().praise[stars - 1];
  return `
    <div class="sg-card" role="dialog" aria-label="${praise}">
      <div class="sg-card-emoji">🌸</div>
      <h2>${praise}</h2>
      <div class="sg-stars" aria-label="${t().starsOf(stars)}"><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <p>${stars < 3 ? t().lessInk : t().littleInk}</p>
      <div class="sg-actions">
        <button class="sg-btn" data-act="retry">${t().retry}</button>
        <button class="sg-btn" data-act="levels">${t().levelsBtn}</button>
        ${lastLevel ? `<button class="sg-btn sg-green" data-act="levels">${t().done}</button>` : `<button class="sg-btn sg-green" data-act="next">${t().next}</button>`}
      </div>
    </div>`;
}

export function loseCardHtml(collected: number, need: number) {
  return `
    <div class="sg-card" role="dialog" aria-label="${t().tryAgain}">
      <div class="sg-card-emoji">🥀</div>
      <h2>${t().noWater}</h2>
      <p>${t().collected(collected, need)}</p>
      <div class="sg-actions">
        <button class="sg-btn" data-act="levels">${t().levelsBtn}</button>
        <button class="sg-btn sg-green" data-act="retry">${t().retry}</button>
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
