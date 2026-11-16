// Набор: русский.
import { CYRILLIC } from '../game/morse';
import type { Pack } from './types';

export const ru: Pack = {
  alphabet: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
  morse: CYRILLIC,
  words: [
    { word: 'КОТ', emoji: '🐱' },
    { word: 'ЛЕС', emoji: '🌲' },
    { word: 'СОК', emoji: '🧃' },
    { word: 'ДОМ', emoji: '🏠' },
    { word: 'СЫР', emoji: '🧀' },
    { word: 'ЛУНА', emoji: '🌙' },
    { word: 'РЫБА', emoji: '🐟' },
    { word: 'СОВА', emoji: '🦉' },
    { word: 'ЛОДКА', emoji: '⛵' },
    { word: 'ЗАМОК', emoji: '🏰' },
    { word: 'ПОЧТА', emoji: '📮' },
    { word: 'ЗВЕЗДА', emoji: '⭐' },
    { word: 'ПИСЬМО', emoji: '✉️' },
    { word: 'РАКЕТА', emoji: '🚀' },
    { word: 'ОСТРОВ', emoji: '🏝️' },
    { word: 'ЯБЛОКО', emoji: '🍎' },
  ],
  riddles: [
    {
      question: 'У папы Тёпы три сына: Пых, Пах и… Как зовут третьего?',
      choices: [{ text: 'Тёпа', emoji: '🐻' }, { text: 'Пох', emoji: '🐼' }, { text: 'Пух', emoji: '🧸' }, { text: 'Пех', emoji: '🐨' }],
    },
    {
      question: 'Продолжи ряд: 2, 4, 8, 16, …',
      choices: [{ text: '32', emoji: '🔢' }, { text: '24', emoji: '🔢' }, { text: '18', emoji: '🔢' }, { text: '20', emoji: '🔢' }],
    },
    {
      question: 'Каждая буква сдвинута на одну вперёд: ЛПУ. Какое это слово?',
      choices: [{ text: 'КОТ', emoji: '🐱' }, { text: 'ЛОТ', emoji: '📦' }, { text: 'КИТ', emoji: '🐳' }, { text: 'РОТ', emoji: '👄' }],
    },
    {
      question: 'Сколько месяцев в году имеют 28 дней?',
      choices: [{ text: 'Все 12', emoji: '📅' }, { text: 'Один', emoji: '1️⃣' }, { text: 'Два', emoji: '2️⃣' }, { text: 'Ни одного', emoji: '0️⃣' }],
    },
    {
      question: 'Что принадлежит тебе, но другие пользуются этим чаще тебя?',
      choices: [{ text: 'Имя', emoji: '🏷️' }, { text: 'Зубная щётка', emoji: '🪥' }, { text: 'Тень', emoji: '👤' }, { text: 'Шапка', emoji: '🧢' }],
    },
    {
      question: 'Чем больше из неё берёшь, тем больше она становится. Что это?',
      choices: [{ text: 'Яма', emoji: '🕳️' }, { text: 'Корзина', emoji: '🧺' }, { text: 'Река', emoji: '🌊' }, { text: 'Копилка', emoji: '🐷' }],
    },
    {
      question: 'Какое число станет больше на 3, если его перевернуть вверх ногами?',
      choices: [{ text: '6', emoji: '🙃' }, { text: '8', emoji: '🔢' }, { text: '1', emoji: '🔢' }, { text: '0', emoji: '🔢' }],
    },
    {
      question: 'Что идёт, не трогаясь с места?',
      choices: [{ text: 'Часы', emoji: '⏰' }, { text: 'Дождь', emoji: '🌧️' }, { text: 'Поезд', emoji: '🚂' }, { text: 'Улитка', emoji: '🐌' }],
    },
    {
      question: 'В азбуке Морзе «•••» — это С, «———» — это О. Что значит «••• ——— •••»?',
      choices: [{ text: 'SOS, помогите!', emoji: '🆘' }, { text: 'Привет', emoji: '👋' }, { text: 'Спокойной ночи', emoji: '🌙' }, { text: 'Всё хорошо', emoji: '👍' }],
    },
    {
      question: 'Без рук, без ног, а ворота открывает. Кто это?',
      choices: [{ text: 'Ветер', emoji: '🌬️' }, { text: 'Кот', emoji: '🐱' }, { text: 'Ключ', emoji: '🔑' }, { text: 'Снег', emoji: '❄️' }],
    },
  ],
};
