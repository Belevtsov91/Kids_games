import { ROUNDS } from '../game/themes';
import { languageNames, type Language, type Words } from '../i18n';
import { button } from './html';

// Рамка всех экранов (шапка и служебные сообщения) и экран итога сессии.

export function resultView(t: Words, stars: number) {
  return [
    `<section class="cg-result"><div class="cg-trophy" aria-hidden="true">🏆</div>`,
    `<h1>${t.finish}</h1><p>${t.stars}: ${stars} / ${ROUNDS}</p>`,
    `<div class="cg-result-stars">${'⭐'.repeat(stars)}${'☆'.repeat(ROUNDS - stars)}</div><p>${t.correct}</p>`,
    button('again', t.again, undefined, 'cg-primary'),
    button('home', t.home, undefined, 'cg-text'),
    `</section>`,
  ].join('');
}

interface ShellOptions {
  /** На главном экране кнопка ведёт из игры, на остальных — на главный. */
  atHome: boolean;
  language: Language;
  voiceMissing: boolean;
  saveFailed: boolean;
}

export function shellView(t: Words, body: string, { atHome, language, voiceMissing, saveFailed }: ShellOptions) {
  return [
    `<div class="cg-shell"><header class="cg-header">`,
    button(atHome ? 'exit' : 'home', `← ${atHome ? t.back : t.home}`, undefined, 'cg-back'),
    `<span class="cg-brand">✦ ${t.title}</span><span class="cg-language">${languageNames[language]}</span></header>`,
    body,
    voiceMissing ? `<p class="cg-note" role="status">🔈 ${t.voiceMissing}</p>` : '',
    saveFailed ? `<p class="cg-note" role="alert">${t.saveFailed}</p>` : '',
    `</div>`,
  ].join('');
}
