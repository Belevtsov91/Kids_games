// Набор пэдов 4×4: каждый ряд — своя группа инструментов и свой цвет, как на обложке.
// Бас и аккорды в одной тональности (ля минор: Am–F–C–G), так что любое сочетание звучит ладно.

export type Row = 'drums' | 'bass' | 'keys' | 'fx';

export type Voice =
  | { kind: 'kick' }
  | { kind: 'snare' }
  | { kind: 'hat' }
  | { kind: 'clap' }
  | { kind: 'bass'; freq: number }
  | { kind: 'chord'; freqs: number[] }
  | { kind: 'vox' }
  | { kind: 'zap' }
  | { kind: 'bell' }
  | { kind: 'scratch' };

export interface Pad {
  index: number;
  row: Row;
  voice: Voice;
  /** Клавиша на клавиатуре компьютера. */
  key: string;
}

export const ROWS: Row[] = ['drums', 'bass', 'keys', 'fx'];
export const ROW_COLORS: Record<Row, string> = { drums: '#ff5c9a', bass: '#ffcf4a', keys: '#4fe3c1', fx: '#6a8cff' };

const VOICES: Voice[] = [
  { kind: 'kick' },
  { kind: 'snare' },
  { kind: 'hat' },
  { kind: 'clap' },
  { kind: 'bass', freq: 55 },
  { kind: 'bass', freq: 43.65 },
  { kind: 'bass', freq: 65.41 },
  { kind: 'bass', freq: 49 },
  { kind: 'chord', freqs: [220, 261.63, 329.63] },
  { kind: 'chord', freqs: [174.61, 220, 261.63] },
  { kind: 'chord', freqs: [261.63, 329.63, 392] },
  { kind: 'chord', freqs: [196, 246.94, 293.66] },
  { kind: 'vox' },
  { kind: 'zap' },
  { kind: 'bell' },
  { kind: 'scratch' },
];

/** Раскладка как у 4×4 контроллеров: 1234 / QWER / ASDF / ZXCV. */
const KEYS = '1234qwerasdfzxcv';

export const PAD_LIST: Pad[] = VOICES.map((voice, index) => ({
  index,
  row: ROWS[Math.floor(index / 4)]!,
  voice,
  key: KEYS[index]!,
}));

export const padByKey = (key: string) => PAD_LIST.find((p) => p.key === key.toLowerCase());
