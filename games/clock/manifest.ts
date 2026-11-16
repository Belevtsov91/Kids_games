import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'clock',
  title: 'Который час',
  titles: { uk: 'Котра година', ro: 'Cât e ceasul', en: 'What Time Is It' },
  emoji: '🕰️',
  kind: '2d',
  ages: { min: 5, max: 8 },
  skills: ['numbers', 'routine', 'motor'],
  about: 'Учимся узнавать время по стрелочным часам: ровные часы, половинки, четверти и по пять минут. Заодно — распорядок дня: когда завтрак, прогулка и сон.',
  abouts: {
    uk: 'Вчимося визначати час за стрілковим годинником: рівні години, половинки, чверті й по п’ять хвилин. Заодно — розпорядок дня: коли сніданок, прогулянка і сон.',
    ro: 'Învățăm să citim ceasul cu ace: ore fixe, jumătăți, sferturi și din cinci în cinci minute. Și programul zilei: când e micul dejun, plimbarea și somnul.',
    en: 'Learning to read an analogue clock: o’clock, half past, quarters and five-minute steps. Plus a daily routine: when it’s breakfast, a walk and bedtime.',
  },
  together: 'Повесьте дома часы со стрелками и спрашивайте ребёнка, который час, перед привычными делами: «Через полчаса ужин — где будет длинная стрелка?»',
  togethers: {
    uk: 'Повісьте вдома годинник зі стрілками й питайте дитину, котра година, перед звичними справами: «За пів години вечеря — де буде довга стрілка?»',
    ro: 'Puneți acasă un ceas cu ace și întrebați copilul cât e ceasul înainte de activitățile obișnuite: „Peste o jumătate de oră e cina — unde va fi acul lung?”',
    en: 'Hang an analogue clock at home and ask your child the time before everyday routines: “Dinner is in half an hour — where will the long hand be?”',
  },
  stickers: [
    { id: 'first-day', emoji: '🕰️', title: 'Первый день по часам', titles: { uk: 'Перший день за годинником', ro: 'Prima zi după ceas', en: 'First day by the clock' } },
    { id: 'hours', emoji: '🕗', title: 'Ровные часы', titles: { uk: 'Рівні години', ro: 'Ore fixe', en: 'O’clock' } },
    { id: 'half-past', emoji: '🕣', title: 'Половинки', titles: { uk: 'Половинки', ro: 'Jumătăți', en: 'Half past' } },
    { id: 'quarters', emoji: '🕘', title: 'Четверти', titles: { uk: 'Чверті', ro: 'Sferturi', en: 'Quarters' } },
    { id: 'five-minutes', emoji: '⏱️', title: 'По пять минут', titles: { uk: 'По п’ять хвилин', ro: 'Din cinci în cinci', en: 'Five minutes' } },
    { id: 'no-mistakes', emoji: '⭐', title: 'День без ошибок', titles: { uk: 'День без помилок', ro: 'Zi fără greșeli', en: 'A day without mistakes' } },
    { id: 'seven-days', emoji: '📅', title: 'Целая неделя', titles: { uk: 'Цілий тиждень', ro: 'O săptămână întreagă', en: 'A whole week' } },
  ],
  tagline: 'Помоги Тёпе не проспать: ставь стрелки на часах башни.',
  taglines: { uk: 'Допоможи Тьопі не проспати: став стрілки на годиннику вежі.', ro: 'Ajută-l pe Teo să nu întârzie: mută acele ceasului din turn.', en: 'Help Teddy stay on time: set the hands on the tower clock.' },
  color: '#ffc98a',
  addedAt: '2026-11-15',
});
