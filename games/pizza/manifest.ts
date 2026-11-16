import { defineManifest } from '@ig/sdk';

export default defineManifest({
  id: 'pizza',
  title: 'Пиццерия дробей',
  titles: { uk: 'Піцерія дробів', ro: 'Pizzeria fracțiilor', en: 'Fraction Pizzeria' },
  emoji: '🍕',
  kind: '2d',
  ages: { min: 8, max: 12 },
  skills: ['numbers', 'logic'],
  stickers: [
    { id: 'first-pizza', emoji: '🍕', title: 'Первая пицца', titles: { uk: 'Перша піца', ro: 'Prima pizza', en: 'First pizza' } },
    { id: 'equal-slices', emoji: '🔪', title: 'Половина — это четыре восьмых', titles: { uk: 'Половина — це чотири восьмих', ro: 'O jumătate e patru optimi', en: 'A half is four eighths' } },
    { id: 'pizza-master', emoji: '👨‍🍳', title: 'Мастер пиццы', titles: { uk: 'Майстер піци', ro: 'Maestrul pizzei', en: 'Pizza master' } },
  ],
  about: 'Дроби на пицце: ребёнок режет пиццу на равные куски, собирает заказы вроде «3/8 с грибами», видит, что 1/2 = 4/8, и складывает доли с разными знаменателями.',
  abouts: {
    uk: 'Дроби на піці: дитина ріже піцу на рівні шматки, збирає замовлення на кшталт «3/8 з грибами», бачить, що 1/2 = 4/8, і додає частки з різними знаменниками.',
    ro: 'Fracții pe pizza: copilul taie pizza în felii egale, pregătește comenzi precum „3/8 cu ciuperci”, vede că 1/2 = 4/8 și adună părți cu numitori diferiți.',
    en: 'Fractions on pizza: the child cuts pizza into equal slices, fills orders like “3/8 mushroom”, sees that 1/2 = 4/8 and adds shares with different denominators.',
  },
  together: 'Испеките или нарежьте настоящую пиццу (или пирог) и спросите: «Если съесть два куска из восьми, сколько останется?» Пусть ребёнок объяснит, почему 1/3 нельзя ровно разрезать на 8 кусков.',
  togethers: {
    uk: 'Наріжте справжню піцу (або пиріг) і запитайте: «Якщо з’їсти два шматки з восьми, скільки залишиться?» Нехай дитина пояснить, чому 1/3 не можна рівно розрізати на 8 шматків.',
    ro: 'Tăiați o pizza adevărată (sau o plăcintă) și întrebați: „Dacă mâncăm două felii din opt, cât rămâne?” Lăsați copilul să explice de ce 1/3 nu se poate tăia exact în 8 felii.',
    en: 'Cut a real pizza (or pie) and ask: “If we eat two slices out of eight, how much is left?” Let your child explain why 1/3 can’t be cut evenly into 8 slices.',
  },
  tagline: 'Режь, клади начинку и пеки пиццу по заказу.',
  taglines: { uk: 'Ріж, клади начинку й печи піцу на замовлення.', ro: 'Taie, pune toppingul și coace pizza la comandă.', en: 'Slice it, top it and bake pizza to order.' },
  color: '#ff9f5a',
  addedAt: '2026-11-15',
});
