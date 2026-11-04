/** Столбики «минут в день». Подписи — день недели; сегодня выделено. Шкала по максимуму, кратному 30. */
export function DayBars({
  days,
  dayNames,
  limit,
  unit = 'min',
}: {
  days: { day: string; minutes: number }[];
  dayNames: string[];
  limit?: number | null;
  unit?: string;
}) {
  const W = 560, H = 200, left = 34, bottom = 26, top = 12;
  const max = Math.max(30, Math.ceil(Math.max(...days.map((d) => d.minutes), limit ?? 0) / 30) * 30);
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  const step = (W - left - 8) / days.length;
  const bar = Math.min(34, step * 0.62);
  const ticks = Array.from({ length: max / 30 + 1 }, (_, i) => i * 30).filter((v, _, all) => all.length <= 6 || v % 60 === 0);
  const long = days.length > 10;

  return (
    <svg className="day-bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={days.map((d) => `${d.day}: ${d.minutes} ${unit}`).join(', ')}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={left} x2={W - 4} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.12)" />
          <text x={left - 6} y={y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ))}
      {limit ? <line x1={left} x2={W - 4} y1={y(limit)} y2={y(limit)} stroke="#ffd25a" strokeDasharray="6 5" strokeWidth="2" /> : null}
      {days.map((d, i) => {
        const x = left + step * i + (step - bar) / 2;
        const today = i === days.length - 1;
        const weekday = new Date(`${d.day}T12:00:00Z`).getUTCDay();
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={y(d.minutes)}
              width={bar}
              height={Math.max(0, y(0) - y(d.minutes))}
              rx="6"
              fill={today ? '#ffd25a' : d.minutes > (limit ?? Infinity) ? '#ff7eb6' : '#7ee7ff'}
            >
              <title>{`${d.day}: ${d.minutes} ${unit}`}</title>
            </rect>
            {(!long || i % 2 === days.length % 2 || today) && (
              <text x={x + bar / 2} y={H - 8} textAnchor="middle" className={today ? 'is-today' : ''}>
                {long ? d.day.slice(8) : dayNames[weekday]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
