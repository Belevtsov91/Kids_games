// Шифр Цезаря: каждая буква сдвигается по алфавиту на одно и то же число (ключ).
// Алфавит передаётся строкой, поэтому одна и та же логика работает для всех языков.

/** Остаток, который всегда неотрицателен: mod(-1, 26) = 25. */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Буквы алфавита как массив (строка может содержать составные символы). */
export const lettersOf = (alphabet: string) => Array.from(alphabet);

/** Сдвигает одну букву; символы вне алфавита (пробел, дефис) остаются как есть. */
export function shiftLetter(letter: string, key: number, alphabet: string): string {
  const letters = lettersOf(alphabet);
  const index = letters.indexOf(letter);
  return index < 0 ? letter : letters[mod(index + key, letters.length)];
}

/** Шифрует слово ключом key. */
export const encode = (text: string, key: number, alphabet: string) =>
  Array.from(text)
    .map((letter) => shiftLetter(letter, key, alphabet))
    .join('');

/** Расшифровывает слово, зашифрованное ключом key. */
export const decode = (text: string, key: number, alphabet: string) => encode(text, -key, alphabet);

/** Ключ приводится к 0…n-1, чтобы колесо и проверка говорили об одном и том же. */
export const normalizeKey = (key: number, alphabet: string) => mod(key, lettersOf(alphabet).length);

/** Все ли буквы слова есть в алфавите — нужно для проверки словарей. */
export const fitsAlphabet = (word: string, alphabet: string) => {
  const letters = new Set(lettersOf(alphabet));
  return Array.from(word).every((letter) => letters.has(letter));
};
