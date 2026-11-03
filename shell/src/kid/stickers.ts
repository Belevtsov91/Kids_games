import type { GameManifest, Locale, StickerDef } from '@ig/sdk';
import { games } from '@/catalog/catalog';

export const stickerTitle = (s: StickerDef, locale: Locale) => s.titles?.[locale] ?? s.title;

export interface AlbumSlot {
  game: GameManifest;
  sticker: StickerDef;
  earned: boolean;
  /** Новая, ещё не показанная в альбоме. */
  fresh: boolean;
}

/** Все наклейки каталога по играм; полученные отмечены. */
export function albumOf(earned: { gameId: string; sticker: string; seen: boolean }[]) {
  const got = new Map(earned.map((e) => [`${e.gameId}/${e.sticker}`, e]));
  return games
    .filter((g) => g.stickers?.length)
    .map((game) => ({
      game,
      slots: game.stickers!.map<AlbumSlot>((sticker) => {
        const e = got.get(`${game.id}/${sticker.id}`);
        return { game, sticker, earned: Boolean(e), fresh: Boolean(e && !e.seen) };
      }),
    }));
}
