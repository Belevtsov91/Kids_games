import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'robot',
  title: 'Робот-курьер',
  titles: { uk: 'Робот-курʼєр', ro: 'Robotul curier', en: 'Robot Courier' },
  emoji: '📦',
  kind: '2d',
  ages: { min: 5, max: 10 },
  skills: ['logic', 'space'],
  stickers: [
    { id: 'first-parcel', emoji: '📦', title: 'Первая посылка', titles: { uk: 'Перша посилка', ro: 'Primul colet', en: 'First parcel' } },
    { id: 'loop-master', emoji: '🔁', title: 'Мастер повторов', titles: { uk: 'Майстер повторів', ro: 'Maestrul repetărilor', en: 'Loop master' } },
    { id: 'smart-robot', emoji: '❓', title: 'Умный робот', titles: { uk: 'Розумний робот', ro: 'Robotul isteț', en: 'Smart robot' } },
    { id: 'super-courier', emoji: '🏅', title: 'Супер-курьер', titles: { uk: 'Супер-курʼєр', ro: 'Super-curier', en: 'Super courier' } },
  ],
  about: 'Алгоритмы шаг за шагом: повороты на месте, циклы «повтори» и условия «если». Ребёнок планирует путь, проверяет программу и ищет ошибки.',
  abouts: {
    uk: 'Алгоритми крок за кроком: повороти на місці, цикли «повтори» й умови «якщо». Дитина планує шлях, перевіряє програму й шукає помилки.',
    ro: 'Algoritmi pas cu pas: întoarceri pe loc, bucle „repetă” și condiții „dacă”. Copilul plănuiește drumul, verifică programul și caută greșelile.',
    en: 'Algorithms step by step: turning on the spot, repeat loops and if conditions. The child plans a route, tests the program and hunts for bugs.',
  },
  together: 'Поверните планшет или встаньте сами на место робота: «куда я смотрю, если повернуть налево?». На уровнях с «повтори» спросите, какой кусок пути повторяется.',
  togethers: {
    uk: 'Поверніть планшет або станьте самі на місце робота: «куди я дивлюся, якщо повернути ліворуч?». На рівнях із «повтори» спитайте, який шматок шляху повторюється.',
    ro: 'Rotiți tableta sau puneți-vă în locul robotului: „încotro mă uit dacă mă întorc la stânga?”. La nivelurile cu „repetă” întrebați ce bucată de drum se repetă.',
    en: 'Turn the tablet or stand in for the robot yourself: "which way am I facing if I turn left?". On the repeat levels, ask which part of the route repeats.',
  },
  tagline: 'Запрограммируй робота и развези посылки Тёпе и друзьям.',
  taglines: {
    uk: 'Запрограмуй робота й розвези посилки Тьопі та друзям.',
    ro: 'Programează robotul și du coletele lui Tiopa și prietenilor.',
    en: 'Program the robot and deliver parcels to Tyopa and friends.',
  },
  color: '#ffb35c',
  addedAt: '2026-11-15',
});
