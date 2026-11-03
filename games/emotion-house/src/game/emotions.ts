// Эмоции, комнаты домика и что помогает при каждой. Без DOM — покрыто тестами.

export const EMOTIONS = ['joy', 'sad', 'anger', 'fear', 'surprise', 'calm'] as const;
export type Emotion = (typeof EMOTIONS)[number];

/** Первые три эмоции — с самого начала, остальные открываются по мере игры. */
export const STARTER: readonly Emotion[] = ['joy', 'sad', 'anger'];

export const FACE: Record<Emotion, string> = { joy: '😄', sad: '😢', anger: '😠', fear: '😨', surprise: '😲', calm: '😌' };
export const COLOR: Record<Emotion, string> = {
  joy: '#ffd84d', sad: '#7db8ff', anger: '#ff7b6b', fear: '#b79cff', surprise: '#ffad5c', calm: '#7ed9a0',
};

export const ACTIONS = ['hug', 'talk', 'dance', 'draw', 'breathe', 'squeeze', 'count', 'hand', 'light', 'ask', 'look', 'rest', 'read', 'music'] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_ART: Record<Action, string> = {
  hug: '🤗', talk: '🗣️', dance: '💃', draw: '🖍️', breathe: '🌬️', squeeze: '🧸', count: '🖐️',
  hand: '🤝', light: '💡', ask: '❓', look: '🔍', rest: '😴', read: '📖', music: '🎵',
};

/** Что помогает при эмоции (или что с ней можно сделать): все варианты верные. */
export const HELPERS: Record<Emotion, readonly Action[]> = {
  joy: ['talk', 'dance', 'hug'],
  sad: ['hug', 'talk', 'draw'],
  anger: ['breathe', 'squeeze', 'count'],
  fear: ['hand', 'light', 'breathe'],
  surprise: ['ask', 'look', 'talk'],
  calm: ['rest', 'read', 'music'],
};
