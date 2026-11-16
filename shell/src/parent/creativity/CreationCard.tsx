import { useEffect, useRef, type CSSProperties } from 'react';
import type { CreationView, CreationsSdk } from '@ig/sdk';
import { gameTitle, useI18n } from '@/i18n/I18nProvider';
import type { FeedItem } from './registry';

interface Props {
  item: FeedItem;
  sdk: CreationsSdk;
  /** Показанные работы страницы: когда одна зазвучала, остальные замолкают. */
  views: Map<string, CreationView>;
  removeLabel: string;
  onRemove?: (item: FeedItem) => void;
}

/** Карточка работы: тело рисует игра, подпись (название, игра, дата) и «Удалить» — оболочка. */
export function CreationCard({ item, sdk, views, removeLabel, onRemove }: Props) {
  const { locale } = useI18n();
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const quietOthers = () => views.forEach((view, key) => key !== item.key && view.stop?.());
    const view = item.module.mount(el, item, sdk, quietOthers);
    views.set(item.key, view);
    return () => {
      views.delete(item.key);
      view.unmount();
    };
  }, [item, sdk, views]);

  const date = new Date(item.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <figure className={`pa-creation is-${item.kind}`} style={{ '--game': item.game.color ?? '#7c6cff' } as CSSProperties}>
      <div className="pa-creation-body" ref={body} />
      <figcaption>
        <strong>{item.title}</strong>
        <span className="pa-creation-meta">
          <span aria-hidden="true">{item.game.emoji}</span> {gameTitle(item.game, locale)} · <time dateTime={item.createdAt}>{date}</time>
        </span>
        {onRemove && item.module.remove && (
          <button type="button" className="pa-creation-remove" onClick={() => onRemove(item)}>
            🗑 {removeLabel}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
