import { useState } from 'react';
import { useI18n } from '../i18n';
import { useFeedback } from '../ui/feedback';

/** Фото или рисунок: скрыто, пока не нажмут. Просмотр сервер записывает в журнал. */
export function MediaButton({ label, load }: { label: string; load: () => Promise<string> }) {
  const { t } = useI18n();
  const { toast } = useFeedback();
  const [src, setSrc] = useState<string | null>(null);
  if (src) {
    return (
      <div className="modal" role="dialog" aria-modal="true" onClick={() => setSrc(null)}>
        <div className="box wide">
          <img className="media-img" src={src} alt="" />
          <span className="note">{t('media.logged')}</span>
          <button className="btn" onClick={() => setSrc(null)}>{t('close')}</button>
        </div>
      </div>
    );
  }
  return (
    <button className="btn sm" onClick={() => void load().then(setSrc).catch((e: Error) => toast(e.message, true))}>
      {label}
    </button>
  );
}
