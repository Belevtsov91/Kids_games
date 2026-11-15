// Начинки: эмодзи на куске и цвет «соуса», чтобы доля была видна издалека.

export const TOPPINGS = ['mushroom', 'cheese', 'sausage', 'olive', 'pepper', 'pineapple', 'tomato'] as const;
export type Topping = (typeof TOPPINGS)[number];

export const TOPPING_ART: Record<Topping, { emoji: string; color: string }> = {
  mushroom: { emoji: '🍄', color: '#d9b38c' },
  cheese: { emoji: '🧀', color: '#ffe066' },
  sausage: { emoji: '🌭', color: '#ef6f6c' },
  olive: { emoji: '🫒', color: '#8fb36b' },
  pepper: { emoji: '🫑', color: '#6fcf7a' },
  pineapple: { emoji: '🍍', color: '#ffd166' },
  tomato: { emoji: '🍅', color: '#ff8c69' },
};

export const isTopping = (value: unknown): value is Topping => (TOPPINGS as readonly unknown[]).includes(value);
