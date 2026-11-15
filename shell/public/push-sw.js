// Push-уведомления взрослому. Подключается в сервис-воркер Workbox через importScripts (vite.config.ts).
// Кнопки «Разрешить» / «Не сегодня» отвечают сразу (подписанный токен, как в письме), без открытия сайта.
/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data ? event.data.text() : 'Interact Games' };
  }
  const actions = (data.actions || []).map((a) => ({ action: a.action, title: a.title }));
  event.waitUntil(
    self.registration.showNotification(data.title || 'Interact Games', {
      body: data.body || '',
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      requireInteraction: actions.length > 0,
      actions,
      data,
    }),
  );
});

async function answer(data, action) {
  const pick = (data.actions || []).find((a) => a.action === action);
  if (!pick) return;
  let status = 'gone';
  try {
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: pick.token }),
      credentials: 'omit',
    });
    if (res.ok) status = (await res.json()).status || 'gone';
  } catch {
    status = 'gone';
  }
  const done = data.done || {};
  await self.registration.showNotification(data.title || 'Interact Games', {
    body: done[status] || '',
    tag: data.tag,
    icon: '/favicon.svg',
    data: { url: data.url },
  });
}

async function open(url) {
  const target = new URL(url || '/parent/inbox', self.location.origin).href;
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const w of wins) {
    if (w.url.startsWith(self.location.origin) && 'focus' in w) {
      await w.focus();
      if ('navigate' in w) await w.navigate(target).catch(() => {});
      return;
    }
  }
  await self.clients.openWindow(target);
}

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  event.notification.close();
  event.waitUntil(event.action === 'allow' || event.action === 'deny' ? answer(data, event.action) : open(data.url));
});
