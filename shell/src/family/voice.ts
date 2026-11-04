// Голосовой привет взрослого: запись лежит только на этом устройстве (IndexedDB), на сервер не уходит.

const DB = 'ig-family';
const STORE = 'voice';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export const saveVoice = (childId: string, blob: Blob) => run<void>('readwrite', (s) => s.put(blob, childId));

/** Чтение не должно создавать базу: пока взрослый ничего не записал, в браузере не остаётся ни следа. */
async function exists() {
  const list = await indexedDB.databases?.().catch(() => null);
  return list ? list.some((d) => d.name === DB) : true;
}

export async function loadVoice(childId: string): Promise<Blob | undefined> {
  if (typeof indexedDB === 'undefined' || !(await exists())) return undefined;
  return run<Blob | undefined>('readonly', (s) => s.get(childId)).catch(() => undefined);
}

export const removeVoice = (childId: string) => run<void>('readwrite', (s) => s.delete(childId)).catch(() => undefined);

/** Самая короткая запись: до 15 секунд, чтобы привет оставался приветом. */
export const MAX_SECONDS = 15;
