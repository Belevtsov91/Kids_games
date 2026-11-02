import type { GameSdk } from '@ig/sdk';
import { CountingAudio } from './audio';
import { languageNames, languages, numberWord, words, type Language } from './i18n';
import { createQuestion, modes, type Mode, type Question } from './logic';

interface Preferences {
  language: Language;
  speech: Language;
  limit: number;
  theme: number;
}
interface Progress {
  [key: string]: number;
}
const THEMES = [
  { id: 'farm', pet: '🐰', item: '🥕', accent: '#ed9146' },
  { id: 'forest', pet: '🐿️', item: '🌰', accent: '#4c9271' },
  { id: 'sea', pet: '🐬', item: '🐟', accent: '#508ed0' },
] as const;
const ICONS = ['🖐️', '🥕', '🔢', '🔍', '⚖️', '✨'];
const ROUNDS = 5;

export class CountingGame {
  private root = document.createElement('div');
  private audio = new CountingAudio();
  private prefs: Preferences = { language: 'uk', speech: 'uk', limit: 5, theme: 0 };
  private progress: Progress = {};
  private screen: 'home' | 'play' | 'result' = 'home';
  private mode: Mode = 'count';
  private question: Question | null = null;
  private counted = new Set<number>();
  private food = 0;
  private round = 1;
  private firstTry = true;
  private stars = 0;
  private solved = false;
  private feedback = '';
  private failedSave = false;
  private stopMute: () => void;
  private disposed = false;
  private readonly storageKey: string;
  constructor(
    container: HTMLElement,
    private sdk: GameSdk,
  ) {
    this.storageKey = `v1:${sdk.profile?.id ?? 'guest'}`;
    try {
      const saved = sdk.storage.load<{ preferences?: Partial<Preferences>; progress?: Progress }>(this.storageKey);
      const p = saved?.preferences;
      if (p)
        this.prefs = {
          language: languages.includes(p.language!) ? p.language! : 'uk',
          speech: languages.includes(p.speech!) ? p.speech! : 'uk',
          limit: [5, 10, 20].includes(p.limit!) ? p.limit! : 5,
          theme: [0, 1, 2].includes(p.theme!) ? p.theme! : 0,
        };
      if (saved?.progress && typeof saved.progress === 'object')
        this.progress = Object.fromEntries(
          Object.entries(saved.progress).filter(([, value]) => typeof value === 'number' && value >= 0 && value <= ROUNDS),
        );
    } catch {
      this.failedSave = true;
    }
    this.root.className = 'counting-game';
    container.append(this.root);
    this.audio.muted = sdk.audio.muted;
    this.stopMute = sdk.audio.onMuteChange((muted) => {
      this.audio.muted = muted;
      if (muted) this.audio.stop();
    });
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('change', this.onChange);
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', this.voicesChanged);
    this.render();
  }
  private get t() {
    return words[this.prefs.language];
  }
  private get theme() {
    return THEMES[this.prefs.theme];
  }
  private get key() {
    return `${this.mode}:${this.prefs.language}:${this.prefs.limit}:${this.prefs.theme}`;
  }
  private save() {
    try {
      this.sdk.storage.save(this.storageKey, { preferences: this.prefs, progress: this.progress });
    } catch {
      this.failedSave = true;
    }
  }
  private voicesChanged = () => {
    if (!this.disposed) this.render();
  };
  private speakPrompt() {
    if (!this.question) return;
    const t = words[this.prefs.speech];
    const prompt = t[this.mode];
    this.audio.say(
      this.mode === 'feed'
        ? `${prompt} ${numberWord(this.prefs.speech, this.question.answer)}`
        : this.mode === 'calculate'
          ? `${prompt} ${this.question.a} ${this.question.subtract ? '−' : '+'} ${this.question.b}`
          : prompt,
      this.prefs.speech,
    );
  }
  private begin(mode: Mode) {
    this.mode = mode;
    this.round = 1;
    this.stars = 0;
    this.screen = 'play';
    this.nextQuestion();
  }
  private nextQuestion() {
    this.question = createQuestion(this.mode, this.prefs.limit);
    this.counted.clear();
    this.food = 0;
    this.firstTry = true;
    this.solved = false;
    this.feedback = '';
    this.render();
    this.speakPrompt();
  }
  private answer(value: number) {
    if (!this.question || this.solved) return;
    if (value === this.question.answer) {
      this.solved = true;
      if (this.firstTry) this.stars++;
      this.feedback = this.t.correct;
      this.audio.reward();
      this.audio.say(words[this.prefs.speech].correct, this.prefs.speech);
    } else {
      this.firstTry = false;
      this.feedback = this.t.retry;
      this.audio.say(words[this.prefs.speech].retry, this.prefs.speech);
    }
    this.render();
  }
  private onChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    if (this.screen !== 'home') return;
    if (target.name === 'language' && languages.includes(target.value as Language)) this.prefs.language = target.value as Language;
    if (target.name === 'speech' && languages.includes(target.value as Language)) this.prefs.speech = target.value as Language;
    if (target.name === 'limit' && [5, 10, 20].includes(Number(target.value))) this.prefs.limit = Number(target.value);
    this.audio.stop();
    this.save();
    this.render();
  };
  private onClick = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const value = Number(button.dataset.value);
    if (action === 'exit') this.sdk.exit();
    if (action === 'home') {
      this.screen = 'home';
      this.audio.stop();
      this.render();
    }
    if (action === 'theme') {
      this.prefs.theme = value;
      this.save();
      this.render();
    }
    if (action === 'start') this.begin(modes[value]);
    if (action === 'again') this.begin(this.mode);
    if (action === 'repeat') this.speakPrompt();
    if (action === 'answer') this.answer(value);
    if (action === 'count' && !this.counted.has(value)) {
      this.counted.add(value);
      this.audio.say(numberWord(this.prefs.speech, this.counted.size), this.prefs.speech);
      this.render();
    }
    if (action === 'food') {
      this.food = Math.max(0, Math.min(this.prefs.limit, this.food + value));
      this.audio.say(numberWord(this.prefs.speech, this.food), this.prefs.speech);
      this.render();
    }
    if (action === 'check') this.answer(this.food);
    if (action === 'clear') {
      this.counted.clear();
      this.food = 0;
      this.render();
    }
    if (action === 'next' && this.solved) {
      if (this.round === ROUNDS) {
        this.progress[this.key] = Math.max(this.progress[this.key] ?? 0, this.stars);
        this.save();
        this.screen = 'result';
        this.render();
      } else {
        this.round++;
        this.nextQuestion();
      }
    }
  };
  private button(action: string, label: string, value?: number, className = '') {
    return `<button class="${className}" data-action="${action}" ${value === undefined ? '' : `data-value="${value}"`}>${label}</button>`;
  }
  private objects(n: number, interactive = false) {
    return `<div class="cg-objects">${Array.from({ length: n }, (_, index) => (interactive ? `<button class="cg-object ${this.counted.has(index) ? 'cg-counted' : ''}" data-action="count" data-value="${index}" aria-label="${index + 1}" aria-pressed="${this.counted.has(index)}">${this.theme.item}${this.counted.has(index) ? `<small>${[...this.counted].indexOf(index) + 1}</small>` : ''}</button>` : `<span class="cg-object" aria-hidden="true">${this.theme.item}</span>`)).join('') || '<span class="cg-zero">0</span>'}</div>`;
  }
  private playBody() {
    const q = this.question!;
    const t = this.t;
    let scene = '';
    if (this.mode === 'count' || this.mode === 'digit')
      scene = `${this.objects(q.a, this.mode === 'count')}<p class="cg-help">${this.mode === 'count' ? t.tap : ''}</p>`;
    if (this.mode === 'feed')
      scene = `<div class="cg-feeding"><span class="cg-friend" aria-hidden="true">${this.theme.pet}</span><span class="cg-target">${q.answer}</span></div><p>${t.collected}: <b>${this.food}</b></p>${this.objects(this.food)}<div class="cg-feed-controls">${this.button('food', '−', -1)}${this.button('food', '+', 1)}</div><p class="cg-help">${t.enough}</p>${this.button('check', t.check, undefined, 'cg-primary')}`;
    if (this.mode === 'sequence')
      scene = `<div class="cg-sequence">${q.sequence.map((n, i) => `<span class="${i === q.gap ? 'cg-gap' : ''}">${i === q.gap ? '?' : n}</span>`).join('')}</div>`;
    if (this.mode === 'compare')
      scene = `<div class="cg-compare"><div aria-label="${t.left}">${this.objects(q.a)}</div><div aria-label="${t.right}">${this.objects(q.b)}</div></div>`;
    if (this.mode === 'calculate')
      scene = `<div class="cg-equation">${q.a} ${q.subtract ? '−' : '+'} ${q.b} = <span>?</span></div><div class="cg-compare"><div>${this.objects(q.a)}</div><strong>${q.subtract ? '−' : '+'}</strong><div>${this.objects(q.b)}</div></div>`;
    const options =
      this.mode === 'feed'
        ? ''
        : `<div class="cg-answers">${(this.mode === 'compare' ? [1, 0, 2] : q.options).map((n) => this.button('answer', this.mode === 'compare' ? [t.equal, t.left, t.right][n] : String(n), n, 'cg-answer')).join('')}</div>`;
    return `<div class="cg-roundline"><span>${t.round} ${this.round} / ${ROUNDS}</span><span>⭐ ${this.stars}</span></div><div class="cg-progress"><i style="width:${((this.round - 1 + Number(this.solved)) / ROUNDS) * 100}%"></i></div><section class="cg-board"><div class="cg-prompt"><h2>${t[this.mode]} ${this.mode === 'feed' ? q.answer : ''}</h2>${this.button('repeat', `🔊 <span>${t.repeat}</span>`, undefined, 'cg-listen')}</div>${scene}${this.solved ? '' : options}<div class="cg-feedback" role="status" aria-live="polite">${this.feedback}</div>${this.solved ? this.button('next', `${t.next} →`, undefined, 'cg-primary') : this.mode === 'count' ? this.button('clear', t.clear, undefined, 'cg-text') : ''}</section>`;
  }
  private render() {
    const active = document.activeElement as HTMLElement | null;
    const focusAction = active && this.root.contains(active) ? active.dataset.action : undefined;
    const focusValue = active?.dataset.value;
    this.root.lang = this.prefs.language;
    this.root.dataset.theme = this.theme.id;
    const t = this.t;
    const options = (selected: Language) =>
      languages
        .map((language) => `<option value="${language}" ${language === selected ? 'selected' : ''}>${languageNames[language]}</option>`)
        .join('');
    const settings = `<details class="cg-settings" open><summary>⚙ ${t.settings}</summary><div class="cg-settings-row"><label>${t.language}<select name="language">${options(this.prefs.language)}</select></label><label>${t.speech}<select name="speech">${options(this.prefs.speech)}</select></label><label>${t.range}<select name="limit">${[5, 10, 20].map((n) => `<option ${n === this.prefs.limit ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></details>`;
    const home = `<section class="cg-hero"><div><p class="cg-eyebrow">1 · 2 · 3 · 4 · 5</p><h1>${t.title}</h1><p>${t.subtitle}</p></div><div class="cg-hero-art" aria-hidden="true"><span>${this.theme.pet}</span><i>1</i><i>2</i><i>3</i></div></section>${settings}<nav class="cg-themes" aria-label="${t.adventure}">${THEMES.map((theme, i) => `<button data-action="theme" data-value="${i}" aria-pressed="${i === this.prefs.theme}">${theme.pet} ${t[theme.id]}</button>`).join('')}</nav><h2 class="cg-section-title">${t.adventure}</h2><section class="cg-modes">${modes.map((mode, i) => this.button('start', `<span class="cg-mode-icon">${ICONS[i]}</span><b>${t.modes[i]}</b><small>${t.descriptions[i]}</small><span class="cg-record">${'★'.repeat(this.progress[`${mode}:${this.prefs.language}:${this.prefs.limit}:${this.prefs.theme}`] ?? 0)}<span aria-hidden="true">${'☆'.repeat(ROUNDS - (this.progress[`${mode}:${this.prefs.language}:${this.prefs.limit}:${this.prefs.theme}`] ?? 0))}</span></span>`, i, 'cg-mode')).join('')}</section>`;
    const result = `<section class="cg-result"><div class="cg-trophy" aria-hidden="true">🏆</div><h1>${t.finish}</h1><p>${t.stars}: ${this.stars} / ${ROUNDS}</p><div class="cg-result-stars">${'⭐'.repeat(this.stars)}${'☆'.repeat(ROUNDS - this.stars)}</div><p>${t.correct}</p>${this.button('again', t.again, undefined, 'cg-primary')}${this.button('home', t.home, undefined, 'cg-text')}</section>`;
    this.root.innerHTML = `<div class="cg-shell"><header class="cg-header">${this.button(this.screen === 'home' ? 'exit' : 'home', `← ${this.screen === 'home' ? t.back : t.home}`, undefined, 'cg-back')}<span class="cg-brand">✦ ${t.title}</span><span class="cg-language">${languageNames[this.prefs.language]}</span></header>${this.screen === 'home' ? home : this.screen === 'play' ? this.playBody() : result}${!this.audio.hasVoice(this.prefs.speech) ? `<p class="cg-note" role="status">🔈 ${t.voiceMissing}</p>` : ''}${this.failedSave ? `<p class="cg-note" role="alert">${t.saveFailed}</p>` : ''}</div>`;
    // Avoid repeated answers and accidental double advances; keep feedback in the same live region.
    if (this.solved)
      this.root
        .querySelectorAll<HTMLButtonElement>('[data-action="check"], [data-action="food"]')
        .forEach((button) => (button.disabled = true));
    // The shell has its own back button in the upper-left corner.
    this.root.querySelector<HTMLElement>('.cg-header')!.style.paddingLeft = '48px';
    if (focusAction) {
      const selector = `[data-action="${focusAction}"]${focusValue === undefined ? '' : `[data-value="${focusValue}"]`}`;
      (this.root.querySelector<HTMLButtonElement>(selector) ?? this.root.querySelector<HTMLButtonElement>('[data-action="next"]'))?.focus({
        preventScroll: true,
      });
    }
  }
  pause() {
    this.audio.paused = true;
    this.audio.stop();
  }
  resume() {
    this.audio.paused = false;
  }
  dispose() {
    this.disposed = true;
    this.stopMute();
    this.audio.dispose();
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('change', this.onChange);
    if ('speechSynthesis' in window) speechSynthesis.removeEventListener('voiceschanged', this.voicesChanged);
    this.root.remove();
  }
}
