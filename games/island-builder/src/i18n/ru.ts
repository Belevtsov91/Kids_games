// Тексты: русский (образец формы для остальных языков).
import type { Tool } from '../game/blocks';
import type { BlockType, TreeKind } from '../game/world';
import type { SaveStatus } from '../app/useIslandSave';

export const ru = {
  title: 'Остров-конструктор',
  status: { loading: 'Загрузка…', saving: 'Сохраняю…', saved: 'Сохранено ✓', offline: 'Без сохранения' } as Record<SaveStatus, string>,
  undo: 'Отменить',
  makeDay: 'Сделать день',
  makeNight: 'Сделать ночь',
  day: 'День',
  night: 'Ночь',
  quests: 'Задания',
  newIsland: 'Новый остров',
  material: 'Материал',
  plant: 'Растение',
  tool: 'Инструмент',
  questDone: 'Задание выполнено!',
  tooManyTrees: 'Деревьев уже очень много — выкопай какое-нибудь',
  boatOnWater: 'Лодку можно спустить только на воду',
  loading: 'Плывём к острову…',
  howTo: 'Как играть',
  welcome: '🏝️ Твой остров!',
  welcomeTips: ['Нажми на остров — поставишь блок', 'Веди пальцем или мышью — крути камеру', 'Двумя пальцами или колёсиком — приближай', 'Выполняй задания и строй что захочешь'],
  play: 'Строить!',
  newText: 'Текущий остров исчезнет. Задания и счётчики останутся.',
  newKinds: ['Случайный остров', 'Ровная поляна', 'Только море'],
  cancel: 'Оставить как есть',
  blocks: {
    grass: 'Трава', sand: 'Песок', stone: 'Камень', wood: 'Доски', brick: 'Кирпич', glass: 'Стекло', snow: 'Снег', lantern: 'Фонарь',
  } as Record<BlockType, string>,
  trees: { palm: 'Пальма', pine: 'Ель', round: 'Дуб', flowers: 'Цветы' } as Record<TreeKind, string>,
  tools: {
    build: ['Строить', 'Нажми на блок или дно — появится новый блок'],
    paint: ['Красить', 'Нажми на блок, чтобы сменить материал'],
    dig: ['Копать', 'Нажми на блок или дерево, чтобы убрать'],
    tree: ['Сажать', 'Нажми на траву, песок или снег'],
    boat: ['Лодка', 'Нажми на воду — спустишь лодку. Нажми на лодку — толкнёшь'],
    crate: ['Ящик', 'Нажми куда угодно — сверху упадёт ящик'],
  } as Record<Tool, [string, string]>,
  questTitles: {
    builder: 'Поставь 15 блоков',
    gardener: 'Посади 8 деревьев',
    tower: 'Построй башню высотой 11',
    sailor: 'Спусти на воду 3 лодки',
    designer: 'Используй 6 разных материалов',
    lights: 'Поставь 4 фонаря',
    painter: 'Перекрась 10 блоков',
    digger: 'Выкопай бухту: убери 20 блоков',
    cargo: 'Сбрось 10 ящиков',
  } as Record<string, string>,
};

export type Texts = typeof ru;
