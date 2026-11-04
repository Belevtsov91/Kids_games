const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Полоса суток 0–24: тихие часы заштрихованы (и через полночь), жёлтая черта — сейчас. */
export function QuietDay({ from, to }: { from: string; to: string }) {
  const a = mins(from), b = mins(to);
  const bands = a <= b ? [[a, b]] : [[a, 1440], [0, b]];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pct = (m: number) => `${(m / 1440) * 100}%`;
  return (
    <div className="pa-day">
      <div className="pa-day-bar" aria-hidden="true">
        {bands.map(([s, e]) => (
          <span key={s} className="pa-day-quiet" style={{ left: pct(s), width: pct(e - s) }} />
        ))}
        <span className="pa-day-now" style={{ left: pct(nowMin) }} />
      </div>
      <div className="pa-day-scale" aria-hidden="true">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}
