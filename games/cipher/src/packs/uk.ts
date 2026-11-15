// Набір: українська.
import { UKRAINIAN } from '../game/morse';
import type { Pack } from './types';

export const uk: Pack = {
  alphabet: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ',
  morse: UKRAINIAN,
  words: [
    { word: 'КІТ', emoji: '🐱' },
    { word: 'ЛІС', emoji: '🌲' },
    { word: 'СІК', emoji: '🧃' },
    { word: 'ДІМ', emoji: '🏠' },
    { word: 'СИР', emoji: '🧀' },
    { word: 'ЛЕВ', emoji: '🦁' },
    { word: 'РИБА', emoji: '🐟' },
    { word: 'СОВА', emoji: '🦉' },
    { word: 'ЛИСТ', emoji: '✉️' },
    { word: 'ЧОВЕН', emoji: '⛵' },
    { word: 'ЗАМОК', emoji: '🏰' },
    { word: 'ПОШТА', emoji: '📮' },
    { word: 'ЗІРКА', emoji: '⭐' },
    { word: 'РАКЕТА', emoji: '🚀' },
    { word: 'ОСТРІВ', emoji: '🏝️' },
    { word: 'ЯБЛУКО', emoji: '🍎' },
  ],
  riddles: [
    {
      question: 'У тата Тьопи три сини: Пих, Пах і… Як звати третього?',
      choices: [{ text: 'Тьопа', emoji: '🐻' }, { text: 'Пох', emoji: '🐼' }, { text: 'Пух', emoji: '🧸' }, { text: 'Пех', emoji: '🐨' }],
    },
    {
      question: 'Продовж ряд: 2, 4, 8, 16, …',
      choices: [{ text: '32', emoji: '🔢' }, { text: '24', emoji: '🔢' }, { text: '18', emoji: '🔢' }, { text: '20', emoji: '🔢' }],
    },
    {
      question: 'Кожну літеру зсунуто на одну вперед: ЛЇУ. Яке це слово?',
      choices: [{ text: 'КІТ', emoji: '🐱' }, { text: 'КИТ', emoji: '🐳' }, { text: 'ЛІТ', emoji: '✈️' }, { text: 'РІТ', emoji: '👄' }],
    },
    {
      question: 'Скільки місяців на рік мають 28 днів?',
      choices: [{ text: 'Усі 12', emoji: '📅' }, { text: 'Один', emoji: '1️⃣' }, { text: 'Два', emoji: '2️⃣' }, { text: 'Жодного', emoji: '0️⃣' }],
    },
    {
      question: 'Що належить тобі, але інші користуються цим частіше за тебе?',
      choices: [{ text: 'Імʼя', emoji: '🏷️' }, { text: 'Зубна щітка', emoji: '🪥' }, { text: 'Тінь', emoji: '👤' }, { text: 'Шапка', emoji: '🧢' }],
    },
    {
      question: 'Що більше з неї береш, то більшою вона стає. Що це?',
      choices: [{ text: 'Яма', emoji: '🕳️' }, { text: 'Кошик', emoji: '🧺' }, { text: 'Річка', emoji: '🌊' }, { text: 'Скарбничка', emoji: '🐷' }],
    },
    {
      question: 'Яке число стане більшим на 3, якщо його перевернути догори дриґом?',
      choices: [{ text: '6', emoji: '🙃' }, { text: '8', emoji: '🔢' }, { text: '1', emoji: '🔢' }, { text: '0', emoji: '🔢' }],
    },
    {
      question: 'Що йде, не рушаючи з місця?',
      choices: [{ text: 'Годинник', emoji: '⏰' }, { text: 'Дощ', emoji: '🌧️' }, { text: 'Потяг', emoji: '🚂' }, { text: 'Равлик', emoji: '🐌' }],
    },
    {
      question: 'В абетці Морзе «•••» — це С, «———» — це О. Що означає «••• ——— •••»?',
      choices: [{ text: 'SOS, рятуйте!', emoji: '🆘' }, { text: 'Привіт', emoji: '👋' }, { text: 'На добраніч', emoji: '🌙' }, { text: 'Усе добре', emoji: '👍' }],
    },
    {
      question: 'Без рук, без ніг, а ворота відчиняє. Хто це?',
      choices: [{ text: 'Вітер', emoji: '🌬️' }, { text: 'Кіт', emoji: '🐱' }, { text: 'Ключ', emoji: '🔑' }, { text: 'Сніг', emoji: '❄️' }],
    },
  ],
};
