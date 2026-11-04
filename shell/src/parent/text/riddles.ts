import type { Locale } from '@/i18n/locale';

/**
 * Загадки входа в кабинет. Порядок совпадает с RIDDLE_ANSWERS на сервере
 * (platform/server/src/modules/parent/gate.ts): 4, 4, 2, 3, 11, 12, 9. Ответов здесь нет.
 */
export const RIDDLES: Record<Locale, string[]> = {
  ru: [
    'У Ани три брата. У каждого брата одна сестра. Сколько всего детей в семье?',
    'Одно яйцо варится 4 минуты. Сколько минут варятся три яйца в одной кастрюле?',
    'Кирпич весит 1 кг и ещё полкирпича. Сколько килограммов весит кирпич?',
    'В корзине 5 яблок. Вы взяли из неё 3. Сколько яблок у вас?',
    'Сейчас 9:40. Мультфильм идёт 1 час 35 минут. В котором часу он закончится? Введите только час.',
    'В скольких месяцах года есть 28-е число?',
    'У пастуха было 17 овец. Все, кроме 9, убежали. Сколько овец осталось?',
  ],
  uk: [
    'В Ані три брати. У кожного брата одна сестра. Скільки всього дітей у родині?',
    'Одне яйце вариться 4 хвилини. Скільки хвилин варяться три яйця в одній каструлі?',
    'Цеглина важить 1 кг і ще пів цеглини. Скільки кілограмів важить цеглина?',
    'У кошику 5 яблук. Ви взяли з нього 3. Скільки яблук у вас?',
    'Зараз 9:40. Мультфільм триває 1 годину 35 хвилин. О котрій годині він закінчиться? Введіть лише годину.',
    'У скількох місяцях року є 28-ме число?',
    'У пастуха було 17 овець. Усі, крім 9, утекли. Скільки овець залишилося?',
  ],
  ro: [
    'Ana are trei frați. Fiecare frate are o soră. Câți copii sunt în familie?',
    'Un ou fierbe 4 minute. Câte minute fierb trei ouă în aceeași oală?',
    'O cărămidă cântărește 1 kg plus încă jumătate de cărămidă. Câte kilograme cântărește cărămida?',
    'În coș sunt 5 mere. Ați luat 3 dintre ele. Câte mere aveți?',
    'Acum este 9:40. Desenul animat durează 1 oră și 35 de minute. La ce oră se termină? Scrieți doar ora.',
    'În câte luni ale anului există ziua de 28?',
    'Un cioban avea 17 oi. Toate, în afară de 9, au fugit. Câte oi au rămas?',
  ],
  en: [
    'Anna has three brothers. Each brother has one sister. How many children are in the family?',
    'One egg takes 4 minutes to boil. How many minutes do three eggs take in the same pot?',
    'A brick weighs 1 kg plus half a brick. How many kilograms does the brick weigh?',
    'There are 5 apples in a basket. You take 3. How many apples do you have?',
    'It is 9:40. A cartoon lasts 1 hour 35 minutes. At what hour does it end? Enter the hour only.',
    'How many months of the year have a 28th day?',
    'A shepherd had 17 sheep. All but 9 ran away. How many sheep are left?',
  ],
};
