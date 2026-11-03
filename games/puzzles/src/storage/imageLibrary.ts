// Свои картинки ребёнка хранятся в IndexedDB этого устройства, отдельно для каждого профиля.

export interface SavedPuzzleImage {
  id: string;
  title: string;
  imageUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

const LEGACY_DB = 'interact-games-puzzles';
const STORE = 'images';
/** Больше не нужно: детали всё равно маленькие, а база не разрастается от фото с телефона. */
const MAX_SIDE = 1600;

const openDb = (name: string): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = <T>(db: IDBDatabase, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/** Раньше картинки всех детей лежали в одной общей базе. Её отдаём первому, кто откроет игру. */
async function adoptLegacy(db: IDBDatabase): Promise<void> {
  const known = (await indexedDB.databases?.())?.some((info) => info.name === LEGACY_DB);
  if (!known) return;
  const legacy = await openDb(LEGACY_DB);
  const images = await run<SavedPuzzleImage[]>(legacy, 'readonly', (store) => store.getAll());
  for (const image of images) await run(db, 'readwrite', (store) => store.put(image));
  legacy.close();
  indexedDB.deleteDatabase(LEGACY_DB);
}

export interface ImageLibrary {
  list(): Promise<SavedPuzzleImage[]>;
  save(image: SavedPuzzleImage): Promise<void>;
  remove(id: string): Promise<void>;
}

export function openLibrary(profileId: string | null): ImageLibrary {
  const ready = (async () => {
    const db = await openDb(`${LEGACY_DB}:${profileId ?? 'guest'}`);
    if (profileId) await adoptLegacy(db).catch(() => undefined);
    return db;
  })();
  return {
    async list() {
      const images = await run<SavedPuzzleImage[]>(await ready, 'readonly', (store) => store.getAll());
      return images.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async save(image) {
      await run(await ready, 'readwrite', (store) => store.put(image));
    },
    async remove(id) {
      await run(await ready, 'readwrite', (store) => store.delete(id));
    },
  };
}

/** Читает файл, уменьшает большую фотографию и отдаёт data URL с размерами. */
export async function prepareImage(file: File): Promise<{ imageUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const webp = canvas.toDataURL('image/webp', 0.86);
  const imageUrl = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.86);
  return { imageUrl, width, height };
}
