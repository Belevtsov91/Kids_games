// Общий голос игр: фразы читает голос браузера на языке игры. Если такого голоса нет
// (часто нет украинского и румынского), играет записанный клип фразы, если игра его дала.
// Чужим голосом не читаем: русский голос читает украинский текст неразборчиво.

export interface VoiceOptions {
  /** Язык голоса ('ru', 'uk', 'ro', 'en' или полный тег). Функция — если язык может смениться. */
  lang: string | (() => string);
  muted?: boolean;
  /** Громкость голоса 0–1 (обычно comfort.effectsVolume). */
  volume?: number;
  rate?: number;
  pitch?: number;
  /** Записанные фразы: ключ (или сам текст) → URL клипа. Играют, когда голоса на языке нет. */
  clips?: Record<string, string>;
  /** Какой голос предпочесть по имени, если голосов на языке несколько. */
  prefer?: RegExp;
}

export interface SayOptions {
  /** Ключ записанного клипа; без него клип ищется по тексту фразы. */
  clip?: string;
  rate?: number;
}

const speechApi = (): SpeechSynthesis | null => (typeof speechSynthesis === 'undefined' ? null : speechSynthesis);

export class GameVoice {
  private voice: SpeechSynthesisVoice | null = null;
  private clip: HTMLAudioElement | null = null;
  private readonly speech = speechApi();
  private readonly clips: Record<string, string>;
  private muted: boolean;
  private volume: number;

  constructor(private readonly options: VoiceOptions) {
    this.muted = options.muted ?? false;
    this.volume = clamp(options.volume ?? 1);
    this.clips = { ...options.clips };
    this.pickVoice();
    this.speech?.addEventListener?.('voiceschanged', this.pickVoice);
  }

  /** Язык, на котором сейчас говорит игра. */
  get lang() {
    const { lang } = this.options;
    return (typeof lang === 'function' ? lang() : lang).toLowerCase();
  }

  /** Есть ли голос браузера на языке игры. */
  get hasVoice() {
    return this.voice !== null;
  }

  /** Сможет ли игра произнести фразу: голосом или клипом. */
  canSay(text: string, clip?: string) {
    return this.hasVoice || Boolean(this.clipUrl(text, clip));
  }

  addClips(clips: Record<string, string>) {
    Object.assign(this.clips, clips);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.cancel();
  }

  setVolume(volume: number) {
    this.volume = clamp(volume);
  }

  /** Произнести фразу. Вернёт false, если сказать нечем (выключен звук, нет голоса и клипа). */
  say(text: string, opts: SayOptions = {}): boolean {
    if (this.muted || this.volume === 0 || !text) return false;
    this.cancel();
    if (this.voice && this.speech) {
      const phrase = new SpeechSynthesisUtterance(text);
      phrase.voice = this.voice;
      phrase.lang = this.voice.lang;
      phrase.rate = opts.rate ?? this.options.rate ?? 0.95;
      phrase.pitch = this.options.pitch ?? 1.15;
      phrase.volume = this.volume;
      this.speech.speak(phrase);
      return true;
    }
    const url = this.clipUrl(text, opts.clip);
    if (!url || typeof Audio === 'undefined') return false;
    this.clip = new Audio(url);
    this.clip.volume = this.volume;
    void this.clip.play().catch(() => undefined);
    return true;
  }

  cancel() {
    this.speech?.cancel();
    this.clip?.pause();
    this.clip = null;
  }

  dispose() {
    this.speech?.removeEventListener?.('voiceschanged', this.pickVoice);
    this.cancel();
  }

  private clipUrl(text: string, clip?: string) {
    return (clip && this.clips[clip]) || this.clips[text] || null;
  }

  private pickVoice = () => {
    const lang = this.lang.slice(0, 2);
    const voices = this.speech?.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang)) ?? [];
    const { prefer } = this.options;
    this.voice = (prefer && voices.find((v) => prefer.test(v.name))) || voices[0] || null;
  };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
