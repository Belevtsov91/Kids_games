// Языки интерфейса и речи.

export const languages = ['uk', 'ru', 'ro', 'en'] as const;
export type Language = (typeof languages)[number];
export const languageNames: Record<Language, string> = { uk: 'Українська', ru: 'Русский', ro: 'Română', en: 'English' };
export const locales: Record<Language, string> = { uk: 'uk-UA', ru: 'ru-RU', ro: 'ro-RO', en: 'en-GB' };
