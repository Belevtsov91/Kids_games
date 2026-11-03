import { Link } from 'react-router';
import { papi, type Overview } from '../api';
import { useParentText } from '../text';
import { KidCard } from '../ui/KidCard';
import { PageHead } from '../ui/bits';
import { useLoad } from '../ui/useLoad';

/** Список детей: карточки и «Добавить ребёнка». */
export function KidsPage() {
  const p = useParentText();
  const { data } = useLoad(() => papi.get<Overview>('/overview'), []);
  return (
    <>
      <PageHead eyebrow={p.overview.eyebrow} title={p.kids.title} lead={p.kids.lead}>
        <Link to="/parent/kids/new" className="pa-btn pa-btn-gold">+ {p.overview.add}</Link>
      </PageHead>
      <div className="pa-kids">
        {data?.children.map((k) => (
          <KidCard key={k.id} child={k} />
        ))}
      </div>
    </>
  );
}
