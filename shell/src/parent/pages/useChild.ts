import { useParams } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { papi, type ChildDetail } from '../api';
import { useParent } from '../ParentShell';
import { useParentText } from '../text';
import { useLoad } from '../ui/useLoad';

/** Ребёнок со страницы /parent/kids/:id и сохранение его настроек с подтверждением «Сохранено». */
export function useChild() {
  const { id = '' } = useParams();
  const p = useParentText();
  const { toast } = useParent();
  const { refresh } = useAuth();
  const { data, error, reload } = useLoad(() => papi.get<ChildDetail>(`/children/${id}`), [id]);

  const save = async (patch: Record<string, unknown>, done = p.saved) => {
    try {
      await papi.patch(`/children/${id}`, patch);
      toast(done);
      await Promise.all([reload(), refresh()]);
      return true;
    } catch {
      toast(p.failed);
      return false;
    }
  };

  return { id, child: data, missing: error, reload, save };
}
