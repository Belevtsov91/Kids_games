/** Те же аватары, что при создании профиля (страница «Кто играет?»). */
export const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐸', '🦁', '🐯', '🐨', '🐵', '🦄', '🐙', '🐳'];

/** «− 5 лет +»: возраст от min до max. */
export function Stepper({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (v: number) => void }) {
  return (
    <div className="pa-stepper">
      <button type="button" aria-label="−" disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <output>{label}</output>
      <button type="button" aria-label="+" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
