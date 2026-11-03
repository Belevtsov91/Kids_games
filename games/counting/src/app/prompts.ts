import type { Session } from '../game/Session';
import { languages, numberWord, words, type Language } from '../i18n';
import { LIMITS } from '../game/themes';
import type { Preferences } from './savedState';

// Мелкие чистые помощники контроллера: текст задания для озвучки и смена настроек на главном экране.

/** Что сказать вслух для задания: «Покорми … пять», «Сколько будет 3 + 2», «Посчитай …». */
export function promptSpeech(session: Pick<Session, 'mode' | 'question'>, speech: Language): string {
  const { mode, question: q } = session;
  const prompt = words[speech][mode];
  if (mode === 'feed') return `${prompt} ${numberWord(speech, q.answer)}`;
  if (mode === 'calculate') return `${prompt} ${q.a} ${q.subtract ? '−' : '+'} ${q.b}`;
  return prompt;
}

/** Применить выбор в списке (язык интерфейса, язык речи, предел счёта). Неизвестные значения игнорируются. */
export function applyPreference(prefs: Preferences, name: string, value: string) {
  const language = languages.includes(value as Language) ? (value as Language) : null;
  if (name === 'language' && language) prefs.language = language;
  if (name === 'speech' && language) prefs.speech = language;
  if (name === 'limit' && LIMITS.includes(Number(value))) prefs.limit = Number(value);
}
