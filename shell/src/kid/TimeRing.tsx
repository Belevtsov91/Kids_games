import type { KidTime } from './KidStatus';

/** Кольцо «сколько сыграно из лимита». Без лимита — полное мятное кольцо с минутами за сегодня. */
export function TimeRing({ time, size = 120 }: { time: KidTime; size?: number }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const part = time.limit ? Math.min(time.usedMinutes / time.limit, 1) : 1;
  const tone = time.blocked ? '#ff5c7a' : time.limit === null ? '#7ef09a' : time.remaining! <= 5 ? '#ff9f43' : '#ffd25a';
  const big = time.limit === null ? time.usedMinutes : time.remaining!;
  return (
    <svg className="time-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="10" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${c * part} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#fff8ec" fontSize={size / 3.6} fontWeight="900">
        {time.blocked === 'quiet' ? '🌙' : big}
      </text>
    </svg>
  );
}
