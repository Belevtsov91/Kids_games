import type { GameSdk } from '@ig/sdk';
import { beatsApi } from '../api/beats';
import { noteCount, type Groove } from '../game/pattern';
import { STICKERS } from '../game/stickers';
import { tr } from '../i18n';

/** Сохраняет бит на сервер игры; пустой бит не сохраняем. Возвращает, получилось ли. */
export async function saveBeat(sdk: GameSdk, groove: Groove, title: string, toast: (text: string) => void): Promise<boolean> {
  const t = tr();
  if (!noteCount(groove.pattern)) {
    toast(t.emptyBeat);
    return false;
  }
  try {
    await beatsApi(sdk.api).save(title, groove);
    toast(t.saved);
    sdk.progress.sticker(STICKERS.myBeat);
    sdk.progress.skill('creativity', true);
    return true;
  } catch {
    toast(sdk.profile ? t.saveFailed : t.needProfile);
    return false;
  }
}
