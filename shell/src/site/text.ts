import { useI18n } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/locale';

// Тексты заглушки обслуживания, объявления и выключенной игры.

const ru = {
  maintenanceTitle: 'Тёпа наводит порядок',
  maintenanceText: 'Сейчас мы обновляем сайт. Это ненадолго — страница откроется сама, как только всё будет готово.',
  maintenanceParents: 'Для взрослых: прогресс и рисунки детей сохранены.',
  retry: 'Проверить ещё раз',
  close: 'Закрыть объявление',
  gameOffTitle: 'Эта игра отдыхает',
  gameOffText: 'Мы её чиним и скоро вернём. А пока выбери другую!',
  back: 'К играм',
};
export type SiteText = typeof ru;

const uk: SiteText = {
  maintenanceTitle: 'Тьопа наводить лад',
  maintenanceText: 'Зараз ми оновлюємо сайт. Це ненадовго — сторінка відкриється сама, щойно все буде готово.',
  maintenanceParents: 'Для дорослих: прогрес і малюнки дітей збережені.',
  retry: 'Перевірити ще раз',
  close: 'Закрити оголошення',
  gameOffTitle: 'Ця гра відпочиває',
  gameOffText: 'Ми її лагодимо і скоро повернемо. А поки обери іншу!',
  back: 'До ігор',
};

const ro: SiteText = {
  maintenanceTitle: 'Tiopa face ordine',
  maintenanceText: 'Acum actualizăm site-ul. Durează puțin — pagina se va deschide singură imediat ce totul e gata.',
  maintenanceParents: 'Pentru adulți: progresul și desenele copiilor sunt salvate.',
  retry: 'Verifică din nou',
  close: 'Închide anunțul',
  gameOffTitle: 'Acest joc se odihnește',
  gameOffText: 'Îl reparăm și îl aducem înapoi curând. Până atunci, alege alt joc!',
  back: 'La jocuri',
};

const en: SiteText = {
  maintenanceTitle: 'Tyopa is tidying up',
  maintenanceText: 'We are updating the site right now. It won’t take long — the page will open by itself as soon as everything is ready.',
  maintenanceParents: 'For grown-ups: children’s progress and drawings are safe.',
  retry: 'Check again',
  close: 'Close announcement',
  gameOffTitle: 'This game is taking a rest',
  gameOffText: 'We are fixing it and will bring it back soon. Pick another one for now!',
  back: 'To games',
};

const TEXTS: Record<Locale, SiteText> = { ru, uk, ro, en };

export function useSiteText(): SiteText {
  return TEXTS[useI18n().locale];
}
