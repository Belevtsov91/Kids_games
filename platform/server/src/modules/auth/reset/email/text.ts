// Тексты письма «Восстановить пароль» на четырёх языках сайта. Язык присылает страница, где нажали «Забыли пароль?».

export const MAIL_LOCALES = ['ru', 'uk', 'ro', 'en'] as const;
export type MailLocale = (typeof MAIL_LOCALES)[number];

export interface ResetMailText {
  subject: string;
  preheader: string;
  hello: (name: string) => string;
  title: string;
  lead: string;
  button: string;
  expires: (min: number) => string;
  ignore: string;
  fallback: string;
  bear: string;
  footer: string;
}

export const RESET_MAIL_TEXT: Record<MailLocale, ResetMailText> = {
  ru: {
    subject: 'Новый ключ от волшебной двери 🗝️',
    preheader: 'Мишка-страж приготовил ссылку, чтобы придумать новый пароль.',
    hello: (name) => `Здравствуйте, ${name}!`,
    title: 'Забыли пароль? Бывает!',
    lead: 'Мишка-страж получил просьбу открыть волшебную дверь вашего острова. Нажмите на кнопку и придумайте новый пароль: миры детей ждут вас ровно там, где вы остановились.',
    button: 'Придумать новый пароль',
    expires: (min) => `Ссылка работает ${min} минут и только один раз.`,
    ignore: 'Если вы не просили сменить пароль, просто ничего не делайте: старый пароль продолжит работать, а дверь останется запертой.',
    fallback: 'Кнопка не нажимается? Скопируйте ссылку в браузер:',
    bear: 'Я сторожу дверь, пока вас нет!',
    footer: 'Это письмо отправлено автоматически, отвечать на него не нужно.',
  },
  uk: {
    subject: 'Новий ключ від чарівних дверей 🗝️',
    preheader: 'Ведмедик-вартовий приготував посилання, щоб вигадати новий пароль.',
    hello: (name) => `Вітаємо, ${name}!`,
    title: 'Забули пароль? Буває!',
    lead: 'Ведмедик-вартовий отримав прохання відчинити чарівні двері вашого острова. Натисніть кнопку й вигадайте новий пароль: світи дітей чекають на вас саме там, де ви зупинилися.',
    button: 'Вигадати новий пароль',
    expires: (min) => `Посилання діє ${min} хвилин і лише один раз.`,
    ignore: 'Якщо ви не просили змінити пароль, просто нічого не робіть: старий пароль і далі працюватиме, а двері залишаться зачиненими.',
    fallback: 'Кнопка не натискається? Скопіюйте посилання в браузер:',
    bear: 'Я вартую двері, поки вас немає!',
    footer: 'Цей лист надіслано автоматично, відповідати на нього не потрібно.',
  },
  ro: {
    subject: 'O cheie nouă pentru ușa fermecată 🗝️',
    preheader: 'Ursulețul-paznic a pregătit un link ca să alegi o parolă nouă.',
    hello: (name) => `Bună, ${name}!`,
    title: 'Ai uitat parola? Se întâmplă!',
    lead: 'Ursulețul-paznic a primit o cerere să deschidă ușa fermecată a insulei tale. Apasă butonul și alege o parolă nouă: lumile copiilor te așteaptă exact unde ai rămas.',
    button: 'Alege o parolă nouă',
    expires: (min) => `Linkul funcționează ${min} de minute și o singură dată.`,
    ignore: 'Dacă nu ai cerut schimbarea parolei, nu face nimic: parola veche rămâne valabilă, iar ușa rămâne încuiată.',
    fallback: 'Butonul nu merge? Copiază linkul în browser:',
    bear: 'Eu păzesc ușa cât ești plecat!',
    footer: 'Acest e-mail a fost trimis automat, nu este nevoie să răspunzi.',
  },
  en: {
    subject: 'A new key for the magic door 🗝️',
    preheader: 'The guardian bear has a link ready so you can choose a new password.',
    hello: (name) => `Hi ${name}!`,
    title: 'Forgot your password? It happens!',
    lead: 'The guardian bear got a request to open the magic door of your island. Press the button and choose a new password: the kids’ worlds are waiting right where you left off.',
    button: 'Choose a new password',
    expires: (min) => `The link works for ${min} minutes and only once.`,
    ignore: 'If you didn’t ask to change your password, just ignore this email: your old password keeps working and the door stays locked.',
    fallback: 'Button not working? Copy this link into your browser:',
    bear: 'I guard the door while you’re away!',
    footer: 'This email was sent automatically, no need to reply.',
  },
};

export const mailLocale = (value: unknown): MailLocale =>
  MAIL_LOCALES.includes(value as MailLocale) ? (value as MailLocale) : 'ru';
