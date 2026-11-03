import { useEffect, useState } from 'react';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import { kidApi } from '@/kid/KidStatus';
import { albumOf, stickerTitle } from '@/kid/stickers';
import { useKidText } from '@/kid/text';
import { KidFrame } from '@/kid/pages/KidFrame';
import { useMoreText } from '../text';

type Earned = { gameId: string; sticker: string; seen: boolean };

/** Альбом наклеек (/me/stickers): все наклейки каталога, полученные — цветные, новые подпрыгивают. */
export function KidStickersPage() {
  const k = useKidText();
  const m = useMoreText().stickers;
  const { locale } = useI18n();
  const [earned, setEarned] = useState<Earned[] | null>(null);

  useEffect(() => {
    kidApi.get<{ stickers: Earned[] }>('/stickers').then(
      (r) => {
        setEarned(r.stickers);
        if (r.stickers.some((s) => !s.seen)) void kidApi.post('/stickers/seen', {}).catch(() => undefined);
      },
      () => setEarned([]),
    );
  }, []);

  const album = albumOf(earned ?? []);
  const all = album.reduce((n, g) => n + g.slots.length, 0);
  const got = album.reduce((n, g) => n + g.slots.filter((s) => s.earned).length, 0);

  return (
    <KidFrame back={{ to: '/me', label: k.me.toMe }}>
      <h1 className="kid-title">{m.title}</h1>
      <p className="kid-sub">{m.lead(got, all)}</p>
      <div className="album">
        {album.map(({ game, slots }) => (
          <section key={game.id} className="kid-card album-page">
            <h2>{game.emoji} {gameTitle(game, locale)}</h2>
            <ul className="album-grid">
              {slots.map((s) => (
                <li key={s.sticker.id} className={`album-slot${s.earned ? ' is-got' : ''}${s.fresh ? ' is-fresh' : ''}`}>
                  <span className="album-emoji" aria-hidden="true">{s.sticker.emoji}</span>
                  <span className="album-name">{s.earned ? stickerTitle(s.sticker, locale) : m.hidden}</span>
                  {s.fresh && <b className="album-new">{m.fresh}</b>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </KidFrame>
  );
}
