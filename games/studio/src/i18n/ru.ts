// Тексты: русский. По этому словарю типизированы остальные языки.
import type { PresetId } from '../game/presets';
import type { Row } from '../game/kit';

export interface Texts {
  title: string;
  rows: Record<Row, string>;
  pads: string[];
  play: string;
  stop: string;
  rec: string;
  recHint: string;
  tempo: string;
  slower: string;
  faster: string;
  swing: string;
  clear: string;
  clearSure: string;
  cleared: string;
  presets: string;
  presetNames: Record<PresetId, string>;
  save: string;
  shelf: string;
  nameLabel: string;
  defaultTitle: string;
  saved: string;
  saveFailed: string;
  loadFailed: string;
  removeFailed: string;
  shareFailed: string;
  needProfile: string;
  emptyBeat: string;
  empty: string;
  close: string;
  open: string;
  opened: (title: string) => string;
  remove: string;
  removeSure: string;
  share: string;
  shared: string;
  sharedToast: string;
  track: (pad: string) => string;
  cell: (pad: string, step: number, on: boolean) => string;
  padLabel: (pad: string, key: string) => string;
  notes: (n: number) => string;
  tyopa: string;
  tips: string[];
  cheers: string[];
}

export const ru: Texts = {
  title: 'Бит-студия',
  rows: { drums: 'Барабаны', bass: 'Бас', keys: 'Аккорды', fx: 'Эффекты' },
  pads: ['Бочка', 'Малый', 'Хэт', 'Хлопок', 'Ля', 'Фа', 'До', 'Соль', 'Am', 'F', 'C', 'G', 'Эй!', 'Лазер', 'Звон', 'Скрэтч'],
  play: 'Играть',
  stop: 'Стоп',
  rec: 'Запись',
  recHint: 'Запись включена: стучи по пэдам — удары лягут в ритм',
  tempo: 'Темп',
  slower: 'Медленнее',
  faster: 'Быстрее',
  swing: 'Свинг',
  clear: 'Очистить',
  clearSure: 'Точно очистить?',
  cleared: '🧽 Чисто! Начнём заново',
  presets: 'Заготовки',
  presetNames: { basic: 'Простой', hiphop: 'Хип-хоп', dance: 'Танцевальный', reggae: 'Регги' },
  save: 'Сохранить',
  shelf: 'Мои биты',
  nameLabel: 'Название бита',
  defaultTitle: 'Мой бит',
  saved: '💾 Бит сохранён!',
  saveFailed: '😕 Не получилось сохранить',
  loadFailed: '😕 Не получилось загрузить',
  removeFailed: '😕 Не получилось удалить',
  shareFailed: '😕 Не получилось поделиться',
  needProfile: 'Чтобы сохранять биты, выбери свой профиль',
  emptyBeat: 'Сначала добавь хотя бы одну ноту',
  empty: '🎧 Пока ни одного бита',
  close: 'Закрыть',
  open: 'Открыть',
  opened: (title) => `🎶 Открыли «${title}»`,
  remove: 'Удалить',
  removeSure: 'Точно удалить?',
  share: 'Показать родителям',
  shared: 'Родители слышат ✓',
  sharedToast: '👪 Родители смогут послушать этот бит',
  track: (pad) => `Дорожка: ${pad}`,
  cell: (pad, step, on) => `${pad}, шаг ${step}${on ? ', включён' : ''}`,
  padLabel: (pad, key) => `${pad} (клавиша ${key.toUpperCase()})`,
  notes: (n) => `Нот: ${n}`,
  tyopa: 'Тёпа',
  tips: [
    'Йо! Я Тёпа. Жми на пэды — это мои барабаны!',
    'Нажми «Играть», а потом включай клеточки справа.',
    'Бочка на 1, 5, 9 и 13 — и уже качает!',
    'Попробуй свинг: ритм начнёт пританцовывать.',
    'Включи «Запись» и стучи по пэдам прямо во время игры.',
    'Бас и аккорды подобраны так, что любые сочетания звучат красиво.',
    'Клавиши 1234 / QWER / ASDF / ZXCV — тоже пэды!',
  ],
  cheers: ['Качает!', 'Огонь!', 'Вот это бит!', 'Класс!', 'Супер грув!'],
};
