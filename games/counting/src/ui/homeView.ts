import type { Preferences, Progress } from '../app/savedState';
import { progressKey } from '../app/savedState';
import { modes } from '../game/logic';
import { LIMITS, MODE_ICONS, ROUNDS, THEMES } from '../game/themes';
import { languageNames, languages, type Language, type Words } from '../i18n';
import { button } from './html';
import { art } from './art';

// Главный экран: заставка, настройки языка и диапазона, выбор темы и режима с рекордами.

function settings(t: Words, prefs: Preferences) {
  const options = (selected: Language) =>
    languages.map((language) => `<option value="${language}" ${language === selected ? 'selected' : ''}>${languageNames[language]}</option>`).join('');
  const limits = LIMITS.map((n) => `<option ${n === prefs.limit ? 'selected' : ''}>${n}</option>`).join('');
  return [
    `<details class="cg-settings" open><summary>⚙ ${t.settings}</summary><div class="cg-settings-row">`,
    `<label>${t.language}<select name="language">${options(prefs.language)}</select></label>`,
    `<label>${t.speech}<select name="speech">${options(prefs.speech)}</select></label>`,
    `<label>${t.range}<select name="limit">${limits}</select></label>`,
    `</div></details>`,
  ].join('');
}

function modeCard(t: Words, i: number, best: number) {
  const record = `<span class="cg-record">${'★'.repeat(best)}<span aria-hidden="true">${'☆'.repeat(ROUNDS - best)}</span></span>`;
  return button('start', `<span class="cg-mode-icon">${MODE_ICONS[i]}</span><b>${t.modes[i]}</b><small>${t.descriptions[i]}</small>${record}`, i, 'cg-mode');
}

export function homeView(t: Words, prefs: Preferences, progress: Progress) {
  const theme = THEMES[prefs.theme];
  const themes = THEMES.map(
    (th, i) => `<button data-action="theme" data-value="${i}" aria-pressed="${i === prefs.theme}">${art(th.pet)} ${t[th.id]}</button>`,
  ).join('');
  const cards = modes.map((mode, i) => modeCard(t, i, progress[progressKey(mode, prefs)] ?? 0)).join('');
  return [
    `<section class="cg-hero"><div><p class="cg-eyebrow">1 · 2 · 3 · 4 · 5</p><h1>${t.title}</h1><p>${t.subtitle}</p></div>`,
    `<div class="cg-hero-art" aria-hidden="true"><span>${art(theme.pet)}</span><i>1</i><i>2</i><i>3</i></div></section>`,
    settings(t, prefs),
    `<nav class="cg-themes" aria-label="${t.adventure}">${themes}</nav>`,
    `<h2 class="cg-section-title">${t.adventure}</h2>`,
    `<section class="cg-modes">${cards}</section>`,
  ].join('');
}
