import { useParentText } from '../text';
import { ToggleRow } from './bits';

/** Порядок строк: с понедельника по воскресенье. В массиве дни идут с воскресенья (0), как на сервере. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  /** 7 чисел с воскресенья по субботу, 0 — без лимита; null — работают будни и выходные. */
  value: number[] | null;
  /** С чего начать, когда включают свои дни. */
  weekday: number | null;
  weekend: number | null;
  onChange: (days: number[] | null, saveNow: boolean) => void;
}

/** Свой лимит на каждый день недели: ползунок от 0 («без лимита») до 4 часов. */
export function DayLimits({ value, weekday, weekend, onChange }: Props) {
  const p = useParentText();
  const d = p.dayLimits;
  const start = () => Array.from({ length: 7 }, (_, i) => (i === 0 || i === 6 ? weekend : weekday) ?? 0);
  const set = (day: number, minutes: number, saveNow: boolean) => value && onChange(value.map((m, i) => (i === day ? minutes : m)), saveNow);
  return (
    <div className="pa-limit">
      <ToggleRow id="limit-days-on" label={d.title} hint={d.lead} checked={value !== null} onChange={(on) => onChange(on ? start() : null, true)} />
      {value && (
        <div className="pa-days">
          {ORDER.map((day) => (
            <div className="pa-day" key={day}>
              <b>{p.days[day]}</b>
              <input
                type="range"
                min={0}
                max={240}
                step={15}
                value={value[day]}
                aria-label={p.days[day]}
                onChange={(e) => set(day, Number(e.target.value), false)}
                onPointerUp={(e) => set(day, Number((e.target as HTMLInputElement).value), true)}
                onKeyUp={(e) => set(day, Number((e.target as HTMLInputElement).value), true)}
              />
              <output>{value[day] ? p.hm(value[day]) : d.free}</output>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
