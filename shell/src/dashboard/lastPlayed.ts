// Последняя игра ребёнка — для портала «Продолжить». Это не секрет, а удобство, как язык сайта,
// поэтому лежит в localStorage этого браузера: ключ на профиль ребёнка.
const key = (childId: string) => `ig:last-game:${childId}`;

export function rememberGame(childId: string, gameId: string) {
  try {
    localStorage.setItem(key(childId), gameId);
  } catch {
    // приватный режим или запрет хранилища: просто не запоминаем
  }
}

export function lastGame(childId: string): string | null {
  try {
    return localStorage.getItem(key(childId));
  } catch {
    return null;
  }
}
