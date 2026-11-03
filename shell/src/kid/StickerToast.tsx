import { useCallback, useEffect, useState } from 'react';
import type { GameManifest, StickerDef } from '@ig/sdk';
import { useI18n } from '@/i18n/I18nProvider';
import { stickerTitle } from './stickers';

/** Наклейка вылетает поверх игры на 3 секунды. Игра не останавливается. */
export function useStickerToast() {
  const [sticker, setSticker] = useState<StickerDef | null>(null);
  useEffect(() => {
    if (!sticker) return;
    const id = setTimeout(() => setSticker(null), 3200);
    return () => clearTimeout(id);
  }, [sticker]);
  const showSticker = useCallback((game: GameManifest, id: string) => {
    const def = game.stickers?.find((s) => s.id === id);
    if (def) setSticker(def);
  }, []);
  return { sticker, showSticker };
}

export function StickerToast({ sticker }: { sticker: StickerDef }) {
  const { locale } = useI18n();
  return (
    <div className="sticker-toast" role="status" aria-live="polite">
      <span className="sticker-toast-emoji" aria-hidden="true">{sticker.emoji}</span>
      <span className="sticker-toast-title">{stickerTitle(sticker, locale)}</span>
    </div>
  );
}
