import { papi } from './api';

// Push-уведомления на этом устройстве: подписка браузера и её регистрация на сервере.

export type PushState = 'on' | 'off' | 'denied' | 'unsupported' | 'install' | 'disabled';

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

/** iPhone и iPad: push работает только у сайта, добавленного на экран «Домой». */
export function needsInstall(ua = navigator.userAgent, standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true) {
  return /iPhone|iPad|iPod/.test(ua) && !standalone;
}

/** Ключ VAPID (base64url) → байты для pushManager.subscribe. */
export function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  return navigator.serviceWorker.ready;
}

export async function pushState(): Promise<PushState> {
  if (!supported()) return needsInstall() ? 'install' : 'unsupported';
  const { enabled } = await papi.get<{ enabled: boolean }>('/push');
  if (!enabled) return 'disabled';
  if (Notification.permission === 'denied') return 'denied';
  const sub = await (await registration()).pushManager.getSubscription();
  return sub ? 'on' : 'off';
}

export async function enablePush(): Promise<PushState> {
  const { key } = await papi.get<{ key: string | null }>('/push');
  if (!key) return 'disabled';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  await papi.post('/push', { endpoint: json.endpoint, keys: json.keys });
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const sub = await (await registration()).pushManager.getSubscription();
  if (sub) {
    await papi.delete('/push', { endpoint: sub.endpoint }).catch(() => undefined);
    await sub.unsubscribe();
  }
  return 'off';
}
