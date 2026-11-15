// Формы ответов /api/admin (см. platform/server/src/modules/admin).

export interface Delta { value: number; change: number | null }
export interface Overview {
  days: number; today: string;
  totals: { families: number; children: number };
  newFamilies: Delta; activeToday: Delta; minutesToday: Delta; minutesPeriod: Delta; activePeriod: Delta;
  pendingRequests: number;
  errors24h: { total: number; fresh: number };
  mail24h: { sent: number; failed: number };
  series: { day: string; minutes: number; active: number; families: number }[];
  topGames: { id: string; title: string; minutes: number }[];
  playingNow: { children: number; games: { id: string; title: string | null; count: number }[] };
  languages: Record<string, number>; ages: Record<string, number>; devices: Record<string, number>;
}

export interface Check { id: string; ok: boolean; note: string }
export interface Health {
  at: string; checks: Check[];
  jobs: { job: string; ok: boolean; lastAt: string | null; note: string }[];
  tables: { name: string; bytes: number; row_estimate: number }[];
  limits: { dbBytes: number | null; dbLimit: number; mailsToday: number; mailsLimit: number };
}

export interface FamilyRow {
  id: string; name: string; email: string; children: number; locale: string | null; createdAt: string;
  lastSeenAt: string | null; consent: boolean; frozen: boolean; deleteAfter: string | null; pinLocked: boolean;
}
export interface Paged<T> { total: number; page: number; pageSize: number; items: T[] }

export interface Save { gameId: string; kind: 'cloud' | 'table'; items: number; bytes?: number; updatedAt?: string; table?: string }
export interface Child {
  id: string; name: string; age: number; avatar: string; createdAt: string; deletedAt: string | null; purgeAt: string | null;
  hasPhoto: boolean; settings: Record<string, unknown>; access: { gameId: string; allowed: boolean }[];
  week: { day: string; games: { gameId: string; minutes: number }[] }[];
  stickers: number; skills: { skill: string; total: number; right: number; recent: number; level: string }[]; saves: Save[];
}
export interface Family {
  parent: {
    id: string; name: string; email: string; createdAt: string; lastSeenAt: string | null; consentAt: string | null;
    policyVersion: string | null; inactiveWarnedAt: string | null; frozenAt: string | null; deleteAfter: string | null;
  };
  settings: { timezone: string | null; mailLocale: string | null; weeklyReport: boolean; notifyRequests: boolean; onboarded: boolean; hasPin: boolean; pinLockedUntil: string | null; hasPhoto: boolean };
  sessions: number;
  helpers: { id: string; name: string; email: string | null; child_ids: string[] | null; last_used_at: string | null }[];
  requests: { child_id: string; minutes: number; status: string; from_parent: boolean; created_at: string }[];
  children: Child[];
}

export interface Game {
  id: string; title: string; emoji: string; kind: string; ages: { min: number; max: number }; skills: string[]; stickers: number;
  hasServer: boolean; serverOk: boolean; disabled: boolean; minutes: number; players: number; levels: number; answers: number; rightShare: number | null;
  /** Где бросают чаще всего: level '' — до первого уровня; null — никто не бросил. */
  quit: DropoffWorst | null;
}

export interface DropoffWorst { level: string; quit: number; share: number }
export interface Dropoff {
  players: number; active: number; quitBeforeFirst: number;
  levels: { name: string; reached: number; quit: number }[];
  worst: DropoffWorst | null;
}

export interface Retention {
  rules: { inactiveDays: number; warnDays: number; trashDays: number };
  inactive: { id: string; name: string; email: string; idleDays: number; warnedAt: string | null; deleteAt: string | null }[];
  deleting: { id: string; name: string; email: string; deleteAfter: string }[];
  trash: { id: string; parentId: string; name: string; age: number; avatar: string; deletedAt: string; purgeAt: string }[];
}

export type Lang = 'ru' | 'uk' | 'ro' | 'en';
export type Texts = Partial<Record<Lang, string>>;
export interface SiteFlags { maintenance: boolean; banner: Texts; disabled_games: string[]; admin_readonly: boolean }
export interface News { id: string; day: string; titles: Texts; bodies: Texts; published: boolean }
export interface Me { email: string; expiresAt: string; readonly: boolean }
export type Row = Record<string, unknown>;
