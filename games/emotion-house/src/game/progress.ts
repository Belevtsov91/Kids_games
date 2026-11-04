// Прогресс: сколько раз ребёнок узнал каждую эмоцию (комнаты домика зажигаются) и дневник настроения.
import { EMOTIONS, STARTER, type Emotion } from './emotions';

export const ROOM_FULL = 3;
/** После стольких верных ответов открываются все шесть эмоций. */
export const UNLOCK_ALL_AT = 6;
/** После стольких — ситуации показываются без подсказки-лица: эмоцию надо понять по истории. */
export const NO_FACE_AT = 12;
const DIARY_MAX = 30;

export interface Progress {
  rooms: Partial<Record<Emotion, number>>;
  correct: number;
  diary: { day: string; emotion: Emotion }[];
}

export const emptyProgress = (): Progress => ({ rooms: {}, correct: 0, diary: [] });

export const openEmotions = (p: Progress): readonly Emotion[] => (p.correct >= UNLOCK_ALL_AT ? EMOTIONS : STARTER);
export const showFaces = (p: Progress) => p.correct < NO_FACE_AT;
export const litRooms = (p: Progress) => EMOTIONS.filter((e) => (p.rooms[e] ?? 0) >= ROOM_FULL).length;

export function recordCorrect(p: Progress, e: Emotion): Progress {
  return { ...p, correct: p.correct + 1, rooms: { ...p.rooms, [e]: Math.min(ROOM_FULL, (p.rooms[e] ?? 0) + 1) } };
}

/** Отметка «как я себя чувствую»: одна на день, последняя побеждает. */
export function recordFeeling(p: Progress, day: string, emotion: Emotion): Progress {
  const diary = [...p.diary.filter((d) => d.day !== day), { day, emotion }].slice(-DIARY_MAX);
  return { ...p, diary };
}

const isEmotion = (v: unknown): v is Emotion => (EMOTIONS as readonly unknown[]).includes(v);

export function readProgress(raw: unknown): Progress {
  const r = raw as Partial<Progress> | null;
  if (!r || typeof r !== 'object') return emptyProgress();
  const rooms: Progress['rooms'] = {};
  for (const e of EMOTIONS) {
    const n = Number(r.rooms?.[e]);
    if (n > 0) rooms[e] = Math.min(ROOM_FULL, Math.floor(n));
  }
  const diary = Array.isArray(r.diary) ? r.diary.filter((d) => typeof d?.day === 'string' && isEmotion(d.emotion)) : [];
  return { rooms, correct: Math.max(0, Math.floor(Number(r.correct) || 0)), diary: diary.slice(-DIARY_MAX) };
}
