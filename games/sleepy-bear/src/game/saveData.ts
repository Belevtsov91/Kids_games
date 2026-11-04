import type { GameSdk } from '@ig/sdk';

// Сколько ночей Тёпа уже проспал. Хранится в облаке платформы (по ребёнку) и копией в браузере:
// без сети игра работает, а на другом устройстве счёт продолжится.

export interface Save {
  nights: number;
}

const KEY = 'progress';
const empty = (): Save => ({ nights: 0 });
const valid = (v: unknown): v is Save => typeof (v as Save)?.nights === 'number' && (v as Save).nights >= 0;

export async function loadSave(sdk: Pick<GameSdk, 'storage' | 'cloud' | 'profile'>): Promise<Save> {
  const local = sdk.storage.load<Save>(KEY);
  const cloud = sdk.profile ? await sdk.cloud.load<Save>(KEY).catch(() => null) : null;
  const best = [local, cloud].filter(valid).sort((a, b) => b.nights - a.nights)[0];
  return best ?? empty();
}

export async function storeSave(sdk: Pick<GameSdk, 'storage' | 'cloud' | 'profile'>, save: Save) {
  sdk.storage.save(KEY, save);
  if (sdk.profile) await sdk.cloud.save(KEY, save).catch(() => undefined);
}
