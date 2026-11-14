import { env } from '../../config/env.js';

// Сообщения владельцу в Telegram: тревоги и утренняя сводка. Токен бота и id чата — только из переменных окружения.

export const telegramEnabled = Boolean(env.admin.telegramToken && env.admin.telegramChat);

/** true — сообщение принято Telegram. Ошибки наружу не бросает: тревога не должна ронять проверку. */
export async function sendTelegram(text: string): Promise<boolean> {
  if (!telegramEnabled) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${env.admin.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.admin.telegramChat, text: text.slice(0, 3500), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
