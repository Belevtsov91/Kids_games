import { useMemo, useState } from 'react';
import { CREATION_KINDS, type CreationKind, type CreationView, type CreationsSdk } from '@ig/sdk';
import { useI18n } from '@/i18n/I18nProvider';
import { CreationCard } from '../creativity/CreationCard';
import { creativeGames, loadFeed, type FeedItem } from '../creativity/registry';
import { creationsSdk } from '../creativity/sdk';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { PageHead, Panel } from '../ui/bits';
import { useLoad } from '../ui/useLoad';
import { useChild } from './useChild';

type Filter = 'all' | CreationKind;

/**
 * «Творчество»: всё, что ребёнок создал в играх, одной лентой — рисунки, мелодии, биты.
 * Игры подключаются сами (games/<id>/src/creations.ts), страница не знает их по именам.
 */
export function ChildCreativityPage() {
  const p = useParentText();
  const c = p.creativity;
  const { locale } = useI18n();
  const { toast } = useParent();
  const { id, child } = useChild();
  const [filter, setFilter] = useState<Filter>('all');
  const sources = useMemo(() => creativeGames(), []);
  const sdks = useMemo(() => new Map<string, CreationsSdk>(sources.map(({ game }) => [game.id, creationsSdk(game, id, locale)])), [sources, id, locale]);
  const views = useMemo(() => new Map<string, CreationView>(), []);
  const { data, error, setData } = useLoad(() => loadFeed(sources, (module, game) => module.list(sdks.get(game.id)!)), [sources, sdks]);

  if (!child) return null;
  const items = data?.items ?? [];
  const kinds = CREATION_KINDS.filter((k) => items.some((item) => item.kind === k));
  const shown = items.filter((item) => filter === 'all' || item.kind === filter);

  const remove = async (item: FeedItem) => {
    if (!confirm(c.confirm)) return;
    try {
      await item.module.remove?.(item, sdks.get(item.game.id)!);
      setData((d) => d && { ...d, items: d.items.filter((x) => x.key !== item.key) });
      toast(c.removed);
    } catch {
      toast(p.failed);
    }
  };

  return (
    <>
      <PageHead back={{ to: `/parent/kids/${id}`, label: child.name }} eyebrow={p.child.eyebrow} title={c.title} lead={c.lead} />
      <Panel className="pa-creativity">
        {kinds.length > 1 && (
          <div className="pa-seg pa-creativity-filters" role="group" aria-label={c.filter}>
            {(['all', ...kinds] as Filter[]).map((f) => (
              <button key={f} type="button" aria-pressed={f === filter} onClick={() => setFilter(f)}>
                {c.kinds[f]}
              </button>
            ))}
          </div>
        )}
        {(error || (data && data.failed.length > 0)) && <p className="pa-note">{c.partial}</p>}
        {data && items.length === 0 && <p className="pa-empty">{c.empty(child.name)}</p>}
        <div className="pa-creations">
          {shown.map((item) => (
            <CreationCard key={item.key} item={item} sdk={sdks.get(item.game.id)!} views={views} removeLabel={c.remove} onRemove={(x) => void remove(x)} />
          ))}
        </div>
      </Panel>
    </>
  );
}
