import type { GameSdk } from '@ig/sdk';
import { CountingAudio } from '../audio/CountingAudio';
import { modes, type Mode } from '../game/logic';
import { Session } from '../game/Session';
import { THEMES } from '../game/themes';
import { numberWord, words } from '../i18n';
import { homeView } from '../ui/homeView';
import { renderKeepingFocus } from '../ui/html';
import { resultView, shellView } from '../ui/layout';
import { playView } from '../ui/playView';
import { pullCloud, pushCloud, reportAnswer, reportFinish } from './platform';
import { applyPreference, promptSpeech } from './prompts';
import { defaultPreferences, loadSaved, progressKey, saveState, type Preferences, type Progress } from './savedState';

// Контроллер: сессия, нажатия, перерисовка. Озвучка — prompts.ts, сохранение — savedState.ts, платформа — platform.ts.

export class CountingGame {
  private root = document.createElement('div');
  private audio = new CountingAudio();
  private prefs: Preferences = defaultPreferences();
  private progress: Progress = {};
  private screen: 'home' | 'play' | 'result' = 'home';
  private session: Session | null = null;
  /** Последний режим: «Ещё раз» на экране итога начинает его заново. */
  private mode: Mode = 'count';
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
    const saved = loadSaved(sdk.storage, this.storageKey);
    if (saved) ({ prefs: this.prefs, progress: this.progress } = saved);
    else this.failedSave = true;
    void pullCloud(sdk, this.progress).then((p) => p && !this.disposed && ((this.progress = p), this.render()));
    // Язык интерфейса и голоса при запуске — как на сайте; внутри игры его можно сменить.
    this.prefs = { ...this.prefs, language: sdk.locale, speech: sdk.locale };
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

  private save() {
    if (!saveState(this.sdk.storage, this.storageKey, this.prefs, this.progress)) this.failedSave = true;
    pushCloud(this.sdk, this.progress);
  }

  private say(text: string) {
    this.audio.say(text, this.prefs.speech);
  }

  private voicesChanged = () => {
    if (!this.disposed) this.render();
  };

  /** Озвучивает задание на языке речи. */
  private speakPrompt() {
    if (!this.session) return;
    this.say(promptSpeech(this.session, this.prefs.speech));
  }

  private begin(mode: Mode) {
    this.mode = mode;
    this.session = new Session(mode, this.prefs.limit);
    this.screen = 'play';
    this.showQuestion();
  }

  private showQuestion() {
    this.feedback = '';
    this.render();
    this.speakPrompt();
  }

  private answer(value: number) {
    const result = this.session?.answer(value);
    if (!result) return;
    reportAnswer(this.sdk, this.mode, result === 'right');
    if (result === 'right') this.audio.reward();
    const key = result === 'right' ? 'correct' : 'retry';
    this.feedback = words[this.prefs.language][key];
    this.say(words[this.prefs.speech][key]);
    this.render();
  }

  private next() {
    const session = this.session;
    if (!session?.solved) return;
    if (!session.isLastRound) {
      session.next();
      return this.showQuestion();
    }
    const key = progressKey(session.mode, this.prefs);
    this.progress[key] = Math.max(this.progress[key] ?? 0, session.stars);
    this.save();
    reportFinish(this.sdk, session.mode, session.stars, this.progress, this.prefs.limit);
    this.screen = 'result';
    this.render();
  }

  private onChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    if (this.screen !== 'home') return;
    applyPreference(this.prefs, target.name, target.value);
    this.audio.stop();
    this.save();
    this.render();
  };

  private onClick = (event: MouseEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    const value = Number(button.dataset.value);
    const actions: Record<string, () => void> = {
      exit: () => this.sdk.exit(),
      home: () => {
        this.screen = 'home';
        this.audio.stop();
        this.render();
      },
      theme: () => {
        this.prefs.theme = value;
        this.save();
        this.render();
      },
      start: () => this.begin(modes[value]),
      again: () => this.begin(this.mode),
      repeat: () => this.speakPrompt(),
      answer: () => this.answer(value),
      count: () => {
        if (!this.session?.count(value)) return;
        this.say(numberWord(this.prefs.speech, this.session.counted.size));
        this.render();
      },
      food: () => {
        this.session?.addFood(value);
        this.say(numberWord(this.prefs.speech, this.session?.food ?? 0));
        this.render();
      },
      check: () => this.answer(this.session?.food ?? 0),
      clear: () => {
        this.session?.clear();
        this.render();
      },
      next: () => this.next(),
    };
    actions[button.dataset.action ?? '']?.();
  };

  private render() {
    const t = words[this.prefs.language];
    const theme = THEMES[this.prefs.theme];
    this.root.lang = this.prefs.language;
    this.root.dataset.theme = theme.id;
    const s = this.session;
    const body =
      this.screen === 'home' || !s
        ? homeView(t, this.prefs, this.progress)
        : this.screen === 'play'
          ? playView(t, { ...s, theme, feedback: this.feedback })
          : resultView(t, s.stars);
    const options = { atHome: this.screen === 'home', language: this.prefs.language, saveFailed: this.failedSave };
    renderKeepingFocus(this.root, shellView(t, body, { ...options, voiceMissing: !this.audio.hasVoice(this.prefs.speech) }));
    // Не даём ответить повторно и случайно перескочить вперёд; отзыв остаётся в той же живой области.
    if (s?.solved) this.root.querySelectorAll<HTMLButtonElement>('[data-action="check"], [data-action="food"]').forEach((b) => (b.disabled = true));
    this.root.querySelector<HTMLElement>('.cg-header')!.style.paddingLeft = '48px';
  }
}
