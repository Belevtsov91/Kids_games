// Тексты писем родителю на четырёх языках: просьба о времени, отчёт за неделю, приглашение помощника.

export const MAIL_LANGS = ['ru', 'uk', 'ro', 'en'] as const;
export type MailLang = (typeof MAIL_LANGS)[number];
export const mailLang = (v: unknown): MailLang => ((MAIL_LANGS as readonly unknown[]).includes(v) ? (v as MailLang) : 'ru');

interface Texts {
  footer: string;
  request: { subject: (n: string, m: number) => string; line: (n: string, m: number) => string; allow: (m: number) => string; deny: string; open: string };
  answered: { approved: (n: string, m: number) => string; denied: (n: string) => string; gone: string };
  weekly: {
    subject: string;
    title: string;
    lead: string;
    played: string;
    favorite: string;
    learned: string;
    stickers: string;
    none: string;
    open: string;
    off: string;
    tips: string[];
  };
  helper: { subject: (parent: string) => string; title: (name: string) => string; line: (parent: string) => string; open: string };
}

export const MAIL_TEXT: Record<MailLang, Texts> = {
  ru: {
    footer: 'Interact Games · Письмо пришло, потому что вы включили его в кабинете родителя.',
    request: { subject: (n, m) => `${n} просит ещё ${m} минут`, line: (n, m) => `${n} просит ещё ${m} минут игры сегодня. Ответьте одной кнопкой — ребёнок сразу увидит ответ.`, allow: (m) => `Разрешить ${m} мин`, deny: 'Не сегодня', open: 'Открыть кабинет' },
    answered: { approved: (n, m) => `${n} получает ещё ${m} минут.`, denied: (n) => `${n} увидит: «На сегодня всё».`, gone: 'На эту просьбу уже ответили или ссылка устарела.' },
    weekly: {
      subject: 'Неделя в Interact Games', title: 'Как прошла неделя', lead: 'Коротко о том, сколько и во что играли дети.',
      played: 'Сыграно', favorite: 'Любимая игра', learned: 'Получается', stickers: 'Новых наклеек', none: '—',
      open: 'Подробнее в кабинете', off: 'Отключить отчёт можно в кабинете: «Просьбы и письма».',
      tips: ['Поиграйте вместе 10 минут: спросите, что получается лучше всего.', 'Договоритесь о времени заранее — тогда «время вышло» проходит без слёз.', 'Перед сном лучше спокойные игры: рисование, «Тёпа идёт спать».'],
    },
    helper: { subject: (p) => `${p} приглашает вас помогать с детьми`, title: (n) => `${n}, здравствуйте!`, line: (p) => `${p} дал(а) вам ссылку: по ней можно отвечать на просьбы детей «ещё немного поиграть». Пароль не нужен, настройки недоступны.`, open: 'Открыть просьбы' },
  },
  uk: {
    footer: 'Interact Games · Лист прийшов, бо ви увімкнули його в кабінеті батьків.',
    request: { subject: (n, m) => `${n} просить ще ${m} хвилин`, line: (n, m) => `${n} просить ще ${m} хвилин гри сьогодні. Дайте відповідь однією кнопкою — дитина одразу побачить.`, allow: (m) => `Дозволити ${m} хв`, deny: 'Не сьогодні', open: 'Відкрити кабінет' },
    answered: { approved: (n, m) => `${n} отримує ще ${m} хвилин.`, denied: (n) => `${n} побачить: «На сьогодні все».`, gone: 'На це прохання вже відповіли або посилання застаріло.' },
    weekly: {
      subject: 'Тиждень в Interact Games', title: 'Як минув тиждень', lead: 'Коротко про те, скільки і в що грали діти.',
      played: 'Зіграно', favorite: 'Улюблена гра', learned: 'Виходить', stickers: 'Нових наліпок', none: '—',
      open: 'Докладніше в кабінеті', off: 'Вимкнути звіт можна в кабінеті: «Прохання і листи».',
      tips: ['Пограйте разом 10 хвилин: запитайте, що виходить найкраще.', 'Домовтеся про час заздалегідь — тоді «час вийшов» минає без сліз.', 'Перед сном краще спокійні ігри: малювання, «Тьопа йде спати».'],
    },
    helper: { subject: (p) => `${p} запрошує вас допомагати з дітьми`, title: (n) => `${n}, вітаємо!`, line: (p) => `${p} дав(ла) вам посилання: за ним можна відповідати на прохання дітей «ще трохи пограти». Пароль не потрібен, налаштування недоступні.`, open: 'Відкрити прохання' },
  },
  ro: {
    footer: 'Interact Games · Primești acest e-mail pentru că l-ai activat în contul de părinte.',
    request: { subject: (n, m) => `${n} cere încă ${m} minute`, line: (n, m) => `${n} cere încă ${m} minute de joacă azi. Răspunde cu un buton — copilul vede imediat răspunsul.`, allow: (m) => `Permite ${m} min`, deny: 'Nu azi', open: 'Deschide contul' },
    answered: { approved: (n, m) => `${n} primește încă ${m} minute.`, denied: (n) => `${n} va vedea: „Gata pe azi”.`, gone: 'S-a răspuns deja la această cerere sau linkul a expirat.' },
    weekly: {
      subject: 'Săptămâna în Interact Games', title: 'Cum a fost săptămâna', lead: 'Pe scurt: cât și la ce s-au jucat copiii.',
      played: 'Timp de joc', favorite: 'Jocul preferat', learned: 'Îi reușește', stickers: 'Abțibilduri noi', none: '—',
      open: 'Detalii în cont', off: 'Poți opri raportul în cont: „Cereri și e-mailuri”.',
      tips: ['Jucați-vă împreună 10 minute: întreabă ce îi reușește cel mai bine.', 'Stabiliți timpul dinainte — atunci „timpul s-a terminat” trece fără lacrimi.', 'Înainte de somn, jocuri liniștite: desen, „Teo merge la culcare”.'],
    },
    helper: { subject: (p) => `${p} te invită să ajuți cu copiii`, title: (n) => `Bună, ${n}!`, line: (p) => `${p} ți-a dat un link: prin el poți răspunde la cererile copiilor „încă puțină joacă”. Fără parolă, fără acces la setări.`, open: 'Deschide cererile' },
  },
  en: {
    footer: 'Interact Games · You get this email because you turned it on in the parent area.',
    request: { subject: (n, m) => `${n} is asking for ${m} more minutes`, line: (n, m) => `${n} is asking for ${m} more minutes of play today. Answer with one button — they will see it right away.`, allow: (m) => `Allow ${m} min`, deny: 'Not today', open: 'Open parent area' },
    answered: { approved: (n, m) => `${n} gets ${m} more minutes.`, denied: (n) => `${n} will see “That’s all for today”.`, gone: 'This request was already answered or the link has expired.' },
    weekly: {
      subject: 'Your week in Interact Games', title: 'How the week went', lead: 'A short summary of how long and what your children played.',
      played: 'Played', favorite: 'Favourite game', learned: 'Got it', stickers: 'New stickers', none: '—',
      open: 'More in the parent area', off: 'You can turn this report off in the parent area: “Requests & email”.',
      tips: ['Play together for 10 minutes and ask what they are best at.', 'Agree on screen time in advance — then “time is up” goes without tears.', 'Before bed, pick calm games: drawing or “Teddy’s Bedtime”.'],
    },
    helper: { subject: (p) => `${p} invites you to help with the kids`, title: (n) => `Hi, ${n}!`, line: (p) => `${p} gave you a link to answer the kids’ “a bit more play time” requests. No password, no access to settings.`, open: 'Open requests' },
  },
};
